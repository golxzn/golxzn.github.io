
class resource_manager {
	constructor() {
		this._url = document.URL;

		this.textures = new Map();
		this.binaries = new Map();
		this.models = new Map();
		this.configs = new Map();
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

		// if (path.endsWith("glb")) {
		// 	const glb = await this.load_binary(path);
		// 	const gltf = extract_gltf(glb);
		// 	const binaries = extract_buffers(glb);
		// store binaries to access through resman
		// }
		// if (path.endsWith("gltf")) {
		// }

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

// private:
	/** @param {String} path  */
	_make_url(path) {
		return path.startsWith("http") ? path : `${this._url}${path}`;
	}

	_has_in(container, path) {
		return path in container && container[path] != null;
	}
}
