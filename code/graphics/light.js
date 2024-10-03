
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

	view() { return golxzn.math.mat4.make_identity(); }
	projection() { return golxzn.math.mat4.make_identity(); }
};

class DirectionalLight extends LightBase {
	constructor(direction, base = null) {
		if (base != null) super(base.ambient, base.diffuse, base.specular);
		else super();

		this._direction = golxzn.math.normalize(direction);
		this._view = null;
		this._projection = golxzn.math.mat4.make_orthographic(
			-10.0, 10.0,
			-10.0, 10.0,
			1.0, 7.5
		);
	}

	set direction(value) {
		this._direction = value;
		this._view = null;
	}
	get direction() { return this._direction; }

	apply(pipeline, name) {
		const direction_name = `${name}.direction`;
		if (pipeline.uniform_location(direction_name) == null) return;

		super.apply(pipeline, name);
		pipeline.set_uniform(direction_name, this._direction);
	}

	view() {
		if (this._view == null) {
			this._view = golxzn.math.mat4.look_at(
				this._direction,
				[0.0, 10.0, 0.0],
				// golxzn.math.scale(this._direction, -10),
				[0.0, 1.0, 0.0]
			);
		}
		return this._view;
	}
	projection() { return this._projection; }
}

class PointLight extends LightBase {
	constructor(position, attenuation = [ 1.0, 0.09, 0.032 ], base = null) {
		if (base != null) super(base.ambient, base.diffuse, base.specular);
		else super();

		this.attenuation = attenuation;
		this._position = position;
		this._view = null;
		this._projection = golxzn.math.mat4.make_orthographic(
			-10.0, 10.0,
			-10.0, 10.0,
			1.0, 7.5
		);
	}

	set position(value) {
		this._position = value;
		this._view = null;
	}
	get position() { return this._position; }


	apply(pipeline, name) {
		const point_position_name = `${name}.position`;
		if (pipeline.uniform_location(point_position_name) == null) return;

		super.apply(pipeline, name);
		pipeline.set_uniform(point_position_name, this._position);
		pipeline.set_uniform(`${name}.attenuation`, this.attenuation);
	}

	view() {
		if (this._view == null) {
			this._view = golxzn.math.mat4.look_at(
				[0.0, 0.0, 0.0], // TODO: How to set this to fit the camera view?
				this._position,
				[0.0, 1.0, 0.0]
			);
			// TODO: I guess I need to take the camera position, throw the ray from the camera to
			// the surface, take this intersection dot and make to_light vector. And that's how
			// I could get the direction
		}
		return this._view;
	}
	projection() { return this._projection; }
}

const DEFAULT_SPOT_LIMITS = { inner: golxzn.math.to_radians(15), outer: golxzn.math.to_radians(17) }

class SpotLight extends PointLight {
	constructor(position, direction, attenuation = [ 1.0, 0.022, 0.0019 ], limits = null, base = null) {
		if (base != null) super(position, attenuation, base);
		else super();

		this._direction = golxzn.math.normalize(direction);
		this._limits = limits == null ? DEFAULT_SPOT_LIMITS : limits;
		this._view = null;
		this._projection = golxzn.math.mat4.make_orthographic(
			-10.0, 10.0,
			-10.0, 10.0,
			1.0, 7.5
		);
	}

	set direction(value) {
		this._direction = value;
		this._view = null;
	}
	get direction() { return this._direction; }

	apply(pipeline, name) {
		const direction_name = `${name}.direction`;
		if (pipeline.uniform_location(direction_name) == null) return;

		super.apply(pipeline, name);
		pipeline.set_uniform(direction_name, this._direction);
		pipeline.set_uniform(`${name}.limits.inner`, this._limits.inner);
		pipeline.set_uniform(`${name}.limits.outer`, this._limits.outer);
	}

	view() {
		if (this._view == null) {
			this._view = golxzn.math.mat4.look_at(
				this._direction,
				this._position,
				[0.0, 1.0, 0.0]
			);
		}
		return this._view;
	}
	projection() { return this._projection; }
}
