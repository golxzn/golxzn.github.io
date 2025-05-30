
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
		this.transform_stack = [m.identity()];
		this.projection_stack = [];
		this.view_stack = [];

		this.directional_lights = null;
		this.point_lights = [];
		this.spot_lights = [];

		this.spotlight_shadow_map_texture = null;

		this.active_pass = 0;
		this.render_size = golxzn.math.scale([canvas.width, canvas.height], SETTINGS.graphics.render_scale);
		this.uniform_blocks = {
			[SHADERS_COMMON.UNIFORM_BLOCKS.GEOMETRY.binding]: new uniform_block(
				SHADERS_COMMON.UNIFORM_BLOCKS.GEOMETRY,
				new Float32Array(m.identity().concat(m.identity()))
			),
			[SHADERS_COMMON.UNIFORM_BLOCKS.LIGHT_PROPERTIES.binding]: new uniform_block(
				SHADERS_COMMON.UNIFORM_BLOCKS.LIGHT_PROPERTIES,
				new Float32Array(SHADERS_COMMON.LIGHTING_INFO.UNIFORM_BUFFER_LENGTH)
			),
		};
/*
 [scene]                                          +--------[quad]--------+
 |                                                |           |          |
 |  +--------------------------+     +--------------+  +------------+  +------------+
 +->| GEOMETRY PASS (G-Buffer) |--+  | SHADING PASS |->| BLOOM PASS |->| BLIT  PASS |
 |  +--------------------------+  |  +--------------+  +------------+  +------------+
 |                                +--> pos/norm/clr |
 |  +--------------------------+     |              |
 +->| DIRECTION SHADOW (DEPTH) |-----> dir_shadows  |
 |  +--------------------------+     |              |
 +->| SPOTLIGHT SHADOW (DEPTH) |-----> spot_shadows |
 |  +--------------------------+     |              |
 +->| POINTS SHADOW (DEPTH)    |-----> dir_shadows  |
    +--------------------------+     +--------------+

*/

		// gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		const bind_cull_face = (pass, graphics) => {
			gl.cullFace(gl.FRONT);
			gl.frontFace(gl.CW);
			gl.depthFunc(gl.LEQUAL);
			gl.depthMask(true);
		};

		this.render_passes = {
			geometry: new render_pass("Geometry",
				new framebuffer(this.render_size, [
					{ name: "u_albedo",   type: attachment_type.texture, format: gl.RGBA16F, attachment: gl.COLOR_ATTACHMENT0, storage: true },
					{ name: "u_position", type: attachment_type.texture, format: gl.RGBA16F, attachment: gl.COLOR_ATTACHMENT1, storage: true },
					{ name: "u_normal",   type: attachment_type.texture, format: gl.RGBA16F, attachment: gl.COLOR_ATTACHMENT2, storage: true },
					{ name: "u_emissive", type: attachment_type.texture, format: gl.RGBA16F, attachment: gl.COLOR_ATTACHMENT3, storage: true },
					{ name: "u_occlusion_metallic_roughness", type: attachment_type.texture, format: gl.RGB8, attachment: gl.COLOR_ATTACHMENT4, storage: true },
					{ type: attachment_type.renderbuffer, format: gl.DEPTH_COMPONENT16, attachment: gl.DEPTH_ATTACHMENT },
				], pipelines.load("3D", "PBR")),
				[ gl.CULL_FACE, gl.DEPTH_TEST ], {
					bind: function(pass, graphics) {
						bind_cull_face(pass, graphics);
						gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
					},
					unbind: (pass, graphics) => { }
				}
				// pipelines.load("3D", "PBR_GEOMETRY")
			),

			spotlight_shadow: new render_pass("Spotlight Shadows",
				new framebuffer(SETTINGS.graphics.shadow_resolution, [ {
					name: "u_spotlight_shadow_map",
					type: attachment_type.texture_array,
					layers: SHADERS_COMMON.LIGHTING_INFO.SPOT.MAX_COUNT,
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
				} ], pipelines.load("3D", "PBR")),
				[ gl.CULL_FACE, gl.DEPTH_TEST ], {
					bind: bind_cull_face,
					unbind: (pass, graphics) => { }
				},
				pipelines.load("3D", "DEPTH")
			),

			shading: new render_pass("Shading",
				new framebuffer(this.render_size, [
					{ type: attachment_type.texture,      format: gl.RGBA16F,          attachment: gl.COLOR_ATTACHMENT0, storage: true },
					{ type: attachment_type.texture,      format: gl.RGBA16F,          attachment: gl.COLOR_ATTACHMENT1, storage: true },
					{ type: attachment_type.renderbuffer, format: gl.DEPTH24_STENCIL8, attachment: gl.DEPTH_STENCIL_ATTACHMENT  },
				]), [ gl.CULL_FACE, gl.DEPTH_TEST ], {
					bind: function(pass, graphics) {
						gl.cullFace(gl.FRONT);
						gl.frontFace(gl.CCW);
						gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

						const geom = graphics.render_passes.geometry;
						geom.bind_all_textures();
						/// u_depth binding, It doesn't work.
						// const last_id = geom.texture_count()
						// geom.render_buffer(last_id).bind(last_id);

						graphics.set_engine_uniforms();
						graphics.set_engine_lighting_uniforms();
					},
					unbind: (pass, graphics) => {
						graphics.reset_engine_lighting_uniforms();
						graphics.reset_engine_uniforms();
					}
				},
				pipelines.load("3D", "PBR")
			),

			// gizmos: new render_pass("Gizmos",
			// 	new framebuffer(this.render_size, [
			// 		{ name: 'u_gizmo', type: attachment_type.texture, format: gl.RGBA, attachment: gl.COLOR_ATTACHMENT0 },
			// 	]), [ gl.CULL_FACE, gl.DEPTH_TEST ], {
			// 		bind: bind_cull_face,
			// 		unbind: function(pass, graphics) {}
			// 	},
			// 	pipelines.load("3D", "PRIMITIVE")
			// ),

			bloom_horizontal: new render_pass("Bloom Horizontal",
				new framebuffer(this.render_size, [
					{ name: 'u_bloom', type: attachment_type.texture, format: gl.RGBA16F, attachment: gl.COLOR_ATTACHMENT0, storage: true },
				]), [], {
					bind: function(pass, graphics) {
						gl.clear(gl.COLOR_BUFFER_BIT);
					},
					unbind: function(pass, graphics) {
					}
				},
				pipelines.load("3D", "BLOOM_HORIZONTAL")
			),
			bloom_vertical: new render_pass("Bloom Vertical",
				new framebuffer(this.render_size, [
					{ name: 'u_bloom', type: attachment_type.texture, format: gl.RGBA16F, attachment: gl.COLOR_ATTACHMENT0, storage: true },
				]), [], {
					bind: function(pass, graphics) {
						gl.clear(gl.COLOR_BUFFER_BIT);
					},
					unbind: function(pass, graphics) {
					}
				},
				pipelines.load("3D", "BLOOM_VERTICAL")
			),
		};
		this._current_render_pass = null;
		this._frame_count = 0;

		this.blit_texture_pipeline = pipelines.load("3D", "BLIT_SCREEN");
		this.blit_mesh = (() => {
			const buffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
				-1.0, -1.0,
				1.0, -1.0,
				-1.0,  1.0,
				1.0,  1.0,
			]), gl.STATIC_DRAW);
			gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
			gl.enableVertexAttribArray(0);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
			return buffer;
		})();
	}


	render(instance) {
		this.projection_stack = [this.active_camera.make_projection()];
		this.view_stack = [this.active_camera.make_view()];

		// TODO:!!!! RENDER GRAPH
		/*
		var render_graph_iterator = this.render_graph.begin();
		while (render_graph_iterator != this.render_graph.end()) {
			var node = render_graph_iterator.node();
			var pass = node.pass();
			pass.bind(this);
			// RESOLVE DEPENDENCIES ???
			node.render(this);
			pass.unbind(this);
			render_graph_iterator = render_graph_iterator.next()
		}
		*/

	//======================================= Geometry pass =======================================//
		const geometry_pass = this.set_current_render_pass(this.render_passes.geometry);
		geometry_pass.bind(this);
		instance.render(this);
		geometry_pass.unbind(this);

	//==================================== Directional Shadows ====================================//
		// TODO: Implement Directional Shadows. It's not that hard, but I'm not sure it's necessary.

	//==================================== Spotlights  Shadows ====================================//
		if (this._frame_count % SETTINGS.graphics.shadow_calculation_frequency == 0) {
			this.spotlight_shadow_map_texture = this.render_shadows(instance);
		}

	//==================================== PointLights Shadows ====================================//
		// TODO: Maybe we could make an array of cube maps for each point light :thonk:

	//=======================================  Color  Pass  =======================================//
		const shading_pass = this.set_current_render_pass(this.render_passes.shading);
		shading_pass.bind(this);
		this._blit_on_quad_({});
		shading_pass.unbind(this);

	//========================================== GIZMOS ==========================================//
		// const gizmos_pass = this.set_current_render_pass(this.render_passes.gizmos);
		// We need to render into shading_pass.texture(0) and copy depth buffer from geometry pass


		// gizmos_pass.bind(this);
		// instance.render_gizmos(this);
		// gizmos_pass.unbind(this);

	//==========================================  Bloom ==========================================//

		const bloom_passes = [
			this.render_passes.bloom_horizontal,
			this.render_passes.bloom_vertical,
		];
		for (var i = 0; i < bloom_passes.length; ++i) {
			const pass = bloom_passes[i];
			pass.pipeline.use();
			pass.pipeline.set_uniforms({
				u_direction: { getter: () => SETTINGS.graphics.bloom.direction[i] },
				u_weights: { getter: () => SETTINGS.graphics.bloom.weights }
			});
		}

		var bloom_texture = shading_pass.texture(1);
		for (var i = 0; i < SETTINGS.graphics.bloom.iterations; ++i) {
			const id = i % bloom_passes.length;

			const bloom_pass = this.set_current_render_pass(bloom_passes[id]);
			bloom_pass.bind(this);
			this._blit_on_quad_({ u_bloom: bloom_texture });
			bloom_pass.unbind(this);

			bloom_texture = bloom_pass.texture();
		}

	//======================================= Blit  screen =======================================//
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		this._blit_on_quad(this.blit_texture_pipeline, { // todo replace it
			u_screen: shading_pass.texture(0),
			u_bloom : bloom_texture,
		}, {
			u_exposure: { getter: () => SETTINGS.graphics.exposure },
		});

		++this._frame_count;
	}

	render_shadows(instance) {
		const shadow_pass = this.set_current_render_pass(this.render_passes.spotlight_shadow);
		const depth_framebuffer = shadow_pass.framebuffer;
		const spotlight_shadow_maps = depth_framebuffer.texture_array();

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
		return spotlight_shadow_maps;
	}

	set_active_camera(camera) {
		this.active_camera = camera;
		this.active_camera.aspect = this.aspect_ratio();
		this._mvp = null;
	}

	set_current_render_pass(pass) {
		this._current_render_pass = pass;
		return pass;
	}

	current_render_pass() {
		return this._current_render_pass;
	}

	push_pipeline(pipeline) {
		const new_pipeline = pipeline == null ? this.current_pipeline() : pipeline;

		this.pipeline_stack.push(new_pipeline);
		new_pipeline.use();
	}

	set_engine_uniforms() {
		const pipeline = this.current_pipeline();
		if (!pipeline) return;
		const m3 = golxzn.math.mat3;

		const geometry_block = this.uniform_blocks[SHADERS_COMMON.UNIFORM_BLOCKS.GEOMETRY.binding];
		geometry_block.bind();
		geometry_block.update(new Float32Array(
			this.model_view_projection().concat(this.current_transform())
		));

		// pipeline.try_set_uniform("u_mvp", () => this.model_view_projection());
		// pipeline.try_set_uniform("u_model", () => this.current_transform());
		pipeline.try_set_uniform("u_view_position", () => this.active_camera.position);
		pipeline.try_set_uniform("u_normal_matrix", () => {
			return m3.transpose(m3.inverse(m3.build_from(this.current_transform())));
		});
	}

	reset_engine_uniforms() {
		// // is it necessary?
		// const pipeline = this.current_pipeline();
		// if (!pipeline) return;

		// const geometry_block = this.uniform_blocks[SHADERS_COMMON.UNIFORM_BLOCKS.GEOMETRY.binding];
		// geometry_block.unbind();
	}

	set_engine_lighting_uniforms() {
		const pipeline = this.current_pipeline();
		if (!pipeline || !pipeline.support(PIPELINE_FLAGS.lighting_support)) return;

		const light_block = this.uniform_blocks[SHADERS_COMMON.UNIFORM_BLOCKS.LIGHT_PROPERTIES.binding];
		if (this.directional_lights.dirty) {
			light_block.update(this.directional_lights.binary(), 0);
		}

		const u_point_lights_count_location = pipeline.uniform_location('u_point_lights_count');
		if (u_point_lights_count_location == null) return;

		pipeline.set_uniform(u_point_lights_count_location, this.point_lights.length, { as_integer: true });
		const point_bytes_length = SHADERS_COMMON.LIGHTING_INFO.POINT.COMPONENTS_COUNT
			* Float32Array.BYTES_PER_ELEMENT;
		for (var i = 0; i < this.point_lights.length; ++i) {
			const point = this.point_lights[i];
			if (point.dirty) {
				light_block.update(point.binary(),
					SHADERS_COMMON.LIGHTING_INFO.POINT.BYTES_OFFSET + point_bytes_length * i
				);
			}
		}

		pipeline.set_uniform('u_spot_lights_count', this.spot_lights.length, { as_integer: true });
		const spot_bytes_length = SHADERS_COMMON.LIGHTING_INFO.SPOT.COMPONENTS_COUNT
			* Float32Array.BYTES_PER_ELEMENT;
		for (var i = 0; i < this.spot_lights.length; ++i) {
			const spot = this.spot_lights[i];
			if (spot.dirty) {
				light_block.update(spot.binary(),
					SHADERS_COMMON.LIGHTING_INFO.SPOT.BYTES_OFFSET + spot_bytes_length * i
				);
			}
		}
		light_block.bind();

		if (this.spotlight_shadow_map_texture) {
			this.apply_texture(this.spotlight_shadow_map_texture, "u_spotlight_shadow_map");
		}
	}

	reset_engine_lighting_uniforms() {
		const pipeline = this.current_pipeline();
		if (!pipeline || !pipeline.support(PIPELINE_FLAGS.lighting_support)) return;

		if (pipeline.uniform_location('u_point_lights_count') == null) return;
		this.uniform_blocks[SHADERS_COMMON.UNIFORM_BLOCKS.LIGHT_PROPERTIES.binding].unbind();

		if (this.spotlight_shadow_map_texture) {
			this.remove_textures(1); // u_spotlight_shadow_map
		}
	}

	current_pipeline() {
		return this.pipeline_stack.at(-1);
	}

	pop_pipeline() {
		this.pipeline_stack.pop().unuse();
	}

	push_transform(matrix) {
		this.transform_stack.push(golxzn.math.mat4.multiply(matrix, this.current_transform()));
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

	apply_material(material) {
		const pipeline = this.current_pipeline();
		if (!pipeline.support(PIPELINE_FLAGS.material_support)) return;

		const u_material_ambient = pipeline.uniform_location("u_material.ambient");
		if (u_material_ambient != null) {
			pipeline.set_uniform(u_material_ambient, material.ambient);
			pipeline.set_uniform("u_material.diffuse", material.diffuse);
			pipeline.set_uniform("u_material.specular", material.specular);
			pipeline.set_uniform("u_material.shininess", material.shininess);
		}
	}

	apply_texture(texture, name) {
		const pipeline = this.current_pipeline();
		const location = pipeline.uniform_location(name);
		if (location != null) {
			texture.bind(pipeline.pushed_textures_count());
			pipeline.push_texture(location);
			return true;
		}
		return false;
	}

	remove_textures(count = 1) {
		if (count != 0) {
			const pipeline = this.current_pipeline();
			pipeline.pop_texture(count);
		}
	}

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

	_blit_on_quad_(textures) {
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.FRONT);
		gl.frontFace(gl.CW);

		var applied_textures = 0;
		for (const [name, texture] of Object.entries(textures)) {
			applied_textures += +this.apply_texture(texture, name);
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.blit_mesh);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		this.remove_textures(applied_textures);

		gl.disable(gl.CULL_FACE);
	}

	_blit_on_quad(pipeline, textures, uniforms) {
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.FRONT);
		gl.frontFace(gl.CW);

		pipeline.use();
		pipeline.set_uniforms(uniforms);

		var bind_id = 0;
		for (const [name, texture] of Object.entries(textures)) {
			texture.bind(bind_id);
			pipeline.set_uniform(name, bind_id, { as_integer: true });
			++bind_id;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.blit_mesh);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		pipeline.unuse();

		gl.disable(gl.CULL_FACE);
	}

};
