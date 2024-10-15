
const DEFAULT_SNOW_PROPERTIES = {
	zone: {
		x1: -20, y1: -1, z1: -20, // LEFT BOTTOM FRONT CORNER
		x2:  20, y2: 25, z2:  20, // RIGHT TOP BACK CORNER
	},
	speed: {
		min: 1.0,
		max: 2.0
	},
	scale: {
		min: [0.05, 0.05, 0.05],
		max: [0.15, 0.15, 0.15]
	},
	direction: [0.0, -1.0, 0.0]
};

class snow_properties {
	constructor(data = DEFAULT_SNOW_PROPERTIES) {
		this.zone = data.zone == null ? DEFAULT_SNOW_PROPERTIES.zone : data.zone;
		this.speed = data.speed == null ? DEFAULT_SNOW_PROPERTIES.speed : data.speed;
		this.scale = data.scale == null ? DEFAULT_SNOW_PROPERTIES.scale : data.scale;
		this.direction = data.direction == null ? DEFAULT_SNOW_PROPERTIES.direction : data.direction;

		snow_properties._fix_missing_fields(this.zone, DEFAULT_SNOW_PROPERTIES.zone);
		snow_properties._fix_missing_fields(this.speed, DEFAULT_SNOW_PROPERTIES.speed);
		snow_properties._fix_missing_fields(this.scale, DEFAULT_SNOW_PROPERTIES.scale);
	}

	static _fix_missing_fields(target, defaults) {
		for (const field of Object.keys(defaults)) {
			if (!Object.hasOwn(target, field)) target[field] = 0.0;
		}
	}
};

class falling_snow extends particles {
	constructor(name, textures, count, properties = new snow_properties()) {
		super(name, textures, count);
		this.properties = properties;

		this.transform_all_particles((_, particle) => { this._spawn(particle) });
	}

	update(delta) {
		// Move particles
		this.transform_all_particles((_, particle) => { this._move(particle, delta) });

		// Respawn particles
		const dead_particles = this.filter_particles((_, particle) => { return this._out_of_zone(particle) });
		this.transform_particles(dead_particles, (_, particle) => { this._spawn(particle) });

		// update buffers
		super.update(delta);
	}

	_move(particle, delta) {
		const speed = golxzn.get_random(this.properties.speed.min, this.properties.speed.max);
		const next_position = golxzn.math.sum(
			particle.offsets,
			golxzn.math.scale(this.properties.direction, speed * delta)
		);
		for (var i = 0; i < next_position.length; ++i) {
			particle.offsets[i] = next_position[i];
		}
	}

	_out_of_zone(particle) {
		const x = 0, y = 1, z = 2;
		const offset = particle.offsets;
		const zone = this.properties.zone;

		// is inside
		return offset[x] < zone.x1 || offset[x] > zone.x2
			|| offset[y] < zone.y1 || offset[y] > zone.y2
			|| offset[z] < zone.z1 || offset[z] > zone.z2;
	}

	_spawn(particle) {
		const x = 0, y = 1, z = 2;
		const zone = this.properties.zone;
		particle.offsets[x] = golxzn.get_random(zone.x1, zone.x2);
		particle.offsets[y] = golxzn.get_random(zone.y1, zone.y2);
		particle.offsets[z] = golxzn.get_random(zone.z1, zone.z2);

		particle.rotation[x] = golxzn.math.to_radians(golxzn.get_random(-2, 2));
		particle.rotation[y] = golxzn.math.to_radians(golxzn.get_random(0, 180));
		particle.rotation[z] = golxzn.math.to_radians(-golxzn.get_random(88, 92));

		const scale = this.properties.scale;
		particle.scale[x] = golxzn.get_random(scale.min[x], scale.max[x]);
		particle.scale[y] = golxzn.get_random(scale.min[y], scale.max[y]);
		particle.scale[z] = golxzn.get_random(scale.min[z], scale.max[z]);
	}

};