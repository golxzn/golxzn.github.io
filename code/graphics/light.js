
class LightBase {
	constructor(ambient = [1.0, 1.0, 1.0], diffuse = [1.0, 1.0, 1.0], specular = [1.0, 1.0, 1.0]) {
		this.ambient = ambient;
		this.diffuse = diffuse;
		this.specular = specular;
	}

	apply(pipeline, name) {
		const uniform_name = `${name}.properties`
		if (pipeline.uniform_location(`${uniform_name}.ambient`) == null) return;

		pipeline.set_uniform(`${uniform_name}.ambient`, this.ambient);
		pipeline.set_uniform(`${uniform_name}.diffuse`, this.diffuse);
		pipeline.set_uniform(`${uniform_name}.specular`, this.specular);
	}
};

class DirectionalLight extends LightBase {
	constructor(direction, base = null) {
		if (base != null) super(base.ambient, base.diffuse, base.specular);
		else super();

		this.direction = golxzn.math.normalize(direction);
	}

	apply(pipeline, name) {
		const direction_name = `${name}.direction`;
		if (pipeline.uniform_location(direction_name) == null) return;

		super.apply(pipeline, name);
		pipeline.set_uniform(direction_name, this.direction);
	}
}

class PointLight extends LightBase {
	constructor(position, attenuation = [ 1.0, 0.09, 0.032 ], base = null) {
		if (base != null) super(base.ambient, base.diffuse, base.specular);
		else super();

		this.position = position;
		this.attenuation = attenuation;
	}

	apply(pipeline, name) {
		const point_position_name = `${name}.position`;
		if (pipeline.uniform_location(point_position_name) == null) return;

		super.apply(pipeline, name);
		pipeline.set_uniform(point_position_name, this.position);
		pipeline.set_uniform(`${name}.attenuation`, this.attenuation);
	}
}
