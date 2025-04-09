// const ATTRIBUTE_NAMES = [
// 	"POSITION",
// 	"NORMAL",
// 	"TEXCOORD_0",
// 	"TEXCOORD_1",
// 	"TANGENT",
// 	// "WEIGHTS_0",
// 	// "JOINTS_0",
// ];
// Object.freeze(ATTRIBUTE_NAMES);

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
		/// I assumed that there should'n be primitives which uses different buffers

		const construct = (id, attribute_id) => {
			const accessor = accessors[id];
			const buffer = this.buffers.at(accessor.bufferView);
			gl.bindBuffer(buffer.target, buffer.handle);
			this.setup_attribute(attribute_id, views[accessor.bufferView], accessor);
		}

		this.bind();
		for (const accessor of accessors) {
			const view = views[accessor.bufferView];
			this.buffers.push(this._make_buffer(view, buffers,
				primitive.determine_target(view, accessor)
			));
		}

		/// @todo Pipeline generation using primitive info
		const pipeline = get_service("pipeline").get_pipeline(this.pipeline_id);
		var bound_attributes = 0;
		for (const [name, id] of Object.entries(attributes)) {
			const attribute_id = pipeline.attribute_location(name);
			if (attribute_id != -1) {
				construct(id, attribute_id);
				++bound_attributes;
				continue;
			}
			console.warn("Cannot find", name, "attribute location!");
		}
		this.vertex_count = accessors[Object.values(attributes)[0]].count; // Ouch, fuck

		if (this.indices != null) {
			construct(this.indices, bound_attributes + 1);
			const accessor = accessors[this.indices];
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
			view.byteStride || 0,
			/*accessor.byteOffset || */ 0 // we're using a buffer for each attribute
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

	static determine_target(view, accessor) {
		if (accessor.type == "SCALAR") return gl.ELEMENT_ARRAY_BUFFER;
		return gl.ARRAY_BUFFER;
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
