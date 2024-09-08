
const DEFAULT_LEVEL           = 0;
const DEFAULT_INTERNAL_FORMAT = gl.RGBA;
const DEFAULT_WIDTH           = 1;
const DEFAULT_HEIGHT          = 1;
const DEFAULT_BORDER          = 0;
const DEFAULT_SRC_FORMAT      = gl.RGBA;
const DEFAULT_SRC_TYPE        = gl.UNSIGNED_BYTE;
const DEFAULT_PIXELS          = new Uint8Array([0, 0, 255, 255]);

class texture {
	constructor(gl, url) {
		this._gl  = gl;
		this._url = url;
		this._target = gl.TEXTURE_2D;
		this._texture = this._make_texture();
		this._width = DEFAULT_WIDTH;
		this._height = DEFAULT_HEIGHT;
		this._image = new Image()
		img.onload = this._on_image_load;
		img.src = url;
	}

	bind() {
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
			DEFAULT_INTERNAL_FORMAT,
			this._width, this._height,
			DEFAULT_BORDER,
			DEFAULT_SRC_FORMAT,
			DEFAULT_SRC_TYPE,
			DEFAULT_PIXELS
		)

		this._gl.bindTexture(this._target, null);
	}

	_on_image_load() {
		this.bind();

		const img = this._image;
		this._image = null;
		this._width = img.width;
		this._height = img.height;

		this._gl.texImage2D(
			this._target,
			DEFAULT_LEVEL,
			DEFAULT_INTERNAL_FORMAT,
			DEFAULT_SRC_FORMAT,
			DEFAULT_SRC_TYPE,
			img
		)

		if (!this._support_mipmap(img)) {
			this._gl.texParameteri(this._target, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
			this._gl.texParameteri(this._target, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);
			this._gl.texParameteri(this._target, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR);
		} else {
			this._gl.generateMipmap(this._target);
		}

		this.unbind();
	}

	static _support_mipmap(image) {
		return this._is_power_of_2(image.width) && this._is_power_of_2(image.height);
	}
	static _is_power_of_2(value) {
		return (value & (value - 1)) === 0;
	}
};