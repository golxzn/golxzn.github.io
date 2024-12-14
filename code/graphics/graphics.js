
class graphics {
	constructor(canvas) {
		if (!gl) {
			alert("Cannot get WebGL2 Context! Seems like it isn't supported!");
			return;
		}

		const m = golxzn.math.mat4;
		const pipelines = get_service("pipeline");

		this.active_camera = null;
		this.pipeline_stack = [];
		this.transform_stack = [m.make_identity()];
		this.projection_stack = [];
		this.view_stack = [];

		this.directional_lights = null;
		this.point_lights = [];
		this.spot_lights = [];

		this.bound_textures = 0;
		this.spotlight_shadow_map_texture = null;

		this.active_pass = 0;
		this.render_size = golxzn.math.scale([canvas.width, canvas.height], SETTINGS.graphics.render_scale);
		this.render_passes = {
			spotlight_shadow: new render_pass("Spotlight Shadows", new framebuffer(SETTINGS.graphics.shadow_resolution, [ {
				type: attachment_type.texture_array,
				layers: SHADERS_COMMON.MAX_SPOT_LIGHT_COLORS,
				format: gl.DEPTH_COMPONENT,
				internal: gl.DEPTH_COMPONENT32F,
				attachment: gl.DEPTH_ATTACHMENT,
				data_type: gl.FLOAT,
				parameters: {
					[gl.TEXTURE_MIN_FILTER]: gl.NEAREST,
					[gl.TEXTURE_MAG_FILTER]: gl.NEAREST,
					[gl.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
					[gl.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE,
				}
			} ]), [
				gl.CULL_FACE,
				gl.DEPTH_TEST
			], {
				bind: function(pass, graphics) {
					gl.cullFace(gl.FRONT);
					gl.frontFace(gl.CCW);
					gl.depthFunc(gl.LEQUAL);
					gl.depthMask(true);
				},
				unbind: function(pass, graphics) {
				}
			}, pipelines.load("3D", "DEPTH")),

			color: new render_pass("Color", new framebuffer(this.render_size, [
				{ type: attachment_type.texture,      format: gl.RGBA,             attachment: gl.COLOR_ATTACHMENT0 },
				{ type: attachment_type.texture,      format: gl.RGBA,             attachment: gl.COLOR_ATTACHMENT1 },
				{ type: attachment_type.renderbuffer, format: gl.DEPTH24_STENCIL8, attachment: gl.DEPTH_STENCIL_ATTACHMENT  },
			]), [
				gl.CULL_FACE,
				gl.DEPTH_TEST
			], {
				bind: function(pass, graphics) {
					gl.cullFace(gl.FRONT);
					gl.frontFace(gl.CCW);
					gl.depthFunc(gl.LEQUAL);
					gl.depthMask(true);
					gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
				},
				unbind: function(pass, graphics) {
				}
			} ),

			bloom: new render_pass("Bloom", new framebuffer(this.render_size, [
				{ type: attachment_type.texture,  format: gl.RGBA, attachment: gl.COLOR_ATTACHMENT0 },
			]), [], {
				bind: function(pass, graphics) {
					gl.clear(gl.COLOR_BUFFER_BIT);
				},
				unbind: function(pass, graphics) {
				}
			}, pipelines.load("3D", "BLOOM"))
		};
		this._current_render_pass = null;

		this.blit_texture_pipeline = pipelines.load("3D", "BLIT_SCREEN");
		this.blit_mesh = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.blit_mesh);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			-1.0, -1.0,
			 1.0, -1.0,
			-1.0,  1.0,
			 1.0,  1.0,
		]), gl.STATIC_DRAW);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
		gl.enableVertexAttribArray(0);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	}

	render(instance) {
		this.projection_stack = [this.active_camera.make_projection()];
		this.view_stack = [this.active_camera.make_view()];

		// TODO:!!!! RENDER GRAPH

		// Spotlights Shadows
		const shadow_pass = this.render_passes.spotlight_shadow;
		const depth_framebuffer = shadow_pass.framebuffer;
		const spotlight_shadow_maps = depth_framebuffer.texture_array();

		this._current_render_pass = shadow_pass;
		for (var i = 0; i < this.spot_lights.length; ++i) {
			const spotlight = this.spot_lights[i];
			this.push_view(spotlight.view());
			this.push_projection(spotlight.projection());
			shadow_pass.bind(this);

			gl.framebufferTextureLayer(
				gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, spotlight_shadow_maps.handler, 0, i
			);
			gl.clear(gl.DEPTH_BUFFER_BIT);

			if (depth_framebuffer.complete()) {
				instance.render(this);
			}
			shadow_pass.unbind(this);
			this.pop_projection();
			this.pop_view();
		}
		spotlight_shadow_maps.unbind();
		this.spotlight_shadow_map_texture = spotlight_shadow_maps;

		// Point lights Shadows
		// TODO

		// Color pass
		const color_pass = this.render_passes.color;
		this._current_render_pass = color_pass;
		color_pass.bind(this);
		instance.render(this);
		color_pass.unbind(this);


		// Bloom
		const uniforms = {
			u_direction: SETTINGS.graphics.bloom.direction,
			u_weights: SETTINGS.graphics.bloom.weights
		};

		const bloom_pass = this.render_passes.bloom;
		this._current_render_pass = bloom_pass;
		bloom_pass.bind(this);

		// First call to take the original color texture
		this._blit_on_quad(bloom_pass.pipeline, { u_bloom: color_pass.framebuffer.texture(1) }, uniforms);

		for (var i = 1; i < 10; ++i) {
			const bloom_texture = bloom_pass.framebuffer.texture();
			this._blit_on_quad(bloom_pass.pipeline, { u_bloom: bloom_texture }, uniforms);
		}
		bloom_pass.unbind(this);


		// Blit on screen
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		this._blit_on_quad(
			this.blit_texture_pipeline, { // todo replace it
				u_screen: color_pass.framebuffer.texture(0),
				u_bloom: bloom_pass.framebuffer.texture(0),
			}, {
				u_exposure: SETTINGS.graphics.exposure
			}
		);
	}

	set_active_camera(camera) {
		this.active_camera = camera;
		this.active_camera.aspect = this.aspect_ratio();
		this._mvp = null;
	}

	current_render_pass() {
		return this._current_render_pass;
	}

	push_pipeline(pipeline) {
		this.bound_textures = 0;
		this.pipeline_stack.push(pipeline);
		const pass = this.current_render_pass();
		if (pass.has_pipeline()) {
			pass.pipeline.use();
		} else {
			pipeline.use();
		}
	}

	set_engine_uniforms() {
		const pipeline = this.current_pipeline();
		pipeline.set_uniform("u_mvp", this.model_view_projection());
		const u_model_location = pipeline.uniform_location("u_model");
		if (u_model_location ) {
			pipeline.set_uniform(u_model_location, this.current_transform());
			pipeline.set_uniform("u_view_position", this.active_camera.position)
		}

		const u_normal_matrix_location = pipeline.uniform_location("u_normal_matrix");
		if (u_normal_matrix_location) {
			pipeline.set_uniform(u_normal_matrix_location,
				golxzn.math.mat3.inverse(golxzn.math.mat3.build_from(this.current_transform())),
				{ transpose: true }
			);
		}
		if (pipeline.lighting_support()) {
			this.set_engine_lighting_uniforms();
		}
	}

	set_engine_lighting_uniforms() {
		const pipeline = this.current_pipeline();

		this.directional_lights.apply(pipeline, "u_dir_light");

		const u_point_lights_count_location = pipeline.uniform_location('u_point_lights_count');
		if (u_point_lights_count_location == null) return;

		pipeline.set_uniform(u_point_lights_count_location, this.point_lights.length, { as_integer: true });
		for (var i = 0; i < this.point_lights.length; i++) {
			this.point_lights[i].apply(pipeline, `u_point_lights[${i}]`);
		}

		pipeline.set_uniform('u_spot_lights_count', this.spot_lights.length, { as_integer: true });
		for (var i = 0; i < this.spot_lights.length; i++) {
			const light = this.spot_lights[i];
			light.apply(pipeline, `u_spot_lights[${i}]`);
			const transform_location = pipeline.uniform_location(`u_spot_light_transform[${i}]`);
			if (transform_location == null) continue;

			pipeline.set_uniform(transform_location, golxzn.math.mat4.multiply(
				light.view(),
				light.projection()
			));
		}

		if (this.spotlight_shadow_map_texture) {
			this.apply_texture(this.spotlight_shadow_map_texture, "u_spotlight_shadow_map");
		}
	}

	current_pipeline() {
		const pass = this.current_render_pass();
		return pass.has_pipeline() ? pass.pipeline : this.pipeline_stack.at(-1);
	}

	pop_pipeline() {
		this.bound_textures = 0;
		this.pipeline_stack.pop();
	}

	push_transform(matrix) {
		this.transform_stack.push(golxzn.math.mat4.multiply(this.current_transform(), matrix));
	}
	push_view(view) { this.view_stack.push(view); }
	push_projection(proj) { this.projection_stack.push(proj); }

	current_transform() { return this.transform_stack.at(-1); }
	current_projection() { return this.projection_stack.at(-1); }
	current_view() { return this.view_stack.at(-1); }

	pop_projection() { this.projection_stack.pop(); }
	pop_view() { this.view_stack.pop(); }
	pop_transform() {
		this.transform_stack.pop();
	}


	apply_texture(texture, name) {
		const pipeline = this.current_pipeline();
		const location = pipeline.uniform_location(name);
		if (location != null) {
			texture.bind(this.bound_textures);
			pipeline.set_uniform(location, this.bound_textures, { as_integer: true });
			++this.bound_textures;
		}
	}

	apply_material(material) {
		const pipeline = this.current_pipeline();
		if (pipeline.uniform_location("u_material.ambient") != null) {
			pipeline.set_uniform("u_material.ambient", material.ambient);
			pipeline.set_uniform("u_material.diffuse", material.diffuse);
			pipeline.set_uniform("u_material.specular", material.specular);
			pipeline.set_uniform("u_material.shininess", material.shininess);
		}
	}

//============================== draw buffers ==============================//

	draw_array(draw_info, mesh_instance) {
		const vbo = mesh_instance.vao.get_buffer(draw_info.target_buffer);
		mesh_instance.vao.bind();
		gl.drawArrays(draw_info.mode, 0, vbo.info.count);
		mesh_instance.vao.unbind();
	}

	draw_array_transform_feedback(draw_info, mesh_instance) {
		const vbo = mesh_instance.vao.get_buffer(draw_info.target_buffer);
		// We should get this buffer from another VAO!
		const tb = mesh_instance.vao.get_buffer(draw_info.output_buffer);
		mesh_instance.vao.bind();
		gl.bindBufferBase(draw_info.mode, 0, tb);
		gl.beginTransformFeedback(draw_info.mode)
		gl.drawArrays(draw_info.mode, 0, vbo.info.count);
		gl.endTransformFeedback();
		gl.bindBufferBase(draw_info.mode, 0, null);
		mesh_instance.vao.unbind();
	}

	draw_elements(draw_info, mesh_instance) {
		const ebo = mesh_instance.vao.get_buffer(draw_info.target_buffer);
		mesh_instance.vao.bind();
		gl.drawElements(draw_info.mode, ebo.info.count, gl.UNSIGNED_SHORT, 0);
		mesh_instance.vao.unbind();
	}

	draw_instanced_array(draw_info, mesh_instance) {
		const vbo = mesh_instance.vao.get_buffer(draw_info.target_buffer);
		mesh_instance.vao.bind();
		gl.drawArraysInstanced(draw_info.mode, 0, vbo.info.count, draw_info.instances_count);
		mesh_instance.vao.unbind();
	}

	draw_instanced_array_transform_feedback(draw_info, mesh_instance) {
		const vbo = mesh_instance.vao.get_buffer(draw_info.target_buffer);
		const tb = mesh_instance.vao.get_buffer(draw_info.output_buffer);
		mesh_instance.vao.bind();
		gl.bindBufferBase(draw_info.mode, 0, tb);
		gl.beginTransformFeedback(draw_info.mode)
		gl.drawArraysInstanced(draw_info.mode, 0, vbo.info.count, draw_info.instances_count);
		gl.endTransformFeedback();
		gl.bindBufferBase(draw_info.mode, 0, null);
		mesh_instance.vao.unbind();
	}

	draw_instanced_elements(draw_info, mesh_instance) {
		const ebo = mesh_instance.vao.get_buffer(draw_info.target_buffer);
		mesh_instance.vao.bind();
		gl.drawElementsInstanced(draw_info.mode, ebo.info.count, gl.UNSIGNED_SHORT, 0,
			draw_info.instances_count);
		mesh_instance.vao.unbind();
	}

//==========================================================================//

	aspect_ratio() {
		return display.clientWidth / display.clientHeight;
	}

	set_clear_color(color) {
		gl.clearColor(color[0], color[1], color[2], color[3]);
	}

	clear() {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}

	model_view() {
		return golxzn.math.mat4.multiply(
			this.current_transform(),
			this.current_view()
		);
	}
	model_view_projection() {
		return golxzn.math.mat4.multiply(
			this.model_view(),
			this.current_projection()
		);
	}


	_blit_on_quad(pipeline, textures, uniforms) {
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.FRONT);
		gl.frontFace(gl.CW);

		pipeline.use();
		for (const [name, value] of Object.entries(uniforms)) {
			pipeline.set_uniform(name, value);
		}

		var bind_id = 0;
		for (const [name, texture] of Object.entries(textures)) {
			texture.bind(bind_id);
			pipeline.set_uniform(name, bind_id, { as_integer: true });
			++bind_id;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.blit_mesh);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	}

};
