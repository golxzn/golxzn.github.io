
class resource_manager {
	constructor(graphics) {
		this._url = document.URL;
		this._gl = graphics.gl;

		this.textures = new Map();
	}

	async preload_textures(paths, progress_callback = (loaded, total) => {}) {
		let loaded_count = 0;
		const total = paths.length;
		await Promise.all(paths.map(async (path) => {
			const texture = await this.load_texture(path);
			loaded_count++;
			progress_callback(loaded_count, total);
			return texture;
		}));
	}

	async load_texture(path, force_reload = false) {
		if (!force_reload && this.has_texture(path)) {
			return this.textures[path];
		}

		const image = await new Promise((resolve, reject) => {
			const img = new Image();
			img.setAttribute('crossorigin', 'anonymous');

			img.onload = () => resolve(img);
			img.onerror = reject;

			img.src = this._make_url(path);
		});

		const tex = new texture(this._gl, image);
		this.textures[path] = tex;
		return tex;
	}

	get_texture(path) {
		return this.textures[path];
	}

	has_texture(path) {
		return path in this.textures && this.textures[path] != null;
	}


// private:
	_make_url(path) {
		return `${this._url}${path}`;
	}
}
