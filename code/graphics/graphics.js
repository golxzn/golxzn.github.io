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
		this.transform_inverse_stack = [m.inverse(m.make_identity())];
		this.model_view = m.make_identity();

		this.light_direction = [0.577, -0.577, 0.577];
		this.phong_blinn = true;

		this.gl.viewport(0, 0, canvas.width, canvas.height);
		this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.depthFunc(this.gl.LEQUAL);
		this.gl.depthMask(true);
	}

	set_active_camera(camera) {
		this.active_camera = camera;
		this.active_camera.aspect = this.aspect_ratio();
		this.update_model_view();
	}

	push_pipeline(pipeline) {
		this.pipeline_stack.push(pipeline);
		pipeline.use();
	}

	set_engine_uniforms() {
		const pipeline = this.current_pipeline();
		this.update_model_view();
		pipeline.set_uniform("u_model_view", this.model_view);
		pipeline.set_uniform("u_projection", this.active_camera.make_projection());
		if (pipeline.uniform_location("u_normal_matrix")) {
			pipeline.set_uniform("u_normal_matrix",
				golxzn.math.mat3.inverse(golxzn.math.mat3.build_from(this.model_view)),
				{ transpose: true }
			);
		}

		// TODO: Remove this shit or move somewhere
		if (pipeline.uniform_location("u_dir_light.color") != null) {
			pipeline.set_uniform("u_dir_light.color", [1.0, 1.0, 1.0]);
			pipeline.set_uniform("u_dir_light.direction", this.light_direction);
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
		this.transform_inverse_stack.push(golxzn.math.mat4.inverse(this.current_transform()));
	}

	current_transform() {
		return this.transform_stack.at(-1);
	}

	current_inverse_transform() {
		return this.transform_inverse_stack.at(-1);
	}

	pop_transform(matrix) {
		this.transform_stack.pop();
	}


	apply_texture(id, texture) {
		texture.bind(id);
		this.current_pipeline().set_uniform(`u_texture_${id}`, id, { as_integer: true });
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

	update_model_view() {
		this.model_view = golxzn.math.mat4.multiply(
			this.current_transform(),
			this.active_camera.make_view()
		);
	}
};