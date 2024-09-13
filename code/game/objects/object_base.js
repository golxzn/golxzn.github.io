
class object_base {
	constructor(name, transform = golxzn.math.mat4.make_identity()) {
		this.name = name;
		this.transform = transform;
	}
}

class model_object extends object_base {
	constructor(name, model, transform = golxzn.math.mat4.make_identity()) {
		super(name, transform);
		this.model = model
	}

	draw(graphics) {
		graphics.push_transform(this.transform);
		this.model.draw(graphics);
		graphics.pop_transform();
	}
}
