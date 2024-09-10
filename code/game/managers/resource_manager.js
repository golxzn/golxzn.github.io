
class resource_manager {
	constructor(graphics) {
		this._url = document.URL;
		this._gl = graphics.gl;

		this.textures = new Map();
	}

	async preload_textures(paths) {
		var promises = [];
		for (const path of paths) {
			promises.push(this.load_texture(path));
		}
		for (const promise of paths) {
			await promise;
		}
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

	has_texture(path) {
		return path in this.textures && this.textures[path] != null;
	}


// private:
	_make_url(path) {
		return `${this._url}${path}`;
	}
}
