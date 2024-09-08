class graphics {
	constructor(canvas) {
		this.gl = canvas.getContext("webgl");
		if (!this.gl) {
			alert("Cannot get WebGL Context! Seems like it isn't supported!");
			return;
		}
		this.gl.viewport(0, 0, canvas.width, canvas.height);
		this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
	}

	set_clear_color(color) {
		this.gl.clearColor(color[0], color[1], color[2], color[3]);
	}

	clear() {
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	}
};