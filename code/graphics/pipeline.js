
const DEFAULT_PROPERTIES = {
	has_lighting: false,
	transform_feedback: null,
};

class pipeline {
	constructor(name, shaders, properties = DEFAULT_PROPERTIES) {
		this._name = name;
		this._properties = properties == null ? DEFAULT_PROPERTIES : properties;
		for (const [key, value] of Object.entries(DEFAULT_PROPERTIES)) {
			if (!Object.hasOwn(this._properties, key)) {
				this._properties[key] = value;
			}
		}

		this._program = this._make_program(shaders);
	}

	valid() {
		return this._program != null;
	}

	lighting_support() {
		return this._properties.has_lighting;
	}
	transform_feedback_support() {
		return this._properties.transform_feedback != null;
	}

	attribute_location(attribute_name) {
		return gl.getAttribLocation(this._program, attribute_name);
	}

	uniform_location(uniform_name) {
		return gl.getUniformLocation(this._program, uniform_name);
	}

	set_uniform(uniform_name, value, options = { transpose: false, as_integer: false }) {
		const location = pipeline._is_string(uniform_name) ? this.uniform_location(uniform_name) : uniform_name;
		if (location == null) {
			console.error(`[pipeline][${this._name}] Could not find a "${uniform_name}" uniform location!`);
			return;
		}

		if (Array.isArray(value)) {
			const data = new Float32Array(value);
			switch (value.length) {
				case 16:
					gl.uniformMatrix4fv(location, options.transpose, data);
					break;
				case 9:
					gl.uniformMatrix3fv(location, options.transpose, data);
					break;
				case 4:
					gl.uniform4fv(location, data);
					break;
				case 3:
					gl.uniform3fv(location, data);
					break;
				case 2:
					gl.uniform2fv(location, data);
					break;
				default:
					gl.uniform1fv(location, data);
					break;
			}

		} else if (typeof(value) == 'number') {
			if (options.as_integer) {
				gl.uniform1i(location, value);
			} else {
				gl.uniform1f(location, value);
			}
		} else if (typeof(value) == 'boolean') {
			gl.uniform1i(location, +value);
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
			return gl.getUniform(this._program, location);
		}
		console.error(`[pipeline][${this._name}] Cannot get "${uniform_name}" uniform value.`);
		return null;
	}

	use() {
		gl.useProgram(this._program);
	}

// private:
	_make_program(shaders) {
		const program = gl.createProgram();
		for (const [type, source_code] of Object.entries(shaders)) {
			if (source_code == null) {
				console.error(`[pipeline][${this._name}] Could not attach invalid shader!`);
				continue;
			}
			const shader = this._compile_shader(source_code, type);
			if (shader == null) {
				console.error(`[pipeline][${this._name}] Could not attach invalid shader!`);
			}
			gl.attachShader(program, shader);
		}

		if (this._properties.transform_feedback != null) {
			this._enable_transform_feedback(program, this._properties.transform_feedback);
		}
		gl.linkProgram(program);
		if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
			return program;
		}

		console.error(`[pipeline][${this._name}] Failed to link program!`);
		console.error("[pipeline]" + gl.getProgramInfoLog(program));
		gl.deleteProgram(program);
		return null;
	}

	_enable_transform_feedback(program, info) {
		gl.transformFeedbackVaryings(program, info.varyings, info.buffer_mode);
	}

	_compile_shader(source_code, type) {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source_code);
		gl.compileShader(shader);

		if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			return shader;
		}

		const type_names = {
			[gl.VERTEX_SHADER]: "VERTEX",
			[gl.FRAGMENT_SHADER]: "FRAGMENT"
		}
		console.error(`[pipeline][${this._name}] Failed to compile the ${type_names[type]} shader:`)
		console.error("[pipeline]", gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}

	static _is_string(value) {
		return typeof value === 'string' || value instanceof String;
	}
};