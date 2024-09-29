
const DEFAULT_LEVEL           = 0;
const DEFAULT_WIDTH           = 1;
const DEFAULT_HEIGHT          = 1;
const DEFAULT_BORDER          = 0;
const DEFAULT_PIXELS          = new Uint8Array([0, 0, 255, 255]);

class texture {
	constructor(gl, image) {
		this._gl  = gl;
		this._target = gl.TEXTURE_2D;
		this._texture = this._make_texture();
		this._width = image.width;
		this._height = image.height;

		this.bind();

		gl.texImage2D(
			this._target,
			DEFAULT_LEVEL,
			gl.RGBA,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			image
		);

		gl.texParameteri(this._target, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
		gl.texParameteri(this._target, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
		gl.texParameteri(this._target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		if (!texture._support_mipmap(image)) {
			gl.texParameteri(this._target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		} else {
			gl.texParameteri(this._target, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
			gl.generateMipmap(this._target);
		}

		this.unbind();
	}

	bind(index = 0) {
		this._gl.activeTexture(this._gl.TEXTURE0 + index);
		this._gl.bindTexture(this._target, this._texture);
	}

	unbind() {
		this._gl.bindTexture(this._target, null);
	}

// private:

	_make_texture() {
		const texture = this._gl.createTexture();
		this._gl.bindTexture(this._target, texture);

		// Loading the placeholder
		this._gl.texImage2D(
			this._target,
			DEFAULT_LEVEL,
			this._gl.RGBA,
			this._width, this._height,
			DEFAULT_BORDER,
			this._gl.RGBA,
			this._gl.UNSIGNED_BYTE,
			DEFAULT_PIXELS
		)

		this._gl.bindTexture(this._target, null);
		return texture;
	}

	static _support_mipmap(image) {
		return texture._is_power_of_2(image.width) && texture._is_power_of_2(image.height);
	}

	static _is_power_of_2(value) {
		return (value & (value - 1)) === 0;
	}
};