const DEFAULT_LIGHT_INFO = {
	color: [1.0, 1.0, 1.0],
	intensity: 1.0
};
Object.freeze(DEFAULT_LIGHT_INFO);

class LightBase {
	constructor(info = DEFAULT_LIGHT_INFO) {
		this.color = info.color || DEFAULT_LIGHT_INFO.color;
		this.intensity = info.intensity != null ? info.intensity : DEFAULT_LIGHT_INFO.intensity;
	}

	apply(pipeline, name) {
		pipeline.try_set_uniform(`${name}.color`, () => this.color);
		pipeline.try_set_uniform(`${name}.intensity`, () => this.intensity);
	}

	view() { return golxzn.math.mat4.identity(); }
	projection() { return golxzn.math.mat4.identity(); }
};

class DirectionalLight extends LightBase {
	constructor(direction, info = DEFAULT_LIGHT_INFO) {
		super(info);

		this._direction = golxzn.math.normalize(direction);
		this._view = null;
		this._projection = golxzn.math.mat4.make_orthographic(
			-10.0, 10.0,
			-10.0, 10.0,
			1.0, 7.5
		);
	}

	set direction(value) {
		this._direction = golxzn.math.normalize(value);
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

const ATTENUATION_THRESHOLD = 0.005;

class PointLight extends LightBase {
	constructor(position, attenuation = [ 1.0, 0.09, 0.032 ], base = DEFAULT_LIGHT_INFO) {
		super(base);

		this.attenuation = attenuation;
		this._position = position;
	}

	set position(value) {
		this._position = value;
	}
	get position() { return this._position; }

	max_distance() {
		const c = this.attenuation[0] - (1.0 / ATTENUATION_THRESHOLD);
		const l = this.attenuation[1];
		const q = this.attenuation[2];

		return (-l + Math.sqrt(l * l - 4.0 * q * c) ) / (2.0 * q);
	}

	apply(pipeline, name) {
		const point_position_name = `${name}.position`;
		if (pipeline.uniform_location(point_position_name) == null) return;

		super.apply(pipeline, name);
		pipeline.set_uniform(point_position_name, this._position);
		pipeline.set_uniform(`${name}.attenuation`, this.attenuation);
	}
}

const DEFAULT_SPOT_LIMITS = { inner: golxzn.math.to_radians(15), outer: golxzn.math.to_radians(17) }

class SpotLight extends PointLight {
	constructor(position, direction, attenuation = [ 1.0, 0.022, 0.0019 ], limits = null, base = DEFAULT_LIGHT_INFO) {
		super(position, attenuation, base);

		this._direction = golxzn.math.normalize(direction);
		this._limits = limits == null ? DEFAULT_SPOT_LIMITS : limits;
		this._view = null;
		this._view_proj = null;
		this._projection = golxzn.math.mat4.make_perspective(
			this._limits.outer * 2,
			1.0,
			PERSPECTIVE_NEAR,
			this.max_distance()
		);
	}
	set position(value) {
		this._position = value;
		this._view = null;
		this._view_proj = null;
	}
	get position() { return this._position; }
	set direction(value) {
		this._direction = golxzn.math.normalize(value);
		this._view = null;
		this._view_proj = null;
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
				this._position,
				this._direction,
				[0.0, 1.0, 0.0]
			);
		}
		return this._view;
	}
	projection() { return this._projection; }

	view_projection() {
		if (this._view_proj == null) {
			this._view_proj = golxzn.math.mat4.multiply(this.view(), this.projection());
		}
		return this._view_proj;
	}

	view_projection_position() {
		return golxzn.math.mat4.multiply_vec4(
			this.view_projection(),
			this._position.concat(1.0)
		);
	}
}
