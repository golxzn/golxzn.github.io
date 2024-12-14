
const DEFAULT_SNOW_PROPERTIES = {
	zone: {
		x1: -30, y1: -2, z1: -30, // LEFT BOTTOM FRONT CORNER
		x2:  30, y2: 20, z2:  30, // RIGHT TOP BACK CORNER
	},
	speed: {
		min: 1.0,
		max: 1.2
	},
	scale: {
		min: [0.005, 0.005, 0.005],
		max: [0.008, 0.008, 0.008]
	},
	direction: [0.4, -1.0, 0.0]
};

class snow_properties {
	constructor(data = DEFAULT_SNOW_PROPERTIES) {
		this.zone = snow_properties._extract(data, "zone", DEFAULT_SNOW_PROPERTIES);
		this.speed = snow_properties._extract(data, "speed", DEFAULT_SNOW_PROPERTIES);
		this.scale = snow_properties._extract(data, "scale", DEFAULT_SNOW_PROPERTIES);
		this.direction = golxzn.math.normalize(
			snow_properties._extract(data, "direction", DEFAULT_SNOW_PROPERTIES)
		);

		snow_properties._fix_missing_fields(this.zone, DEFAULT_SNOW_PROPERTIES.zone);
		snow_properties._fix_missing_fields(this.speed, DEFAULT_SNOW_PROPERTIES.speed);
		snow_properties._fix_missing_fields(this.scale, DEFAULT_SNOW_PROPERTIES.scale);
	}

	static _extract(data, field, default_object) {
		if (Object.hasOwn(data, field) && data[field] != null) {
			return data[field];
		}
		return default_object[field];
	}

	static _fix_missing_fields(target, defaults) {
		for (const field of Object.keys(defaults)) {
			if (!Object.hasOwn(target, field)) target[field] = 0.0;
		}
	}
};

