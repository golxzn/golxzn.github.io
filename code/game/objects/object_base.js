
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

		// Aw fuck, that smells really disgusting. But I just want to finish this shit
		this.model.begin_draw_group = (g) => this.begin_draw_group(g);
		this.model.end_draw_group = (g) => this.end_draw_group(g);
	}

	begin_draw_group(graphics) {}
	end_draw_group(graphics) {}

	draw(graphics) {
		graphics.push_transform(this.transform);
		this.model.draw(graphics);
		graphics.pop_transform();
	}
}
