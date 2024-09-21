
class pipeline_manager {
	constructor(graphics) {
		this._gl = graphics.gl;
		this._pipelines = new Map();
	}

	load(dimensions, name, force_reload = false) {
		if (!force_reload && this.has_pipeline(name)) {
			return this._pipelines[name];
		}

		const pipeline_instance = new pipeline(this._gl, name, {
			[this._gl.VERTEX_SHADER  ]: pipeline_manager._get_shader_text(name, dimensions, "vert"),
			[this._gl.FRAGMENT_SHADER]: pipeline_manager._get_shader_text(name, dimensions, "frag")
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

	static _get_shader_text(name, dimensions, type) {
		if (!(dimensions in SHADERS)) return null;

		const dim = SHADERS[dimensions];
		if (!(name in dim)) return null;

		return dim[name][type];
	}
};