
const OBJECT_TYPE = {
	DRAWABLE: 1,
	UPDATABLE: 2,
	GIZMOS: 4,

	ALL: 0xFF
};
Object.freeze(OBJECT_TYPE);


/// @todo rework sm
class scene_manager {
	constructor() {
		this.updatable_objects = new Set();
		this.drawable_objects = new Set();
		this.gizmos_objects = new Set();
	}

	update(delta) {
		this.updatable_objects.forEach(object => object.update(delta));
	}

	render(g) {
		this.drawable_objects.forEach(object => object.draw(g));
	}

	render_gizmos(g) {
		this.gizmos_objects.forEach(object => object.draw_gizmos(g));
	}

	add_object(object) {
		if (typeof object.draw === "function") {
			this.drawable_objects.add(object);
		}
		if (typeof object.update === "function") {
			this.updatable_objects.add(object);
		}
		if (typeof object.draw_gizmos === "function") {
			this.gizmos_objects.add(object);
		}
		return object;
	}

	remove_object(object) {
		if (typeof object.draw === "function") {
			this.drawable_objects.delete(object);
		}
		if (typeof object.update === "function") {
			this.updatable_objects.delete(object);
		}
		if (typeof object.draw_gizmos === "function") {
			this.gizmos_objects.delete(object);
		}
	}

	find_object(name, type = OBJECT_TYPE.ALL) {
		const search = function(container) {
			for (var value of container) {
				if (value.name == name) return value;
			}
			return null;
		}

		const associated_types = {
			[OBJECT_TYPE.DRAWABLE]: this.drawable_objects,
			[OBJECT_TYPE.UPDATABLE]: this.updatable_objects,
			[OBJECT_TYPE.GIZMOS]: this.gizmos_objects
		};

		for (const key in Object.keys(OBJECT_TYPE)) {
			if (type & OBJECT_TYPE[key]) {
				const found = search(associated_types[OBJECT_TYPE[key]]);
				if (found != null) return found;
			}
		}

		return null;
	}

}
