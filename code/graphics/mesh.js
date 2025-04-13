const ATTRIBUTE_NAMES = {
	POSITION  : "POSITION",
	NORMAL    : "NORMAL",
	TEXCOORD_0: "TEXCOORD_0",
	TEXCOORD_1: "TEXCOORD_1",
	TANGENT   : "TANGENT",
	WEIGHTS_0 : "WEIGHTS_0",
	JOINTS_0  : "JOINTS_0",
};
Object.freeze(ATTRIBUTE_NAMES);

class primitive {
	constructor(id, info = { indices: null, mode: gl.TRIANGLES }, material = null) {
		this.id = id;
		this.vao = gl.createVertexArray();
		this.indices = info.indices;
		this.vertex_count = 0;
		this.material = material;
		this.mode = info.mode || gl.TRIANGLES;
		this.buffers = [];
		this.pipeline_id = "PBR_GEOMETRY";
		this._draw_method = (self) => {
			gl.drawArrays(self.mode, 0, self.vertex_count);
		}
	}

	/** @param {graphics} g  */
	draw(g) {
		g.push_pipeline(get_service("pipeline").get_pipeline(this.pipeline_id));
		g.set_engine_uniforms();
		g.set_engine_lighting_uniforms();
		if (this.material) this.material.activate(g);

		this.bind();
		this._draw_method(this);
		this.unbind();

		if (this.material) this.material.deactivate(g);
		g.reset_engine_lighting_uniforms();
		g.reset_engine_uniforms();
		g.pop_pipeline();
	}

	bind() { gl.bindVertexArray(this.vao); }
	unbind() { gl.bindVertexArray(null); }

	setup(attributes, accessors, views, buffers) {
		const construct = (id, attribute_id) => {
			const accessor = accessors[id];
			const buffer = this.buffers.at(accessor.bufferView);
			gl.bindBuffer(buffer.target, buffer.handle);
			this.setup_attribute(attribute_id, views[accessor.bufferView], accessor);
		}

		this.bind();

		const views_set = new Map();
		for (const id of Object.values(attributes)) {
			const accessor = accessors[id];
			views_set.set(accessor.bufferView, primitive.determine_target(accessor));
		}

		if (this.indices !== null) {
			const accessor = accessors[this.indices];
			views_set.set(accessor.bufferView, primitive.determine_target(accessor));
		}

		this.buffers = [];
		for (const [id, target] of views_set.entries()) {
			const view = views[id];
			const buffer = this._make_buffer(view, buffers, target);
			this.buffers[id] = buffer; // Index by bufferView's original index
		}
		// for (const accessor of accessors) {
		// 	const view = views[accessor.bufferView];
		// 	this.buffers.push(this._make_buffer(view, buffers,
		// 		primitive.determine_target(accessor)
		// 	));
		// }

		var bound_attributes = 0;
		for (const id of Object.values(attributes)) {
			construct(id, bound_attributes++);
		}
		this.vertex_count = accessors[attributes[ATTRIBUTE_NAMES.POSITION]].count;

		if (primitive.tangents_required(attributes)) {
			bound_attributes += +this._calc_tangents(
				bound_attributes, attributes, accessors, views, buffers
			);
		}

		if (this.indices != null) {
			const accessor = accessors[this.indices];
			const {target, handle} = this.buffers.at(accessor.bufferView);
			gl.bindBuffer(target, handle);

			const indices_count = accessor.count;
			const type = accessor.componentType;
			const offset = accessor.byteOffset || 0;
			this._draw_method = (self) => {
				gl.drawElements(self.mode, indices_count, type, offset);
			}
		}
		this.unbind();
	}

	setup_attribute(id, view, accessor) {
		gl.vertexAttribPointer(id,
			primitive.determine_count(accessor.type),
			accessor.componentType,
			accessor.normalized || false,
			view.byteStride     || 0,// primitive.determine_stride(accessor),
			accessor.byteOffset || 0
		);
		gl.enableVertexAttribArray(id);
	}

	_make_buffer(view, buffers, default_target) {
		const target = view.target || default_target;
		const buffer = gl.createBuffer();
		const data = new DataView(buffers[view.buffer], view.byteOffset, view.byteLength);
		gl.bindBuffer(target, buffer);
		gl.bufferData(target, data, gl.STATIC_DRAW);
		return { target: target, handle: buffer };
	}

	_make_buffer_from_data(target, data) {
		const buffer = gl.createBuffer();
		gl.bindBuffer(target, buffer);
		gl.bufferData(target, data, gl.STATIC_DRAW);
		return { target: target, handle: buffer };
	}

	/// @todo mikktspace algorithm instead of this mess
	_calc_tangents(attribute_id, attributes, accessors, views, buffers) {
		const pos_accessor  = accessors[attributes[ATTRIBUTE_NAMES.POSITION  ]];
		const norm_accessor = accessors[attributes[ATTRIBUTE_NAMES.NORMAL    ]];
		const uv_accessor   = accessors[attributes[ATTRIBUTE_NAMES.TEXCOORD_0]];
		const vertex_count = pos_accessor.count;
		if (vertex_count != uv_accessor.count || vertex_count != norm_accessor.count) {
			console.warn(
				"[primitive] Cannot calculate tangents. The count of position and uv are not",
				"equal:", vertex_count, "!=", uv_accessor.count
			);
			return false;
		}
		const m = golxzn.math;

		const select_buffer = (accessor, view) => {
			const offset  = accessor.byteOffset || 0.0;
			return new DataView(buffers[view.buffer],
				view.byteOffset + offset,
				// view.byteLength - offset // could be counted accessor.count * type_size(accessor...)
				accessor.count * primitive.determine_stride(accessor)
			);
		};

		const pos_view = views[pos_accessor.bufferView];
		const uv_view = views[uv_accessor.bufferView];

		const pos_stride = pos_view.byteStride || primitive.determine_stride(pos_accessor);
		const uv_stride  = uv_view.byteStride || primitive.determine_stride(uv_accessor);

		const pos_buffer = select_buffer(pos_accessor, pos_view);
		const uv_buffer = select_buffer(uv_accessor, uv_view)

		var indices = null;
		if (this.indices != null) {
			const indices_accessor = accessors[this.indices];
			const indices_view = views[indices_accessor.bufferView];
			const bytes = primitive.type_size(indices_accessor.componentType);
			const indices_stride = indices_view.byteStride || bytes;
			const indices_buffer = select_buffer(indices_accessor, indices_view);
			var get_index = null;
			switch (bytes) {
				case 1: get_index = (_, i) => indices_buffer.getUint8(i); break;
				case 4: get_index = (_, i) => indices_buffer.getUint32(i * indices_stride, true); break;
				case 2: // [[fallthrough]];
				default:
					get_index = (_, i) => indices_buffer.getUint16(i * indices_stride, true);
					break;
			}

			indices = Array.from({ length: indices_accessor.count }, get_index);
		} else {
			indices = Array.from({ length: vertex_count }, (_, k) => k);
		}

		const get_vec3 = (buffer_view, offset) => {
			return [
				buffer_view.getFloat32(offset + 0, true),
				buffer_view.getFloat32(offset + 4, true),
				buffer_view.getFloat32(offset + 8, true)
			]
		};
		const get_vec2 = (buffer_view, offset) => {
			return [
				buffer_view.getFloat32(offset + 0, true),
				buffer_view.getFloat32(offset + 4, true)
			]
		};

		const tangents = Array.from({length: vertex_count}, () => [0.0, 0.0, 0.0]);
		const bitangents = Array.from({length: vertex_count}, () => [0.0, 0.0, 0.0]);;
		for (var i = 0; i < indices.length; i += 3) {
			const vert0_id = indices[i + 0];
			const vert1_id = indices[i + 1];
			const vert2_id = indices[i + 2];

			const pos0 = get_vec3(pos_buffer, vert0_id * pos_stride);
			const edge0 = m.sub(get_vec3(pos_buffer, vert1_id * pos_stride), pos0);
			const edge1 = m.sub(get_vec3(pos_buffer, vert2_id * pos_stride), pos0);

			const uv0  = get_vec2(uv_buffer, vert0_id * uv_stride);
			const delta_uv1 = m.sub(get_vec2(uv_buffer, vert1_id * uv_stride), uv0);
			const delta_uv2 = m.sub(get_vec2(uv_buffer, vert2_id * uv_stride), uv0);

			// Zero division. Will we give a fuck? I'm not sure
			const r = 1.0 / (delta_uv1[0] * delta_uv2[1] - delta_uv1[1] * delta_uv2[0]);

			const tangent = m.scale(m.sub(
				m.scale(edge0, delta_uv2[1]),
				m.scale(edge1, delta_uv1[1])
			), r);

			const bitangent = m.scale(m.sub(
				m.scale(edge0, delta_uv2[0]),
				m.scale(edge1, delta_uv1[0])
			), r);

			tangents[vert0_id] = m.sum(tangents[vert0_id], tangent);
			tangents[vert1_id] = m.sum(tangents[vert1_id], tangent);
			tangents[vert2_id] = m.sum(tangents[vert2_id], tangent);

			bitangents[vert0_id] = m.sum(bitangents[vert0_id], bitangent);
			bitangents[vert1_id] = m.sum(bitangents[vert1_id], bitangent);
			bitangents[vert2_id] = m.sum(bitangents[vert2_id], bitangent);
		}

		const norm_view = views[norm_accessor.bufferView];
		const norm_stride = norm_view.byteStride || primitive.determine_stride(norm_accessor);
		const norm_buffer = select_buffer(norm_accessor, norm_view);

		const vec4_elements_count = 4;
		const tangents_buffer = new Float32Array(vertex_count * vec4_elements_count);
		for (var i = 0; i < vertex_count; ++i) {
			const normal = get_vec3(norm_buffer, i * norm_stride);
			const tangent = tangents[i];
			const bitangent = bitangents[i];

			// Ortho-Normalize
			const t = m.normalize(m.sub(tangent, m.scale(normal, m.dot(normal, tangent)))); // xyz
			t.push(m.dot(m.vec3.cross(normal, tangent), bitangent) < 0.0 ?  -1.0 : 1.0);    // w
			tangents_buffer.set(t, i * vec4_elements_count);
		}


		this.buffers.push(this._make_buffer_from_data(gl.ARRAY_BUFFER, tangents_buffer));
		gl.vertexAttribPointer(attribute_id, vec4_elements_count, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(attribute_id);

		return true;
	}

	static tangents_required(attributes) {
		return !(ATTRIBUTE_NAMES.TANGENT in attributes)
			&& ATTRIBUTE_NAMES.TEXCOORD_0 in attributes;
	}

	static determine_stride(accessor) {
		return primitive.type_size(accessor.componentType) * primitive.determine_count(accessor.type)
	}

	static determine_target(accessor) {
		return accessor.type == "SCALAR" ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
	}

	static determine_count(type) {
		const char = type.charCodeAt(type.length - 1);
		if (char < 0x30 || char > 0x39) return 1;

		const count = char - 0x30;
		return type.charAt(0) == 'M' ? count * count : count;
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

class mesh {
	constructor(info = { name: "", primitives: [] }) {
		this.name = info.name;
		this.primitives = info.primitives;
	}

	/** @param {graphics} g  */
	draw(g) {
		this.primitives.forEach((prim) => prim.draw(g));
	}
};
