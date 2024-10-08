
const attachment_type = {
	texture          : "texture",
	texture_array    : "texture_array",
	renderbuffer     : "renderbuffer"
};

function make_texture_proxy(texture, type) {
	return {
		handler: texture,
		bind: function(bind_index = 0) {
			gl.activeTexture(gl.TEXTURE0 + bind_index);
			gl.bindTexture(type, this.handler);
		},
		unbind: function() {
			gl.bindTexture(type, null);
		}
	}
}

class framebuffer {
	constructor(size, attachments, parameters = null) {
		this.id = gl.createFramebuffer();
		this.size = size;
		this.textures = [];
		this.texture_arrays = [];
		this.render_buffers = [];

		this.bind();
		const creators = {
			[attachment_type.texture]      : a => this.textures.push(this._make_texture(a)),
			[attachment_type.texture_array]: a => this.texture_arrays.push(this._make_texture_array(a)),
			[attachment_type.renderbuffer] : a => this.render_buffers.push(this._make_render_buffer(a))
		}
		for (const attachment of attachments) {
			if (attachment.type in creators) {
				creators[attachment.type](attachment)
			}
		}
		this.unbind();
	}

	destroy() {
		this.textures.forEach(texture => gl.deleteTexture(texture));
		this.render_buffers.forEach(renderbuffer => gl.deleteRenderbuffer(renderbuffer));
		gl.deleteFramebuffer(this.id);
	}

	bind(target = null) {
		gl.bindFramebuffer(this._default_or(target), this.id);
		gl.viewport(0, 0, this.size[0], this.size[1]);
	}

	unbind(target = null) {
		gl.bindFramebuffer(this._default_or(target), null);
	}

	complete(target = null) {
		return gl.checkFramebufferStatus(this._default_or(target)) === gl.FRAMEBUFFER_COMPLETE;
	}

	texture(index = 0) {
		return make_texture_proxy(this.textures[index], gl.TEXTURE_2D);
	}

	texture_array(index = 0) {
		return make_texture_proxy(this.texture_arrays[index], gl.TEXTURE_2D_ARRAY);
	}

	width() { return this.size[0]; }
	height() { return this.size[1]; }

	_make_texture(attachment) {
		const texture = gl.createTexture();
		const internal_format = attachment.internal == undefined
			? attachment.format
			: attachment.internal;
		const data_type = attachment.data_type == undefined ? gl.UNSIGNED_BYTE : attachment.data_type;

		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0,
			internal_format, this.size[0], this.size[1], 0,
			attachment.format, data_type, null
		);

		const params = this._default_parameters_or(attachment.parameters);
		for (const [parameter, value] of Object.entries(params)) {
			gl.texParameteri(gl.TEXTURE_2D, parameter, value);
		}

		gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment.attachment, gl.TEXTURE_2D, texture, 0);
		return texture;
	}

	_make_texture_array(attachment) {
		const texture = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
		gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, attachment.internal,
			this.size[0], this.size[1], attachment.layers,
			0, attachment.format, attachment.data_type, null
		);

		const params = this._default_parameters_or(attachment.parameters);
		for (const [parameter, value] of Object.entries(params)) {
			gl.texParameteri(gl.TEXTURE_2D_ARRAY, parameter, value);
		}

		// The docs says that the type of texture couldn't be gl.TEXTURE_2D_ARRAY.
		// It doesn't affects the rendering anyway
		gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment.attachment, gl.TEXTURE_2D_ARRAY, texture, 0);
		return texture;
	}

	_make_render_buffer(attachment) {
		const render_buffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, render_buffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, attachment.format, this.size[0], this.size[1]);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachment.attachment, gl.RENDERBUFFER, render_buffer);
		return render_buffer;
	}

	_default_parameters_or(params) {
		return params != undefined ? params : {
			[gl.TEXTURE_MIN_FILTER]: gl.LINEAR,
			[gl.TEXTURE_MAG_FILTER]: gl.LINEAR
		};
	}

	_default_or(target) {
		return target == null ? gl.FRAMEBUFFER : target;
	}
};
