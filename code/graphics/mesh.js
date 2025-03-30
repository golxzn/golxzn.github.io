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

	setup(attributes, accessors, views, buffers) {
		/// I assumed that there should'n be primitives which uses different buffers



		const make_buffer = (view) => {
			const target = view.target || gl.ARRAY_BUFFER;
			const buffer = gl.createBuffer();
			gl.bindBuffer(target, buffer);
			gl.bufferData(target,
				new DataView(buffers[view.buffer], view.byteOffset, view.byteLength),
				gl.STATIC_DRAW,
				0, // No need to pass offset since we made it in DataView
				view.byteLength
			);
			return buffer;
		}

		const construct = (id, attribute_id) => {
			const accessor = accessors[id];
			const view = views[accessor.bufferView];
			this.buffers.push(make_buffer(view));
			this.setup_attribute(attribute_id, view, accessor);
		}

		this.bind();
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
			this._draw_method = () => {
				gl.drawElements(this.mode, indices_count, type, 0);
			}
		}
		this.unbind();
	}

	setup_attribute(id, view, accessor) {
		gl.vertexAttribPointer(id,
			primitive.determine_count(accessor.type),
			accessor.componentType,
			accessor.normalized || false,
			0, // view.byteStride || 0,
			0, // view.byteOffset || accessor.byteOffset || 0
			/// The reason the stride and offset are 0 is that we made a buffer for each view
		);
		gl.enableVertexAttribArray(id);
	}

	bind() { gl.bindVertexArray(this.vao); }
	unbind() { gl.bindVertexArray(null); }

	static determine_count(type) {
		const c = type.charCodeAt(type.length - 1);
		if (c >= 0x30 && c <= 0x39) {
			const count = c - 0x30;
			if (type.charAt(0) == 'M') {
				return count * count;
			}
			return count;
		}
		return 1; // SCALAR OR WHATEVER
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
