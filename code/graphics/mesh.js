
const draw_method_type = {
	array             : "array",
	elements          : "elements",
	instanced_array   : "instanced_array",
	instanced_elements: "instanced_elements",
};

class attribute_layout {
	constructor(data = { count: 0, type: gl.FLOAT, normalized: false, divisor: null }) {
		this.type = data.type;
		this.count = data.count;
		this.normalized = data.normalized != null ? data.normalized : false;
		this.divisor = data.divisor;
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
	constructor(textures, material, details = { pipeline: null, buffer_infos: [], draw_method: null, settings: null }) {
		this.vao = gl.createVertexArray();
		this.buffers = {};
		this.draw_method = details.draw_method;
		this.pipeline_name = details.pipeline;

		this.textures = textures;
		this.material = material;

		this.draw = (graphics) => { this._draw(graphics); }
		if (details.settings != null) {
			this.enable_settings = details.settings.enable == null ? [] : details.settings.enable;
			this.disable_settings = details.settings.disable == null ? [] : details.settings.disable;
			if (this.enable_settings.length + this.disable_settings.length > 0) {
				this.draw = (graphics) => { this._draw_with_settings(graphics); }
			}
		}

		this._construct_buffers(details.buffer_infos);
	}

	_draw(graphics) {
		this.draw_method.draw(graphics, this);
	}

	_draw_with_settings(graphics) {
		var previous_disabled = []
		for (var i = 0; i < this.enable_settings.length; ++i) {
			const param = this.enable_settings[i];
			if (!gl.isEnabled(param)) previous_disabled.push(param);
			gl.enable(param);
		}
		var previous_enabled = []
		for (var i = 0; i < this.disable_settings.length; ++i) {
			const param = this.disable_settings[i];
			if (gl.isEnabled(param)) previous_enabled.push(param);
			gl.disable(param);
		}

		this.draw_method.draw(graphics, this);

		previous_disabled.forEach(value => gl.disable(value));
		previous_enabled.forEach(value => gl.enable(value));
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

		var last_attribute_id = 0;
		for (const info of buffer_infos) {
			const buffer = gl.createBuffer();
			gl.bindBuffer(info.target, buffer);
			if (info.binary == null || info.binary.length == 0) {
				gl.bufferData(info.target, info.count * info.stride, info.usage);
			} else {
				gl.bufferData(info.target, info.binary, info.usage);
			}

			var offset = 0;
			for (var i = 0; i < info.layout.length; ++i, ++last_attribute_id) {
				const attribute = info.layout[i];
				gl.vertexAttribPointer(last_attribute_id,
					attribute.count,
					attribute.type,
					attribute.normalized,
					info.stride,
					offset
				);
				gl.enableVertexAttribArray(last_attribute_id);
				if (attribute.divisor != null) {
					gl.vertexAttribDivisor(last_attribute_id, attribute.divisor);
				}

				offset += attribute.bytes_count();
			}

			this.buffers[info.name] = {
				handle: buffer,
				info: info
			};
		}
		gl.bindVertexArray(null);
	}

};
