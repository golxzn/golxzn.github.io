
const NODE_CUR = '.';
const NODE_UP  = '..';
const NODE_SEP = '/';
const NODE_DEFAULT_INFO = {
	name: "<unnamed>",
	trans: null,
	mesh: null,
	parent: null
};
Object.freeze(NODE_DEFAULT_INFO);

class node {
	constructor(info = NODE_DEFAULT_INFO) {
		this.name = info.name;
		this.mesh = info.mesh || null;
		this.transform = info.trans || new transform();
		this._parent = info.parent || null;
		this.children = [];
	}

	/** @param {node} value  */
	set parent(value) {
		if (value == this._parent) return;
		if (this._parent != null) {
			this._parent.remove_child(this);
		}
		this._parent = value;
		if (this._parent != null) {
			this._parent.add_child(this);
		}
	}

	get parent() {
		return this._parent;
	}

	/** @param {float} delta  */
	update(delta) {
		if (this.transform.is_dirty()) {
			this.transform.actualize_matrix();
		}
		this.children.forEach((child) => child.update(delta))
	}

	/** @param {graphics} g  */
	pre_draw(g) {
		g.push_transform(this.transform.matrix);
		g.set_engine_uniforms();
	}

	/** @param {graphics} g  */
	draw(g) {
		this.pre_draw(g);
		if (this.mesh) this.mesh.draw(g);
		this.draw_children(g);
		this.post_draw(g);
	}

	/** @param {graphics} g  */
	draw_children(g) {
		for (const child of this.children) {
			child.draw(g);
		}
	}

	/** @param {graphics} g  */
	post_draw(g) {
		g.reset_engine_uniforms();
		g.pop_transform();
	}

	/** @param {String} name  */
	find_child(name) {
		return this.children.find((child) => child.name == name);
	}

	/** @param {String} url */
	get_node(url) {
		var node = this;
		if (url.startsWith(NODE_SEP)) {
			node = this.get_root();
			url = url.substring(NODE_SEP.length);
		}

		for (const name of url.split(NODE_SEP)) {
			if (name == NODE_CUR || name.length == 0) continue;

			if (name != NODE_UP) {
				node = node.find_child(name);
			} else {
				node = node.parent;
			}

			if (node == null) {
				console.error(`[get_node] Cannot find node "${name}" in url "${url}"`)
				return null;
			}
		}
		return node;
	}

	get_root() {
		var root = this;
		while (root.parent != null) {
			root = root.parent;
		}
		return root;
	}

	get_scene() {
		return this.get_root();
	}

	get_url() {
		var stack = [];
		var parent = this.parent;
		while (parent != null) {
			stack.push(parent.name);
			parent = parent.parent;
		}
		return NODE_SEP + stack.join(NODE_SEP);
	}

	/**
	 * @param {node} value
	 * @param {int} index
	 */
	add_child(value, index = -1) {
		const id = this.children.findIndex((node) => node == value);
		if (id != -1 && id != index) { // We need to change its position
			this.children.splice(id, 1);
		}

		if (index != -1) {
			this.children.splice(index, 0, value)
		} else {
			this.children.push(value)
		}
		return value;
	}

	/** @param {node} value  */
	remove_child(value) {
		if (typeof(value) !== typeof(node)) return;

		const id = this.children.findIndex((node) => node == value);
		if (id != -1) {
			this.children.splice(id, 1);
		}
		return value;
	}

};