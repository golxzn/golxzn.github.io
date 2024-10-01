
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
		const gl = canvas.getContext("webgl2");
		if (!gl) {
			alert("Cannot get WebGL2 Context! Seems like it isn't supported!");
			return;
		}
		this.gl = gl;

		const m = golxzn.math.mat4;

		this.active_camera = null;
		this.pipeline_stack = [];
		this.transform_stack = [m.make_identity()];

		this.directional_lights = {};
		this.point_lights = [];

		this.active_pass = 0;
		this.render_passes = [
			new render_pass(
				"Color Render Pass",
				new framebuffer(gl, [canvas.width, canvas.height],
					{ format: gl.RGB,              attachment: gl.COLOR_ATTACHMENT0 },
					{ format: gl.DEPTH24_STENCIL8, attachment: gl.DEPTH_STENCIL_ATTACHMENT },
				), [
					gl.CULL_FACE,
					gl.DEPTH_TEST
				], {
					bind: function() {
						gl.cullFace(gl.FRONT);
						gl.frontFace(gl.CCW);
						gl.depthFunc(gl.LEQUAL);
						gl.depthMask(true);
						gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
					},
					unbind: function() {}
				}
			)
		];

		this.blit_texture_pipeline = new pipeline(gl, "screen", {
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
		this.active_pass = -1;
		for (const pass of this.render_passes) {
			this.active_pass++;
			pass.bind();
			instance.render(this);
			pass.unbind();
		}
		this._blit_on_quad(this.render_passes[this.active_pass].framebuffer.texture())
	}

	set_active_camera(camera) {
		this.active_camera = camera;
		this.active_camera.aspect = this.aspect_ratio();
		this._mvp = null;
	}

	push_pipeline(pipeline) {
		this.pipeline_stack.push(pipeline);
		pipeline.use();
	}

	set_engine_uniforms() {
		const pipeline = this.current_pipeline();
		// pipeline.set_uniform("u_model_view", this.model_view());
		// pipeline.set_uniform("u_projection", this.active_camera.make_projection());
		pipeline.set_uniform("u_mvp", this.model_view_projection());
		if (pipeline.uniform_location("u_model")) {
			pipeline.set_uniform("u_model", this.current_transform());
			pipeline.set_uniform("u_view_position", this.active_camera.position)
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
		for (const [name, light] of Object.entries(this.directional_lights)) {
			light.apply(pipeline, name);
		}

		if (pipeline.uniform_location('u_point_lights_count') == null) return;

		pipeline.set_uniform('u_point_lights_count', this.point_lights.length, { as_integer: true });
		for (var i = 0; i < this.point_lights.length; i++) {
			this.point_lights[i].apply(pipeline, `u_point_lights[${i}]`);
		}
	}

	current_pipeline() {
		return this.pipeline_stack.at(-1);
	}

	pop_pipeline() {
		this.pipeline_stack.pop();
	}

	push_transform(matrix) {
		this.transform_stack.push(golxzn.math.mat4.multiply(this.current_transform(), matrix));
	}

	current_transform() {
		return this.transform_stack.at(-1);
	}

	pop_transform() {
		this.transform_stack.pop();
	}


	apply_texture(id, texture) {
		const name = `u_texture_${id}`;
		const pipeline = this.current_pipeline();
		if (pipeline.uniform_location(name) != null) {
			texture.bind(id);
			this.current_pipeline().set_uniform(name, id, { as_integer: true });
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

	draw_mesh(mesh) {
		this.gl.bindVertexArray(mesh.vao);
		this.gl.drawElements(mesh.draw_mode, mesh.elements_count, this.gl.UNSIGNED_SHORT, 0);
	}


	aspect_ratio() {
		return this.gl.canvas.width / this.gl.canvas.height;
	}

	set_clear_color(color) {
		this.gl.clearColor(color[0], color[1], color[2], color[3]);
	}

	clear() {
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	}

	model_view() {
		return golxzn.math.mat4.multiply(
			this.current_transform(),
			this.active_camera.make_view()
		);
	}
	model_view_projection() {
		return golxzn.math.mat4.multiply(
			this.model_view(),
			this.active_camera.make_projection()
		);
	}


	_blit_on_quad(texture) {
		// Blit on screen
		const gl = this.gl;
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.FRONT);
		gl.frontFace(gl.CW);

		this.blit_texture_pipeline.use();
		texture.bind();
		this.blit_texture_pipeline.set_uniform("u_texture_0", 0, { as_integer: true });

		this.gl.bindBuffer(gl.ARRAY_BUFFER, this.blit_mesh);
		this.gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	}

};
