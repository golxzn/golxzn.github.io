
class pipeline_manager {
	constructor(graphics) {
		this._gl = graphics.gl;
		this._pipelines = new Map();
	}

	load(name, force_reload = false) {
		if (!force_reload && this.has_pipeline(name)) {
			return this._pipelines[name];
		}

		const pipeline_instance = new pipeline(this._gl, name, {
			[this._gl.VERTEX_SHADER  ]: pipeline_manager._get_shader_text(name, "vert"),
			[this._gl.FRAGMENT_SHADER]: pipeline_manager._get_shader_text(name, "frag")
		});
		if (pipeline_instance != null && pipeline_instance.valid()) {
			this._pipelines[name] = pipeline_instance;
			return pipeline_instance;
		}
		console.error(`[game][pipeline_manager] Cannot create ${name} pipeline!`);
		return null;
	}

	has_pipeline(name) {
		return name in this._pipelines && this._pipelines[name] != null;
	}

	static _make_shader_name(name, type) {
		return `#${name}-${type}`;
	}

	static _get_shader_text(name, type) {
		const element = document.querySelector(pipeline_manager._make_shader_name(name, type));
		if (element != null) {
			return element.text;
		}
		return null;
	}
};