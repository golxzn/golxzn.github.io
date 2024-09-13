class graphics {
	constructor(canvas) {
		this.gl = canvas.getContext("webgl2");
		if (!this.gl) {
			alert("Cannot get WebGL2 Context! Seems like it isn't supported!");
			return;
		}

		this.active_camera = null;
		this.pipeline_stack = [];
		this.transform_stack = [golxzn.math.mat4.make_identity()];

		this.gl.viewport(0, 0, canvas.width, canvas.height);
		this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.depthFunc(this.gl.LEQUAL);
	}

	set_active_camera(camera) {
		this.active_camera = camera;
		this.active_camera.aspect = this.aspect_ratio();
	}

	push_pipeline(pipeline) {
		this.pipeline_stack.push(pipeline);
		pipeline.use();
	}

	set_engine_uniforms() {
		const pipeline = this.current_pipeline();
		pipeline.set_uniform("u_model", this.current_transform());
		pipeline.set_uniform("u_view", this.active_camera.make_view());
		pipeline.set_uniform("u_projection", this.active_camera.make_projection());
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

	pop_transform(matrix) {
		this.transform_stack.pop();
	}


	apply_texture(id, texture) {
		texture.bind(id);
		this.current_pipeline().set_uniform(`u_texture_${id}`, id);
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
};