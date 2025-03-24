
class resource_manager {
	constructor() {
		this._url = document.URL;

		this.textures = new Map();
		this.binaries = new Map();
		this.models = new Map();
		this.configs = new Map();
		this.materials = this._load_default_materials(); /// @todo remove it
	}

	async preload_textures(info, progress_callback = (loaded, total) => {}) {
		let loaded_count = 0;
		const total = info.length;
		return await Promise.all(info.map(async (info) => {
			const texture = await this.load_texture(info.path, info.sampler);
			progress_callback(loaded_count++, total);
			return texture;
		}));
	}

	async preload_models(paths, progress_callback = (loaded, total) => {}) {
		let loaded_count = 0;
		const total = paths.length;
		return await Promise.all(paths.map(async (path) => {
			const model = await this.load_model(path);
			progress_callback(loaded_count++, total);
			return model;
		}));
	}

	async preload_buffers(paths, progress_callback = (loaded, total) => {}) {
		let loaded_count = 0;
		const total = paths.length;
		return await Promise.all(paths.map(async (path) => {
			const buffer = await this.load_binary(path);
			progress_callback(loaded_count++, total);
			return buffer;
		}));
	}

	/**
	 * @param {String} path
	 * @param {boolean} [force_reload=false] Reload content
	 **/
	async load_config(path, force_reload = false) {
		if (!force_reload && this.has_config(path)) {
			return this.get_config(path);
		}

		try {
			const response = await fetch(this._make_url(path));
			if (!response.ok) {
				return null;
			}

			const json = await response.json()
			this.configs[path] = json;
			return json;
		} catch (error) {
			console.error(error.message);
		}
		return null;
	}

	/**
	 * @param {String} path
	 * @param {boolean} [force_reload=false] Reload content
	 **/
	async load_texture(path, sampler, force_reload = false) {
		if (!force_reload && this.has_texture(path)) {
			return this.get_texture(path);
		}

		const image = await new Promise((resolve, reject) => {
			const img = new Image();
			img.setAttribute('crossorigin', 'anonymous');

			img.onload = () => resolve(img);
			img.onerror = reject;

			img.src = this._make_url(path);
		});

		const tex = new texture(image, sampler);
		this.textures[path] = tex;
		return tex;
	}

	/**
	 * @param {String} path
	 * @param {boolean} [force_reload=false] Reload content
	 **/
	async load_binary(path, force_reload = false) {
		if (!force_reload && this.has_binary(path)) {
			return this.get_binary(path);
		}

		const buffer = await new Promise((resolve, reject) => {
			const request = new XMLHttpRequest();
			request.responseType = "arraybuffer";
			request.open("GET", this._make_url(path), true);
			request.onload = (_event) => {
				if (request.status != 200) {
					resolve(null);
					return;
				}
				resolve(request.response);
			};
			request.onerror = reject;
			request.send(null);
		});

		if (buffer != null) {
			this.binaries[path] = buffer;
		}
		return buffer;
	}

	async load_model(path, force_reload = false) {
		if (!force_reload && this.has_model(path)) {
			return this.get_model(path);
		}

		const gltf = await this.load_config(path);
		if (gltf == null) return null;

		const loader = new gltf_loader(path, gltf);
		const model = await loader.load();
		if (model != null) {
			this.models[path] = model;
		}
		return model;
	}

	/** @param {String} path  */
	get_config(path) { return this.configs[path]; }

	/** @param {String} path  */
	has_config(path) { return this._has_in(this.configs, path); }

	/** @param {String} path  */
	get_texture(path) { return this.textures[path]; }

	/** @param {String} path  */
	has_texture(path) { return this._has_in(this.textures, path); }

	/** @param {String} path  */
	get_binary(path) { return this.binaries[path]; }

	/** @param {String} path  */
	has_binary(path) { return this._has_in(this.binaries, path); }

	/** @param {String} path  */
	get_model(path) { return this.models[path]; }

	/** @param {String} path  */
	has_model(path) { return this._has_in(this.models, path); }

	/** @param {String} path  */
	get_material(path) { return this.materials[path]; }

	/** @param {String} path  */
	has_material(path) { return this._has_in(this.materials, path); }

// private:
	/** @param {String} path  */
	_make_url(path) {
		return `${this._url}${path}`;
	}

	_has_in(container, path) {
		return path in container && container[path] != null;
	}

	_load_default_materials() {
		return {
// Have taken from http://devernay.free.fr/cours/opengl/materials.html
"none":           { ambient: [ 1.000000, 1.000000, 1.000000 ], diffuse: [ 1.000000, 1.000000, 1.000000 ], specular: [ 1.000000, 1.000000, 1.000000 ], shininess: 128.0 * 0.25 },
"emerald":        { ambient: [ 0.021500, 0.174500, 0.021500 ], diffuse: [ 0.075680, 0.614240, 0.075680 ], specular: [ 0.633000, 0.727811, 0.633000 ], shininess: 128.0 * 0.6 },
"jade":           { ambient: [ 0.135000, 0.222500, 0.157500 ], diffuse: [ 0.540000, 0.890000, 0.630000 ], specular: [ 0.316228, 0.316228, 0.316228 ], shininess: 128.0 * 0.1 },
"obsidian":       { ambient: [ 0.053750, 0.050000, 0.066250 ], diffuse: [ 0.182750, 0.170000, 0.225250 ], specular: [ 0.332741, 0.328634, 0.346435 ], shininess: 128.0 * 0.3 },
"pearl":          { ambient: [ 0.250000, 0.207250, 0.207250 ], diffuse: [ 1.000000, 0.829000, 0.829000 ], specular: [ 0.296648, 0.296648, 0.296648 ], shininess: 128.0 * 0.088 },
"ruby":           { ambient: [ 0.174500, 0.011750, 0.011750 ], diffuse: [ 0.614240, 0.041360, 0.041360 ], specular: [ 0.727811, 0.626959, 0.626959 ], shininess: 128.0 * 0.6 },
"turquoise":      { ambient: [ 0.100000, 0.187250, 0.174500 ], diffuse: [ 0.396000, 0.741510, 0.691020 ], specular: [ 0.297254, 0.308290, 0.306678 ], shininess: 128.0 * 0.1 },
"brass":          { ambient: [ 0.329412, 0.223529, 0.027451 ], diffuse: [ 0.780392, 0.568627, 0.113725 ], specular: [ 0.992157, 0.941176, 0.807843 ], shininess: 128.0 * 0.21794872 },
"bronze":         { ambient: [ 0.212500, 0.127500, 0.054000 ], diffuse: [ 0.714000, 0.428400, 0.181440 ], specular: [ 0.393548, 0.271906, 0.166721 ], shininess: 128.0 * 0.2 },
"chrome":         { ambient: [ 0.250000, 0.250000, 0.250000 ], diffuse: [ 0.400000, 0.400000, 0.400000 ], specular: [ 0.774597, 0.774597, 0.774597 ], shininess: 128.0 * 0.6 },
"copper":         { ambient: [ 0.191250, 0.073500, 0.022500 ], diffuse: [ 0.703800, 0.270480, 0.082800 ], specular: [ 0.256777, 0.137622, 0.086014 ], shininess: 128.0 * 0.1 },
"gold":           { ambient: [ 0.247250, 0.199500, 0.074500 ], diffuse: [ 0.751640, 0.606480, 0.226480 ], specular: [ 0.628281, 0.555802, 0.366065 ], shininess: 128.0 * 0.4 },
"silver":         { ambient: [ 0.192250, 0.192250, 0.192250 ], diffuse: [ 0.507540, 0.507540, 0.507540 ], specular: [ 0.508273, 0.508273, 0.508273 ], shininess: 128.0 * 0.4 },
"white plastic":  { ambient: [ 0.000000, 0.000000, 0.000000 ], diffuse: [ 0.550000, 0.550000, 0.550000 ], specular: [ 0.700000, 0.700000, 0.700000 ], shininess: 128.0 * 0.25 },
"black plastic":  { ambient: [ 0.000000, 0.000000, 0.000000 ], diffuse: [ 0.010000, 0.010000, 0.010000 ], specular: [ 0.500000, 0.500000, 0.500000 ], shininess: 128.0 * 0.25 },
"red plastic":    { ambient: [ 0.000000, 0.000000, 0.000000 ], diffuse: [ 0.500000, 0.000000, 0.000000 ], specular: [ 0.700000, 0.600000, 0.600000 ], shininess: 128.0 * 0.25 },
"green plastic":  { ambient: [ 0.000000, 0.000000, 0.000000 ], diffuse: [ 0.100000, 0.350000, 0.100000 ], specular: [ 0.450000, 0.550000, 0.450000 ], shininess: 128.0 * 0.25 },
"yellow plastic": { ambient: [ 0.000000, 0.000000, 0.000000 ], diffuse: [ 0.500000, 0.500000, 0.000000 ], specular: [ 0.600000, 0.600000, 0.500000 ], shininess: 128.0 * 0.25 },
"cyan plastic":   { ambient: [ 0.000000, 0.100000, 0.060000 ], diffuse: [ 0.000000, 0.509804, 0.509804 ], specular: [ 0.501961, 0.501961, 0.501961 ], shininess: 128.0 * 0.25 },
"white rubber":   { ambient: [ 0.050000, 0.050000, 0.050000 ], diffuse: [ 0.500000, 0.500000, 0.500000 ], specular: [ 0.700000, 0.700000, 0.700000 ], shininess: 128.0 * 0.078125 },
"black rubber":   { ambient: [ 0.020000, 0.020000, 0.020000 ], diffuse: [ 0.010000, 0.010000, 0.010000 ], specular: [ 0.400000, 0.400000, 0.400000 ], shininess: 128.0 * 0.078125 },
"cyan rubber":    { ambient: [ 0.000000, 0.050000, 0.050000 ], diffuse: [ 0.400000, 0.500000, 0.500000 ], specular: [ 0.040000, 0.700000, 0.700000 ], shininess: 128.0 * 0.078125 },
"green rubber":   { ambient: [ 0.000000, 0.050000, 0.000000 ], diffuse: [ 0.400000, 0.500000, 0.400000 ], specular: [ 0.040000, 0.700000, 0.040000 ], shininess: 128.0 * 0.078125 },
"red rubber":     { ambient: [ 0.050000, 0.000000, 0.000000 ], diffuse: [ 0.500000, 0.400000, 0.400000 ], specular: [ 0.700000, 0.040000, 0.040000 ], shininess: 128.0 * 0.078125 },
"yellow rubber":  { ambient: [ 0.050000, 0.050000, 0.000000 ], diffuse: [ 0.500000, 0.500000, 0.400000 ], specular: [ 0.700000, 0.700000, 0.040000 ], shininess: 128.0 * 0.078125 },
		};
	}
}
