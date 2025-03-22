
const SCENE_DEFAULT_INFO = Object.assign({}, NODE_DEFAULT_INFO, {
	meshes: [],
	textures: []
});
Object.freeze(SCENE_DEFAULT_INFO);

class scene extends node {

	constructor(info = SCENE_DEFAULT_INFO) {
		super(SCENE_DEFAULT_INFO);

		this.meshes = info.meshes || [];
		this.textures = info.textures || [];
	}

	/** @param {int} id  */
	get_mesh(id) {
		return id < this.meshes.length ? this.meshes[id] : null;
	}

	/** @param {int} id  */
	get_texture(id) {
		return id < this.textures.length ? this.textures[id] : null;
	}

	/** @param {graphics} g  */
	draw(g) {
		this.pre_draw(g);
		this.draw(g);
		this.draw_children(g);
		this.post_draw(g);
	}
};