class graphics {
	constructor(canvas) {
		this.gl = canvas.getContext("webgl2");
		if (!this.gl) {
			alert("Cannot get WebGL2 Context! Seems like it isn't supported!");
			return;
		}

		this.pipeline_stack = [];

		this.gl.viewport(0, 0, canvas.width, canvas.height);
		this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.depthFunc(this.gl.LEQUAL);
	}

	push_pipeline(pipeline) {
		this.pipeline_stack.push(pipeline);
		pipeline.use();
	}

	current_pipeline() {
		return this.pipeline_stack.at(-1);
	}

	pop_pipeline() {
		this.pipeline_stack.pop();
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