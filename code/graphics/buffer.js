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

class buffer_view {
	constructor(data = { offset: 0, length: 0 }) {
		this.offset = data.offset;
		this.length = data.length;
	}
};

class buffer_info {
	constructor(data = { name: "", target: null, usage: null, layout: [], views: [], binary: null, count: null }) {
		this.name = data.name;
		this.target = data.target != null ? data.target : gl.ARRAY_BUFFER;
		this.usage = data.usage != null ? data.usage : gl.STATIC_DRAW;
		this.layout = data.layout != null ? data.layout : [];
		this.binary = data.binary;
		this.views = data.views != null ? data.views : [];
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


class buffer {
	constructor(info, obj = null) {
		this.info = info;
		if (info.views.length == 0) {
			this.handle = this._construct_buffer(this.info, obj);
		} else {
			this.handle = this._construct_buffer_with_views(this.info, obj);
		}
	}

	sub_data(data, offset = 0) {
		gl.bindBuffer(this.info.target, this.handle);
		gl.bufferSubData(this.info.target, offset, data);
	}

	_construct_buffer(info, obj) {
		const buffer = this._make_buffer_with_data(info);

		var attribute_id = obj != null ? obj.last_attribute_id : 0;
		for (var i = 0, offset = 0; i < info.layout.length; ++i, ++attribute_id) {
			offset += this._setup_attribute(attribute_id, info.layout[i], info.stride, offset);
		}

		if (obj != null) obj.last_attribute_id = attribute_id;

		return buffer;
	}

	_construct_buffer_with_views(info, obj) {
		const buffer = this._make_buffer_with_data(info);

		var attribute_id = obj != null ? obj.last_attribute_id : 0;
		for (var i = 0; i < info.layout.length; ++i, ++attribute_id) {
			const view = info.views[i];
			const attribute = info.layout[i];
			this._setup_attribute(attribute_id, attribute, attribute.bytes_count(), view.offset);
		}

		if (obj != null) obj.last_attribute_id = attribute_id;

		return buffer;
	}

	_make_buffer_with_data(info) {
		const buffer = gl.createBuffer();
		gl.bindBuffer(info.target, buffer);
		if (info.binary == null || info.binary.length == 0) {
			gl.bufferData(info.target, info.count * info.stride, info.usage);
		} else {
			gl.bufferData(info.target, info.binary, info.usage);
		}
		return buffer;
	}

	_setup_attribute(id, attribute, stride, offset) {
		gl.vertexAttribPointer(id,
			attribute.count,
			attribute.type,
			attribute.normalized,
			stride,
			offset
		);
		gl.enableVertexAttribArray(id);
		if (attribute.divisor != null) {
			gl.vertexAttribDivisor(id, attribute.divisor);
		}

		return attribute.bytes_count();
	}
};


const render_object_type = {
	vertex_array      : "vertex_array",
	transform_feedback: "transform_feedback"
};


class render_object {
	constructor(info = { type: render_object_type.vertex_array }) {
		this.info = info;
		this.id = render_object._make_object(info.type);
		this.last_attribute_id = 0;
		this.buffers = {};
		this._bind_impl = render_object._get_bind_method_for(info.type);
	}

	bind()   { this._bind_impl(this.id); }
	unbind() { this._bind_impl(null);    }

	setup(buffer_infos) {
		this.bind();
		buffer_infos.forEach((info) => this.emplace_buffer(info));
		this.unbind();
	}

	emplace_buffer(info) {
		this.buffers[info.name] = new buffer(info, this);
	}

	get_buffer(name) {
		return Object.hasOwn(this.buffers, name) ? this.buffers[name] : null;
	}

	static _make_object(type) {
		switch (type) {
			case render_object_type.vertex_array:
				return gl.createVertexArray();

			/// @todo It doesn't work like that...
			case render_object_type.transform_feedback:
				return gl.createTransformFeedback()

			default: break;
		}
		return null;
	}

	static _get_bind_method_for(type) {
		switch (type) {
			case render_object_type.vertex_array:
				return (id) => gl.bindVertexArray(id);

			case render_object_type.transform_feedback:
				return (id) => gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, id);

			default: break;
		}
		return null;
	}
};
