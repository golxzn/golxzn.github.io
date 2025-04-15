const DEFAULT_LIGHT_INFO = {
	color: [1.0, 1.0, 1.0],
	intensity: 1.0
};
Object.freeze(DEFAULT_LIGHT_INFO);
const BUFFER_PADDING = -0;

class LightBase {
	constructor(info = DEFAULT_LIGHT_INFO, projection = null) {
		this.color = info.color || DEFAULT_LIGHT_INFO.color;
		this.intensity = info.intensity != null ? info.intensity : DEFAULT_LIGHT_INFO.intensity;
		this.dirty = true;

		this._position = [0.0, 0.0, 0.0];
		this._direction = [0.0, 0.0, 0.0];
		this._projection = projection || golxzn.math.mat4.identity();
		this._view = null;
		this._view_proj = null;
	}

	set position(vec3) {
		this._position = vec3;
		this._invalidate();
	}
	get position() {
		return this._position;
	}

	set direction(value) {
		this._direction = golxzn.math.normalize(value);
		this._invalidate();
	}
	get direction() { return this._direction; }



	binary() { return null }

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
			this._view_proj = golxzn.math.mat4.multiply(
				this.view(),
				this.projection()
			);
		}
		return this._view_proj;
	}

	_invalidate() {
		this.dirty = true;
		this._view = null;
		this._view_proj = null;
	}

	static write(buffer, data, offset) {
		const length = data.length;
		buffer.set(data, offset);
		return length
	};
};

class DirectionalLight extends LightBase {
	constructor(direction, info = DEFAULT_LIGHT_INFO) {
		super(info, null, golxzn.math.mat4.make_orthographic(
			-10.0, 10.0,
			-10.0, 10.0,
			1.0, 7.5
		));

		this._direction = golxzn.math.normalize(direction);
		this._position = DirectionalLight.make_stupidly_far_position(this._direction);
	}

	binary() {
		this.dirty = false;
		return new Float32Array(this.view_projection().concat([
			this.color[0]     , this.color[1]     , this.color[2]     , this.intensity,
			this._direction[0], this._direction[1], this._direction[2], BUFFER_PADDING,
		]));
	}

	static make_stupidly_far_position(dir) {
 		// ROFLAND. The distance form the Earth to the Sun in meters is 149597870700
		// But since this value takes 5 bytes, and I need to fit it in float, let it just be
		// largest negative float, but slightly more.
		return golxzn.math.scale(dir, -3.40282347e+38);
	}
}

const ATTENUATION_THRESHOLD = 0.005;

class PointLight extends LightBase {
	constructor(position, attenuation = [ 1.0, 0.09, 0.032 ], base = DEFAULT_LIGHT_INFO) {
		super(base);

		this.attenuation = attenuation;
		this._position = position;
	}

	binary() {
		this.dirty = false;
		return new Float32Array([
			this.color[0]      , this.color[1]      , this.color[2]      , this.intensity,
			this._position[0]  , this._position[1]  , this._position[2]  , BUFFER_PADDING,
			this.attenuation[0], this.attenuation[1], this.attenuation[2], BUFFER_PADDING
		]);
	}

	max_distance() {
		const c = this.attenuation[0] - (1.0 / ATTENUATION_THRESHOLD);
		const l = this.attenuation[1];
		const q = this.attenuation[2];

		return (-l + Math.sqrt(l * l - 4.0 * q * c) ) / (2.0 * q);
	}
}

const DEFAULT_SPOT_LIMITS = { inner: golxzn.math.to_radians(15), outer: golxzn.math.to_radians(17) }

class SpotLight extends PointLight {
	constructor(position, direction, attenuation = [ 1.0, 0.022, 0.0019 ], limits = null, base = DEFAULT_LIGHT_INFO) {
		super(position, attenuation, base);

		this._view = null;
		this._direction = golxzn.math.normalize(direction);
		this._limits = limits == null ? DEFAULT_SPOT_LIMITS : limits;
		this._projection = golxzn.math.mat4.make_perspective(
			this._limits.outer * 2,
			1.0,
			PERSPECTIVE_NEAR,
			this.max_distance()
		);
	}

	set outer_limit(value) {
		this._limits.outer = value;
		this.dirty = true;
	}
	set inner_limit(value) {
		this._limits.outer = value;
		this.dirty = true;
	}


	binary() {
		this.dirty = false;
		return new Float32Array(this.view_projection().concat([
			this.color[0]      , this.color[1]      , this.color[2]      , this.intensity,
			this._position[0]  , this._position[1]  , this._position[2]  , this._limits.inner,
			this.attenuation[0], this.attenuation[1], this.attenuation[2], this._limits.outer,
			this._direction[0] , this._direction[1] , this._direction[2] , BUFFER_PADDING,
		]));
	}
}
