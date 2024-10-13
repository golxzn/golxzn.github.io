
const draw_method_type = {
	array             : "array",
	elements          : "elements",
	instanced_array   : "instanced_array",
	instanced_elements: "instanced_elements",
};

class attribute_layout {
	constructor(data = { count: 0, type: gl.FLOAT, normalized: false }) {
		this.type = data.type;
		this.count = data.count;
		this.normalized = data.normalized != null ? data.normalized : false;
	}

	bytes_count() {
		return this.count * attribute_layout.type_size(this.type);
	}

	static type_size(type) {
		switch (type) {
			case gl.BYTE:
			case gl.UNSIGNED_BYTE:
				return 1;

			case gl.SHORT:
			case gl.UNSIGNED_SHORT:
			case gl.HALF_FLOAT:
				return 2;

			case gl.FLOAT:
			case gl.INT:
			case gl.UNSIGNED_INT:
			case gl.INT_2_10_10_10_REV:
			case gl.UNSIGNED_INT_2_10_10_10_REV:
				return 4;
		}
		return 0;
	}
};

class buffer_info {
	constructor(data = { name: "", target: null, usage: null, layout: [], binary: null, count: null }) {
		this.name = data.name;
		this.target = data.target != null ? data.target : gl.ARRAY_BUFFER;
		this.usage = data.usage != null ? data.usage : gl.STATIC_DRAW;
		this.layout = data.layout != null ? data.layout : [];
		this.binary = data.binary;
		this.stride = 0;

		for (const info of this.layout) {
			this.stride += info.bytes_count();
		}

		if (data.count == null && data.binary == null) {
			throw new Error("The elements count and binary data cannot both be null.")
		}

		this.count = data.count == null ? this.binary.length : data.count;
		if (this.stride > 0 && data.count == null) {
			this.count /= this.stride;
		}
	}
};

class draw_method {
	constructor(data = {
		type: draw_method_type.array,
		mode: gl.TRIANGLES,
		target_buffer: null,
		instances_count: null,
	}) {
		this.mode = data.mode != null ? data.mode : gl.TRIANGLES;
		this.draw_method = draw_method.select(data.type);
		this.target_buffer = data.target_buffer;
		this.instances_count = data.instances_count;
	}

	draw(graphics, mesh_instance) {
		this.draw_method(graphics, this, mesh_instance);
	}

	static select(type) {
		switch (type) {
			case draw_method_type.array:
				return (graphics, self, mesh) => { graphics.draw_array(self, mesh); };
			case draw_method_type.elements:
				return (graphics, self, mesh) => { graphics.draw_elements(self, mesh); };
			case draw_method_type.instanced_array:
				return (graphics, self, mesh) => { graphics.draw_instanced_array(self, mesh); };
			case draw_method_type.instanced_elements:
				return (graphics, self, mesh) => { graphics.draw_instanced_elements(self, mesh); };
		}
		return null;
	}
};

class mesh {
	constructor(textures, material, details = { pipeline: null, buffer_infos: [], draw_method: null }) {
		this.vao = gl.createVertexArray();
		this.buffers = {};
		this.draw_method = details.draw_method;
		this.pipeline_name = details.pipeline;

		this.textures = textures;
		this.material = material;

		this._construct_buffers(details.buffer_infos);
	}

	draw(graphics) {
		this.draw_method.draw(graphics, this);
	}

	update_buffer_data(name, data, offset = 0) {
		if (!Object.hasOwn(this.buffers, name)) return;
		const buffer = this.buffers[name];

		gl.bindVertexArray(this.vao);
		gl.bindBuffer(buffer.info.target, buffer.handle);
		gl.bufferSubData(buffer.info.target, offset, data);
		gl.bindVertexArray(null);
	}

	_construct_buffers(buffer_infos) {
		gl.bindVertexArray(this.vao);


		const stride = this._accumulate_stride(buffer_infos);
		var offset = 0;
		var last_attribute_id = 0;
		for (const info of buffer_infos) {
			const buffer = gl.createBuffer();
			gl.bindBuffer(info.target, buffer);
			if (info.binary == null || info.binary.length == 0) {
				gl.bufferData(info.target, info.count * info.stride, info.usage);
			} else {
				gl.bufferData(info.target, info.binary, info.usage);
			}

			var attribute_sizes = new Array(info.layout.length);
			for (var i = 0; i < info.layout.length; i++) {
				const attribute = info.layout[i];
				attribute_sizes[i] = attribute.bytes_count()
			}

			for (var i = 0; i < info.layout.length; ++i, ++last_attribute_id) {
				const attribute = info.layout[i];
				gl.vertexAttribPointer(last_attribute_id,
					attribute.count,
					attribute.type,
					attribute.normalized,
					stride,
					offset
				);
				gl.enableVertexAttribArray(last_attribute_id);
				offset += attribute_sizes[i];
			}

			this.buffers[info.name] = {
				handle: buffer,
				info: info
			};
		}
		gl.bindVertexArray(null);
	}

	_accumulate_stride(buffer_infos) {
		var stride = 0;
		for (const info of buffer_infos) {
			stride += info.stride;
		}
		return stride;
	}
};
