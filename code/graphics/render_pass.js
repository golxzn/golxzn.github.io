
const DEFAULT_FRAMEBUFFER_CALLBACKS = {
	bind: function() {},
	unbind: function() {}
}

class render_pass {
	constructor(name, framebuffer, settings = [], callbacks = DEFAULT_FRAMEBUFFER_CALLBACKS, pipeline = null) {
		this.name = name;
		this.framebuffer = framebuffer;
		this.settings = settings;
		this.callbacks = callbacks;
		this.pipeline = pipeline;

		// if (!this.framebuffer.complete()) {
		// 	throw new Error(`[${name}] The framebuffer is not complete`);
		// }
	}

	valid() {
		return this.framebuffer != null && this.framebuffer.complete();
	}

	has_pipeline() {
		return this.pipeline != null;
	}

	bind(graphics) {
		this.framebuffer.bind();
		this.settings.forEach(param => gl.enable(param));
		this.callbacks.bind(this, graphics);
	}

	unbind(graphics) {
		this.callbacks.unbind(this, graphics);
		this.settings.forEach(param => gl.disable(param));
		this.framebuffer.unbind();
	}
};