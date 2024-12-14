
class cpu_particles extends model_object {
	constructor(name, count, mesh) {
		super(name, new model([mesh]));

		this.count = count;
		this.mesh = mesh;

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


};

