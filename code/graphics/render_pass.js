
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

	texture_count() {
		return this.framebuffer.textures.length;
	}

	texture(id = 0) {
		return this.framebuffer.texture(id);
	}

	render_buffer(id = 0) {
		return this.framebuffer.render_buffer(id);
	}

	bind_all_textures() {
		for (var i = 0; i < this.texture_count(); ++i) {
			this.texture(i).bind(i);
		}
	}

	bind(graphics) {
		if (this.has_pipeline()) graphics.push_pipeline(this.pipeline);
		this.framebuffer.bind();
		this.settings.forEach(param => gl.enable(param));
		this.callbacks.bind(this, graphics);
	}

	unbind(graphics) {
		this.callbacks.unbind(this, graphics);
		this.settings.forEach(param => gl.disable(param));
		this.framebuffer.unbind();
		if (this.has_pipeline()) graphics.pop_pipeline();
	}
};