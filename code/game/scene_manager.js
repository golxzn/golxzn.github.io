
class scene_manager {
	constructor() {
		this.objects = []
	}

	update(delta) {
		for (var object in this.objects) {
			object.update(delta);
		}
	}

	render(g) {
		for (var object in this.objects) {
			object.draw(g);
		}
	}


	add_object(object) {
		this.objects.push(object)
	}

	remove_object(object) {
		this.objects = this.objects.filter(obj => obj.name !== object.name)
	}

}
