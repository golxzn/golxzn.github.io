
class pipeline {
	constructor(gl, name, shaders) {
		this._gl = gl;
		this._name = name;
		this._program = this._make_program(shaders);
	}

	get valid() {
		return this._program != null;
	}

	attribute_location(attribute_name) {
		return this._gl.getAttribLocation(this._program, attribute_name);
	}

	uniform_location(uniform_name) {
		return this._gl.getUniformLocation(this._program, uniform_name);
	}

	set_uniform(uniform_name, value) {
		const location = this.uniform_location(uniform_name);
		if (location == null) {
			console.error(`[pipeline][${this._name}] Could not find a "${uniform_name}" uniform location!`);
			return;
		}

		if (Array.isArray(value)) {
			if (Number.isInteger(value[0])) {
				this._gl.uniform1iv(location, Int32List(value));
			} else {
				this._gl.uniform1fv(location, Float32List(value));
			}
		} else if (typeof(value) == 'number') {
			if (Number.isInteger(value)) {
				this._gl.uniform1i(location, value);
			} else {
				this._gl.uniform1f(location, value);
			}
		} else {
			console.error(
				`[pipeline][${this._name}] Cannot set uniform "${uniform_name}".`,
				`The value type "${typeof(value)}" is not supported!`
			);
		}
	}

	get_uniform(uniform_name) {
		const location = this.uniform_location(uniform_name);
		if (location != null) {
			return this._gl.getUniform(this._program, location);
		}
		console.error(`[pipeline][${this._name}] Cannot get "${uniform_name}" uniform value.`);
		return null;
	}

	use() {
		this._gl.useProgram(this._program);
	}

// private:
	_make_program(shaders) {
		const program = this._gl.createProgram();
		for (const [type, source_code] of Object.entries(shaders)) {
			const shader = this._compile_shader(source_code, type);
			if (shader == null) {
				console.warn(`[pipeline][${this._name}] Could not attach invalid shader!`);
			}
			this._gl.attachShader(program, shader);
		}

		this._gl.linkProgram(program);
		if (this._gl.getProgramParameter(program, this._gl.LINK_STATUS)) {
			return program;
		}

		console.error(`[pipeline][${this._name}] Failed to link program:`,
			this._gl.getProgramInfoLog(program));
		return null;
	}

	_compile_shader(source_code, type) {
		const shader = this._gl.createShader(type);
		this._gl.shaderSource(shader, source_code);
		this._gl.compileShader(shader);

		if (this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS)) {
			return shader;
		}

		this._gl.deleteShader(shader);
		console.error(`[pipeline][${this._name}] Failed to compile the shader:`,
			this._gl.getShaderInfoLog(shader));
		return null;
	}
};