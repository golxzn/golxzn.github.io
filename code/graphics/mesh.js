class primitive {
	constructor(id, info = { indices: 0, mode: gl.TRIANGLES }, material = null) {
		this.id = id;
		this.indices = info.indices || null;
		this.indices_count = 0;
		this.material = material;
		this.mode = info.mode || gl.TRIANGLES;
		this.buffers = [];
	}

	/** @param {graphics} g  */
	draw(g) {
		const applied_textures = this.material ? this.material.apply(g) : 0;
		g.set_engine_uniforms();
		// @todo Check if indices are null
		gl.drawElements(this.mode, this.indices_count, gl.UNSIGNED_SHORT, 0);
		g.remove_textures(applied_textures);
		g.reset_engine_uniforms();
	}

	setup(attributes, accessors, views, buffers) {
		const make_buffer = (view) => {
			const buffer = gl.createBuffer();
			gl.bindBuffer(view.target, buffer);
			gl.bufferData(view.target,
				new DataView(buffers[view.buffer]),
				gl.STATIC_DRAW,
				view.byteOffset,
				view.byteLength
			);
			return buffer;
		}

		const construct = (id) => {
			const accessor = accessors[id];
			const view = views[accessor.bufferView];
			this.buffers.push(make_buffer(view));
			this.setup_attribute(id, view, accessor);
		}

		for (const [_name, id] of Object.entries(attributes)) {
			construct(id);
		}

		if (this.indices != null) {
			construct(this.indices);
			this.indices_count = accessors[this.indices].count;
		}
	}

	setup_attribute(id, view, accessor) {
		gl.vertexAttribPointer(id,
			view.byteLength / accessor.count / primitive.type_size(accessor.componentType),
			accessor.componentType,
			accessor.normalized || false,
			0, // view.byteStride || 0,
			0, // view.byteOffset || accessor.byteOffset || 0
			/// The reason the stride and offset are 0 is that we made a buffer for each view
		);
		gl.enableVertexAttribArray(id);
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
		this.vao = gl.createVertexArray();
		this.name = info.name;
		this.primitives = info.primitives;
	}

	/** @param {graphics} g  */
	draw(g) {
		this.bind();
		this.primitives.forEach((prim) => prim.draw(g));
		this.unbind();
	}

	bind() { gl.bindVertexArray(this.vao); }
	unbind() { gl.bindVertexArray(null); }
};
