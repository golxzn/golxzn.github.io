
class particles extends model_object {
	constructor(name, textures, count) {
		const m = new mesh(textures, null, particles._particles_info(count));
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

	filter_particles(method, count = null) {
		var matches = [];
		for (var i = 0; i < this.count; ++i) {
			if (method(i, this.get_particle(i))) matches.push(i);
			if (count != null && matches.length >= count) break;
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

	static _particles_info(instance_count) {
		return {
			pipeline: ["3D", "PARTICLES"],
			draw_method: new draw_method({
				type: draw_method_type.instanced_elements,
				mode: gl.TRIANGLE_STRIP,
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
						new attribute_layout({ count: 3, type: gl.FLOAT,          normalized: false }), // position
						new attribute_layout({ count: 4, type: gl.BYTE,           normalized: true  }), // normal
						new attribute_layout({ count: 2, type: gl.UNSIGNED_SHORT, normalized: true  })  // UV
					],
					binary: new Uint8Array([
					//  [         x          ]  [         y          ]  [         z          ]  [ normal 3 + offset  ]  [         UV          ]
						0x00, 0x00, 0x80, 0xBF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xBF, 0x00, 0x7F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
						0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0xBF, 0x00, 0x7F, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF,
						0x00, 0x00, 0x80, 0xBF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x7F, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00,
						0x00, 0x00, 0x80, 0x3F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x3F, 0x00, 0x7F, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF
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
					binary: new Uint16Array([0, 1, 2, 3])
				})
			]
		}
	}
};

