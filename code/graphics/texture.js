
const DEFAULT_TEXTURE_INFO = {
	DEFAULT_LEVEL  : 0,
	DEFAULT_WIDTH  : 1,
	DEFAULT_HEIGHT : 1,
	DEFAULT_BORDER : 0,
	DEFAULT_PIXELS : new Uint8Array([255, 255, 255, 255])
};
Object.freeze(DEFAULT_TEXTURE_INFO);

const DEFAULT_SAMPLER = {
	wrapS: gl.REPEAT,
	wrapT: gl.REPEAT,
	wrapR: gl.REPEAT,
	magFilter: gl.LINEAR,
	minFilter: gl.LINEAR_MIPMAP_LINEAR
};
Object.freeze(DEFAULT_SAMPLER);

class texture {
	constructor(image, sampler = DEFAULT_SAMPLER) {
		this._target = gl.TEXTURE_2D;
		this._texture = this._make_texture();
		this._width = image ? image.width : DEFAULT_TEXTURE_INFO.DEFAULT_WIDTH;
		this._height = image ? image.height : DEFAULT_TEXTURE_INFO.DEFAULT_HEIGHT;

		this.bind();

		if (image) {
			gl.texImage2D(
				this._target,
				DEFAULT_TEXTURE_INFO.DEFAULT_LEVEL,
				gl.RGBA,
				gl.RGBA,
				gl.UNSIGNED_BYTE,
				image
			);
		}

		this.set_sampler(sampler || DEFAULT_SAMPLER);
		this.unbind();
	}

	set_sampler(sampler) {
		this.bind();
		const min_filter = sampler.minFilter || DEFAULT_SAMPLER.minFilter;
		gl.texParameteri(this._target, gl.TEXTURE_MAG_FILTER, sampler.magFilter || DEFAULT_SAMPLER.magFilter);
		gl.texParameteri(this._target, gl.TEXTURE_MIN_FILTER, min_filter);
		gl.texParameteri(this._target, gl.TEXTURE_WRAP_S, sampler.wrapS || DEFAULT_SAMPLER.wrapS);
		gl.texParameteri(this._target, gl.TEXTURE_WRAP_T, sampler.wrapT || DEFAULT_SAMPLER.wrapT);
		gl.texParameteri(this._target, gl.TEXTURE_WRAP_R, sampler.wrapR || DEFAULT_SAMPLER.wrapR);
		gl.generateMipmap(this._target);
		this.unbind();
	}

	bind(index = 0) {
		gl.activeTexture(gl.TEXTURE0 + index);
		gl.bindTexture(this._target, this._texture);
	}

	unbind() {
		gl.bindTexture(this._target, null);
	}

// private:

	_make_texture() {
		const texture = gl.createTexture();
		gl.bindTexture(this._target, texture);

		// Loading the placeholder
		gl.texImage2D(
			this._target,
			DEFAULT_TEXTURE_INFO.DEFAULT_LEVEL,
			gl.RGBA,
			this._width, this._height,
			DEFAULT_TEXTURE_INFO.DEFAULT_BORDER,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			DEFAULT_TEXTURE_INFO.DEFAULT_PIXELS
		)

		gl.bindTexture(this._target, null);
		return texture;
	}
};