const ATTRIBUTE_NAMES = [
	"POSITION",
	"NORMAL",
	"TEXCOORD_0",
	// "TEXCOORD_1",
	"TANGENT",
	// "WEIGHTS_0",
	// "JOINTS_0",
];
Object.freeze(ATTRIBUTE_NAMES);

class primitive {
	constructor(id, info = { indices: 0, mode: gl.TRIANGLES }, material = null) {
		this.id = id;
		this.vao = gl.createVertexArray();
		this.indices = info.indices;
		this.vertex_count = 0;
		this.material = material;
		this.mode = info.mode || gl.TRIANGLES;
		this.buffers = [];
		this._draw_method = () => {
			gl.drawArrays(this.mode, 0, this.vertex_count);
		}
	}

	/** @param {graphics} g  */
	draw(g) {
		if (this.material) this.material.activate(g);

		this.bind();
		this._draw_method();
		this.unbind();

		if (this.material) this.material.deactivate(g);
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
		for (const view of views) {
			this.buffers.push(this._make_buffer(view, buffers));
		}

		var attribute_id = 0;
		for (const name of ATTRIBUTE_NAMES) {
			if (name in attributes) {
				const id = attributes[name];
				construct(id, attribute_id++);
				this.vertex_count = accessors[id].count; // Meh, but ok
			}
		}

		if (this.indices != null) {
			construct(this.indices, attribute_id);
			const accessor = accessors[this.indices];
			const indices_count = accessor.count;
			const type = accessor.componentType;
			const offset = accessor.byteOffset || 0;
			this._draw_method = () => {
				gl.drawElements(this.mode, indices_count, type, offset);
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
			accessor.byteOffset || 0
		);
		gl.enableVertexAttribArray(id);
	}

	_make_buffer(view, buffers) {
		const target = view.target || gl.ARRAY_BUFFER;
		const buffer = gl.createBuffer();
		gl.bindBuffer(target, buffer);
		gl.bufferData(target,
			new DataView(buffers[view.buffer]),
			gl.STATIC_DRAW,
			view.byteOffset, // No need to pass offset since we made it in DataView
			view.byteLength
		);
		return { target: target, handle: buffer };
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
