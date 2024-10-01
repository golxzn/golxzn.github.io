
class framebuffer {
	constructor(gl, size, texture_info = null, renderbuffer_info = null) {
		this._gl = gl;
		this._texture = null;
		this._render_buffer = null;

		this.id = gl.createFramebuffer();
		this.size = size;
		this.target = gl.FRAMEBUFFER; // READ_ / WRITE_

		this.bind();
		if (texture_info != null) {
			this.attach_texture(texture_info.format, texture_info.attachment);
		}
		if (renderbuffer_info != null) {
			this.attach_renderbuffer(renderbuffer_info.format, renderbuffer_info.attachment);
		}
		this.unbind();
	}

	texture() {
		const gl = this._gl;
		const tex = this._texture;
		return {
			bind: function(index = 0) {
				gl.activeTexture(gl.TEXTURE0 + index);
				gl.bindTexture(gl.TEXTURE_2D, tex);
			},
			unbind: function() {
				gl.bindTexture(gl.TEXTURE_2D, null);
			}
		}
	}

	// Format could be a gl.RGB or { internal_format: gl.RGB, format: gl.RGB }
	attach_texture(format, attachment = null) {
		const is_object = function(value, field) {
			return !Number.isInteger(value) && field in value;
		};

		const gl = this._gl;
		const internal_format = is_object(format, "internal_format") ? format.internal_format : format;
		const actual_format = is_object(format, "format") ? format.format : format;

		this._texture = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D, this._texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, internal_format,
			this.size[0], this.size[1], 0,
			actual_format, gl.UNSIGNED_BYTE, null
		);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

		gl.bindTexture(gl.TEXTURE_2D, null);

		const final_attachment = attachment == null ? gl.COLOR_ATTACHMENT0 : attachment;
		gl.framebufferTexture2D(this.target, final_attachment, gl.TEXTURE_2D, this._texture, 0);
	}

	attach_renderbuffer(format = null, attachment = null) {
		const gl = this._gl;
		this._render_buffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, this._render_buffer);
		gl.renderbufferStorage(
			gl.RENDERBUFFER, format == null ? gl.DEPTH24_STENCIL8 : format,
			this.size[0], this.size[1]
		);

		gl.bindRenderbuffer(gl.RENDERBUFFER, null);

		const final_attachment = attachment == null ? gl.DEPTH_STENCIL_ATTACHMENT : attachment;
		gl.framebufferRenderbuffer(this.target, final_attachment, gl.RENDERBUFFER, this._render_buffer);
	}

	bind() {
		this._gl.bindFramebuffer(this.target, this.id);
	}

	unbind() {
		this._gl.bindFramebuffer(this.target, null);
	}

	complete() {
		return this._gl.checkFramebufferStatus(this.target) == this._gl.FRAMEBUFFER_COMPLETE;
	}

	width() { return this.size[0]; }
	height() { return this.size[1]; }
};