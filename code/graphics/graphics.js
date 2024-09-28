class graphics {
	constructor(canvas) {
		this.gl = canvas.getContext("webgl2");
		if (!this.gl) {
			alert("Cannot get WebGL2 Context! Seems like it isn't supported!");
			return;
		}

		const m = golxzn.math.mat4;

		this.active_camera = null;
		this.pipeline_stack = [];
		this.transform_stack = [m.make_identity()];

		this.directional_lights = {};
		this.point_lights = [];

		this.gl.viewport(0, 0, canvas.width, canvas.height);
		this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.depthFunc(this.gl.LEQUAL);
		this.gl.depthMask(true);
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

};
