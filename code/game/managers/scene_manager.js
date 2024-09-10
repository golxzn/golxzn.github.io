const OBJECT_TYPE_DRAWABLE  = 1;
const OBJECT_TYPE_UPDATABLE = 2;

class scene_manager {
	constructor() {
		this.updatable_objects = new Set();
		this.drawable_objects = new Set();
	}

	update(delta) {
		this.updatable_objects.forEach(object => object.update(delta));
	}

	render(g) {
		this.drawable_objects.forEach(object => object.draw(g));
	}


	add_object(object) {
		if (typeof object.name !== "string" || object.name == '') {
			console.warn("[scene_manager] Cannot add object! Object", object, "has no name!");
			return null;
		}

		if (typeof object.draw === "function") {
			this.drawable_objects.add(object);
		}
		if (typeof object.update === "function") {
			this.updatable_objects.add(object);
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
	}

	find_object(name, type = OBJECT_TYPE_DRAWABLE | OBJECT_TYPE_UPDATABLE) {
		const search = function(container) {
			for (var value of container) {
				if (value.name == name) return value;
			}
			return null;
		}

		if ((type & OBJECT_TYPE_DRAWABLE) == OBJECT_TYPE_DRAWABLE) {
			const found = search(this.drawable_objects);
			if (found != null) return found;
		}
		if ((type & OBJECT_TYPE_UPDATABLE) == OBJECT_TYPE_UPDATABLE) {
			const found = search(this.updatable_objects);
			if (found != null) return found;
		}
		return null;
	}

}
