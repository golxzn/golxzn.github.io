
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
		this.zone = data.zone == null ? DEFAULT_SNOW_PROPERTIES.zone : data.zone;
		this.speed = data.speed == null ? DEFAULT_SNOW_PROPERTIES.speed : data.speed;
		this.scale = data.scale == null ? DEFAULT_SNOW_PROPERTIES.scale : data.scale;
		this.direction = golxzn.math.normalize(
			data.direction == null ? DEFAULT_SNOW_PROPERTIES.direction : data.direction
		);

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

class falling_snow extends cpu_particles {
	constructor(name, textures, count, properties = new snow_properties()) {
		const pipeline = ["3D", "PARTICLES_LIGHTING"]
		super(name, count, new mesh(textures, "none", falling_snow._make_mesh(count, pipeline)));
		this.properties = properties;

		this.transform_all_particles((_, particle) => { this._spawn(particle) });
	}

	update(delta) {
		// Move particles
		const falling_speed = golxzn.get_random(this.properties.speed.min, this.properties.speed.max);
		const distance = falling_speed * delta;
		this.transform_all_particles((_, particle) => { this._move(particle, distance, delta) });

		// Respawn particles
		const dead_particles = this.filter_particles((_, particle) => { return this._out_of_zone(particle) });
		this.transform_particles(dead_particles, (_, particle) => { this._respawn(particle) });

		// update buffers
		super.update(delta);
	}

	_move(particle, distance, delta) {
		// const speed = golxzn.get_random(this.properties.speed.min, this.properties.speed.max);
		// const distance = speed * delta;
		particle.offsets[0] += this.properties.direction[0] * distance;
		particle.offsets[1] += this.properties.direction[1] * distance;
		particle.offsets[2] += this.properties.direction[2] * distance;
		particle.rotation[0] += delta;
		particle.rotation[1] += delta;
		particle.rotation[2] += delta;
	}

	_out_of_zone(particle) {
		const x = 0, y = 1, z = 2;
		const offset = particle.offsets;
		const zone = this.properties.zone;

		return offset[x] < zone.x1 | offset[x] > zone.x2
			 | offset[y] < zone.y1 | offset[y] > zone.y2
			 | offset[z] < zone.z1 | offset[z] > zone.z2;
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

	_respawn(particle) {
		const x = 0, y = 1, z = 2;
		const zone = this.properties.zone;
		particle.offsets[x] = golxzn.get_random(zone.x1, zone.x2);
		particle.offsets[y] = zone.y2;
		particle.offsets[z] = golxzn.get_random(zone.z1, zone.z2);
	}

	static _make_mesh(instance_count, pipeline) {
		return {
			pipeline: pipeline,
			draw_method: new draw_method({
				type: draw_method_type.instanced_array,
				// mode: gl.TRIANGLE_FAN,
				mode: gl.TRIANGLES,
				target_buffer: "vbo",
				instances_count: instance_count
			}),
			settings: {
				disable: [gl.CULL_FACE]
			},
			buffer_infos: [
				new buffer_info({
					name: "vbo",
					layout: [
						new attribute_layout({ count: 2, type: gl.BYTE, normalized: true }), // position
						new attribute_layout({ count: 2, type: gl.BYTE, normalized: true }) // normal
					],
					binary: new Uint8Array([
						//  number | positive | negative
						//       1 |     0x7F | 0x81
						//     0.5 |     0x40 | 0xC0
						//   0.288 |     0x25 | 0xDB
						//    0.86 |     0x6D | 0x93
						//  0.5775 |     0x49 | 0xB7

					//  [ x ] [ y ] [nz ] [off] // TRIANGLES
						0x00, 0x7F, 0x7F, 0x00, // 1 -> 0
						0x93, 0xC0, 0x7F, 0x00, // 9 -> 1
						0x6D, 0xC0, 0x7F, 0x00, // 5 -> 2
						0x93, 0x40, 0x7F, 0x00, // 11-> 3
						0x00, 0x81, 0x7F, 0x00, // 7 -> 4
						0x6D, 0x40, 0x7F, 0x00, // 3 -> 5


					//  [ x ] [ y ] [nz ] [off] // TRIANGLE_FAN
						// 0x00, 0x00, 0x7F, 0x00, // 0
						// 0x00, 0x7F, 0x7F, 0x00, // 1
						// 0x25, 0x40, 0x7F, 0x00, // 2                  1
						// 0x6D, 0x40, 0x7F, 0x00, // 3                 /\
						// 0x49, 0x00, 0x7F, 0x00, // 4         11_____/  \_____ 3
						// 0x6D, 0xC0, 0x7F, 0x00, // 5           \   12  2    /
						// 0x25, 0xC0, 0x7F, 0x00, // 6            \10  __   4/
						// 0x00, 0x81, 0x7F, 0x00, // 7            /     0    \
						// 0xDB, 0xC0, 0x7F, 0x00, // 8          9/____8  6____\5
						// 0x93, 0xC0, 0x7F, 0x00, // 9                \  /
						// 0xB7, 0x00, 0x7F, 0x00, // 10                \/
						// 0x93, 0x40, 0x7F, 0x00, // 11                 7
						// 0xDB, 0x40, 0x7F, 0x00  // 12

					// STAR 4 outer vertices
						// 0x00, 0x00, 0x7F, 0x00, // 0
						// 0x00, 0x7F, 0x7F, 0x00, // 1
						// 0x20, 0x20, 0x7F, 0x00, // 2
						// 0x7F, 0x00, 0x7F, 0x00, // 3
						// 0x20, 0xE0, 0x7F, 0x00, // 4
						// 0x00, 0x81, 0x7F, 0x00, // 5
						// 0xE0, 0xE0, 0x7F, 0x00, // 6
						// 0x81, 0x00, 0x7F, 0x00, // 7
						// 0xE0, 0x20, 0x7F, 0x00, // 8

					//  [ x ] [ y ] [nz ] [off]
						// 0xC0, 0xC0, 0x7F, 0x00, // cube, triangle strip
						// 0x40, 0xC0, 0x7F, 0x00,
						// 0xC0, 0x40, 0x7F, 0x00,
						// 0x40, 0x40, 0x7F, 0x00
					])
				}),
				new buffer_info({
					name: "offsets",
					usage: gl.STREAM_DRAW,
					layout: [
						new attribute_layout({ count: 3, type: gl.FLOAT, divisor: 1 })
					],
					count: instance_count
				}),
				new buffer_info({
					name: "scales",
					usage: gl.STREAM_DRAW,
					layout: [
						new attribute_layout({ count: 3, type: gl.FLOAT, divisor: 1 })
					],
					count: instance_count
				}),
				new buffer_info({
					name: "rotations",
					usage: gl.STREAM_DRAW,
					layout: [
						new attribute_layout({ count: 3, type: gl.FLOAT, divisor: 1 })
					],
					count: instance_count
				})/*,
				new buffer_info({
					name: "ebo",
					target: gl.ELEMENT_ARRAY_BUFFER,
					usage: gl.STATIC_DRAW,
					// binary: new Uint16Array([0, 1, 2, 3]) // cube
					// binary: new Uint16Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 1]) // star 4 vert
					// binary: new Uint16Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1]) // star 6 vert
					binary: new Uint16Array([0, 1, 2, 3, 4, 5]) // gl.TRIANGLE
				})*/
			]
		}
	}
};