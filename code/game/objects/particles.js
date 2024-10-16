
class particles extends model_object {
	constructor(name, textures, count, pipeline = ["3D", "PARTICLES"]) {
		const m = new mesh(textures, "none", particles._particles_info(count, pipeline));
		super(name, new model([m]));

		this.mesh = m;
		this.count = count;
		this.offsets = new Float32Array(count * 3);
		this.scales = new Float32Array(count * 3);
		this.rotations = new Float32Array(count * 3);
	}

	transform_all_particles(method) {
		for (var i = 0; i < this.count; ++i) {
			method(i, this.get_particle(i));
		}
	}

	transform_particles(ids, method) {
		ids.forEach((id) => { method(id, this.get_particle(id)); });
	}

	filter_particles(method) {
		var matches = [];
		const pusher = [
			(_) => {},
			(value) => { matches.push(value) },
		];

		for (var i = 0; i < this.count; ++i) {
			pusher[method(i, this.get_particle(i))](i);
		}
		return matches;
	}

	get_particle(id) {
		const offset = id * 3;
		return {
			offsets: this.offsets.subarray(offset, offset + 3),
			rotation: this.rotations.subarray(offset, offset + 3),
			scale: this.scales.subarray(offset, offset + 3)
		}
	}

	update(delta) {
		this.sync_buffers();
	}

	sync_buffers() {
		this.mesh.update_buffer_data("offsets", this.offsets);
		this.mesh.update_buffer_data("scales", this.scales);
		this.mesh.update_buffer_data("rotations", this.rotations);
	}

	static _particles_info(instance_count, pipeline) {
		return {
			pipeline: pipeline,
			draw_method: new draw_method({
				type: draw_method_type.instanced_elements,
				mode: gl.TRIANGLE_FAN,
				target_buffer: "ebo",
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
					//  [ x ] [ y ] [nz ] [off]
						0x00, 0x00, 0x7F, 0x00, // 0
						0x00, 0x7F, 0x7F, 0x00, // 1
						0x25, 0x40, 0x7F, 0x00, // 2                  1
						0x6D, 0x40, 0x7F, 0x00, // 3                 /\
						0x49, 0x00, 0x7F, 0x00, // 4         11_____/  \_____ 3
						0x6D, 0xC0, 0x7F, 0x00, // 5           \   12  2    /
						0x25, 0xC0, 0x7F, 0x00, // 6            \10  __   4/
						0x00, 0x81, 0x7F, 0x00, // 7            /     0    \
						0xDB, 0xC0, 0x7F, 0x00, // 8          9/____8  6____\5
						0x93, 0xC0, 0x7F, 0x00, // 9                \  /
						0xB7, 0x00, 0x7F, 0x00, // 10                \/
						0x93, 0x40, 0x7F, 0x00, // 11                 7
						0xDB, 0x40, 0x7F, 0x00  // 12

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
				}),
				new buffer_info({
					name: "ebo",
					target: gl.ELEMENT_ARRAY_BUFFER,
					usage: gl.STATIC_DRAW,
					// binary: new Uint16Array([0, 1, 2, 3]) // cube
					// binary: new Uint16Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 1]) // star 4 vert
					binary: new Uint16Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1]) // star 6 vert
				})
			]
		}
	}
};

