
const DEFAULT_FRAMEBUFFER_CALLBACKS = {
	bind: function() {},
	unbind: function() {}
}

class render_pass {
	constructor(name, framebuffer, settings = [], callbacks = DEFAULT_FRAMEBUFFER_CALLBACKS) {
		this._gl = framebuffer._gl;

		this.name = name;
		this.framebuffer = framebuffer;
		this.settings = settings;
		this.callbacks = callbacks;
	}

	valid() {
		return this.framebuffer != null && this.framebuffer.complete();
	}

	bind() {
		this.framebuffer.bind();
		this._gl.viewport(0, 0, this.framebuffer.width(), this.framebuffer.height());
		this.settings.forEach(param => this._gl.enable(param));
		this.callbacks.bind();
	}

	unbind() {
		this.settings.forEach(param => this._gl.disable(param));
		this.callbacks.unbind();
		this.framebuffer.unbind();
	}
};