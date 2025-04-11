
class pipeline_manager {
	constructor() {
		this._pipelines = new Map();
	}

	emplace(name, data, force_reload = false) {
		if (!force_reload && this.has_pipeline(name)) {
			return;
		}

		if (data == null) {
			console.error(`[game][pipeline_manager] Cannot find a "${dimensions}.${name}" shader`);
			return;
		}

		const {frag, vert, properties} = data;
		if (frag == null) {
			console.error(`[game][pipeline_manager] Cannot find fragment code for "${dimensions}.${name}"`);
			return;
		}
		const pipeline_instance = new pipeline(name, {
			[gl.VERTEX_SHADER  ]: vert,
			[gl.FRAGMENT_SHADER]: frag
		}, properties);

		if (pipeline_instance != null && pipeline_instance.valid()) {
			this._pipelines[name] = pipeline_instance;
		} else {
			console.error(`[game][pipeline_manager] Cannot create ${name} pipeline!`);
		}
	}

	load(dimensions, name, force_reload = false) {
		if (!force_reload && this.has_pipeline(name)) {
			return this._pipelines[name];
		}

		const shader_data = pipeline_manager._find_shader(name, dimensions);
		if (shader_data == null) {
			console.error(`[game][pipeline_manager] Cannot find a "${dimensions}.${name}" shader`);
			return null;
		}

		if (shader_data.frag == null) {
			console.error(`[game][pipeline_manager] Cannot find fragment code for "${dimensions}.${name}"`);
			return null;
		}
		const pipeline_instance = new pipeline(name, {
			[gl.VERTEX_SHADER  ]: shader_data.vert,
			[gl.FRAGMENT_SHADER]: shader_data.frag
		}, shader_data.properties);

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

	get_pipeline(name) {
		return this._pipelines[name];
	}

	static _find_shader(name, dimensions) {
		if (!(dimensions in SHADERS)) return null;

		const dim = SHADERS[dimensions];
		if (!(name in dim)) return null;

		return dim[name];
	}
};
