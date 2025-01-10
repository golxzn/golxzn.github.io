
class object_base {
	constructor(name, transform = golxzn.math.mat4.make_identity()) {
		this.name = name;
		this.transform = transform;
	}

	position() {
		return this.transform.slice(12, 15);
	}
}

class model_object extends object_base {
	constructor(name, model, transform = golxzn.math.mat4.make_identity()) {
		super(name, transform);
		this.model = model
	}

	draw(/*_gizmos*/graphics) {
		graphics.push_transform(this.transform);
		this.model.draw(graphics);
		graphics.pop_transform();
	}
}

class gizmos_object extends object_base {
	constructor(name, model, transform = golxzn.math.mat4.make_identity()) {
		super(name, transform);
		this.model = model
	}


	draw/*_gizmos*/(graphics) {
		graphics.push_transform(this.transform);
		this.model.draw(graphics);
		graphics.pop_transform();
	}
}