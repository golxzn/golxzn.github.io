
const BLIT_TEXTURE_VERTEX_SHADER_CODE = /* glsl */ `#version 300 es
layout(location = 0) in vec2 a_position;

out vec2 f_uv;

void main() {
	gl_Position = vec4(a_position, 0.0, 1.0);
	f_uv = (a_position + vec2(1.0)) * 0.5;
}
`;

const BLIT_TEXTURE_FRAGMENT_SHADER_CODE = /* glsl */ `#version 300 es
precision mediump float;
in vec2 f_uv;
out vec4 frag_color;

uniform sampler2D u_texture_0;

void main() {
	frag_color = texture(u_texture_0, f_uv);
}
`;

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

		this.directional_lights = {};
		this.point_lights = [];
		this.applied_textures_count = 0;
		this.shadow_map_texture = null;

		this.active_pass = 0;
		this.render_passes = [
			new render_pass("Depth Map", new framebuffer([1024, 1024], [ {
				type: attachment_type.texture,
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
					const light = graphics.directional_lights;
					graphics.push_view(light.view());
					graphics.push_projection(light.projection());
					gl.cullFace(gl.BACK);
					gl.depthFunc(gl.LESS);
					gl.depthMask(true);
					gl.clear(gl.DEPTH_BUFFER_BIT);
				},
				unbind: function(pass, graphics) {
					graphics.pop_projection();
					graphics.pop_view();
					graphics.shadow_map_texture = pass.framebuffer.texture();
				}
			}, pipelines.load("3D", "DEPTH")),

			new render_pass("Color Render Pass", new framebuffer([canvas.width, canvas.height], [
				{ type: attachment_type.texture,      format: gl.RGBA,             attachment: gl.COLOR_ATTACHMENT0 },
				{ type: attachment_type.renderbuffer, format: gl.DEPTH24_STENCIL8, attachment: gl.DEPTH_STENCIL_ATTACHMENT  },
			]), [
				gl.CULL_FACE,
				gl.DEPTH_TEST
			], {
				bind: function(graphics) {
					gl.cullFace(gl.FRONT);
					gl.frontFace(gl.CCW);
					gl.depthFunc(gl.LEQUAL);
					gl.depthMask(true);
					gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
				},
				unbind: function(graphics) {}
			} )
		];

		this.blit_texture_pipeline = new pipeline("screen", {
			[gl.VERTEX_SHADER  ]: BLIT_TEXTURE_VERTEX_SHADER_CODE,
			[gl.FRAGMENT_SHADER]: BLIT_TEXTURE_FRAGMENT_SHADER_CODE
		})
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
		this.applied_textures_count = 0;
		this.projection_stack = [this.active_camera.make_projection()];
		this.view_stack = [this.active_camera.make_view()];

		this.active_pass = -1;
		for (const pass of this.render_passes) {
			this.active_pass++;
			pass.bind(this);
			instance.render(this);
			pass.unbind(this);
		}

		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		this._blit_on_quad(this.current_render_pass().framebuffer.texture());

		gl.viewport(10, 10, gl.canvas.width / 8, gl.canvas.width / 8);
		this._blit_on_quad(this.shadow_map_texture);
	}

	current_render_pass() {
		return this.render_passes[this.active_pass];
	}

	set_active_camera(camera) {
		this.active_camera = camera;
		this.active_camera.aspect = this.aspect_ratio();
		this._mvp = null;
	}

	push_pipeline(pipeline) {
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
		if (pipeline.uniform_location("u_model")) {
			pipeline.set_uniform("u_model", this.current_transform());
			pipeline.set_uniform("u_view_position", this.active_camera.position)
		}
		if (pipeline.uniform_location("u_light")) {
			// TODO: Fuck how should I set this shit for every fucking light source???
			const light = this.directional_lights;
			pipeline.set_uniform("u_light", golxzn.math.mat4.multiply(
				light.view(),
				light.projection()
			));
			this.applied_textures_count = 0;
			this.apply_texture(0, this.shadow_map_texture);
		}
		if (pipeline.uniform_location("u_normal_matrix")) {
			pipeline.set_uniform("u_normal_matrix",
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

		if (pipeline.uniform_location('u_point_lights_count') == null) return;

		pipeline.set_uniform('u_point_lights_count', this.point_lights.length, { as_integer: true });
		for (var i = 0; i < this.point_lights.length; i++) {
			this.point_lights[i].apply(pipeline, `u_point_lights[${i}]`);
		}
	}

	current_pipeline() {
		const pass = this.current_render_pass();
		return pass.has_pipeline() ? pass.pipeline : this.pipeline_stack.at(-1);
	}

	pop_pipeline() {
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


	apply_texture(id, texture) {
		const index = id + this.applied_textures_count;
		const name = `u_texture_${index}`;
		const pipeline = this.current_pipeline();
		if (pipeline.uniform_location(name) != null) {
			texture.bind(index);
			this.current_pipeline().set_uniform(name, index, { as_integer: true });
		}
		this.applied_textures_count++;
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

	draw_mesh(mesh) {
		gl.bindVertexArray(mesh.vao);
		gl.drawElements(mesh.draw_mode, mesh.elements_count, gl.UNSIGNED_SHORT, 0);
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


	_blit_on_quad(texture) {
		// Blit on screen
		// gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		// gl.clear(gl.COLOR_BUFFER_BIT);

		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.FRONT);
		gl.frontFace(gl.CW);

		this.blit_texture_pipeline.use();
		texture.bind();
		this.blit_texture_pipeline.set_uniform("u_texture_0", 0, { as_integer: true });

		gl.bindBuffer(gl.ARRAY_BUFFER, this.blit_mesh);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	}

};
