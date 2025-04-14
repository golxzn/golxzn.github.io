
const UNIFORM_BLOCK_PARAMS = {
	name: "",
	binding: -1,
};
Object.freeze(UNIFORM_BLOCK_PARAMS);

class uniform_block {
	constructor(params = UNIFORM_BLOCK_PARAMS, data = null) {
		this.name = params.name || UNIFORM_BLOCK_PARAMS.name;
		this.binding = params.binding != null ? params.binding : UNIFORM_BLOCK_PARAMS.binding;
		this.buffer = gl.createBuffer();

		gl.bindBuffer(gl.UNIFORM_BUFFER, this.buffer);
		gl.bufferData(gl.UNIFORM_BUFFER, data, gl.DYNAMIC_DRAW);
		gl.bindBuffer(gl.UNIFORM_BUFFER, null);
	}

	update(data, offset = 0) {
		gl.bindBuffer(gl.UNIFORM_BUFFER, this.buffer);
		gl.bufferSubData(gl.UNIFORM_BUFFER, offset, data);
		gl.bindBuffer(gl.UNIFORM_BUFFER, null);
	}

	bind() {
		gl.bindBufferBase(gl.UNIFORM_BUFFER, this.binding, this.buffer);
	}

	unbind() {
		gl.bindBufferBase(gl.UNIFORM_BUFFER, this.binding, null);
	}
};