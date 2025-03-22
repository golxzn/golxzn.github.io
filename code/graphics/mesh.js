class primitive {
	constructor(id, info = { indices: 0, mode: gl.TRIANGLES }, material = null) {
		this.id = id;
		this.handle = gl.createBuffer();
		this.indices = info.indices || null;
		this.material = material;
		this.mode = info.mode || gl.TRIANGLES;
	}

	/**
	 * @param {ArrayBufferView} data buffer data
	 * @param {int} [usage=gl.STATIC_DRAW] Usage of provided data
	 **/
	set_buffer_data(data, usage = gl.STATIC_DRAW) {
		if (!data) return;

		gl.bindBuffer(gl.ARRAY_BUFFER, this.handle);
		gl.bufferData(gl.ARRAY_BUFFER, data, usage);
	}

	setup_attribute(id, view, accessor) {
		gl.vertexAttribPointer(id,
			view.byteLength,
			accessor.componentType,
			accessor.normalized || false,
			view.byteStride || 0,
			view.byteOffset || accessor.byteOffset || 0
		);
		gl.enableVertexAttribArray(id);
	}

	setup_attributes(attributes, accessors, views) {
		for (const [_name, id] of Object.entries(attributes)) {
			const accessor = accessors[id];
			this.setup_attribute(id, views[accessor.bufferView], accessor);
		}

		if (this.indices == null) return;

		const accessor = accessors[this.indices];
		const view = views[accessor.bufferView];
		this.setup_attribute(this.indices, view, accessor);
	}

	/** @param {graphics} g  */
	draw(g) {
		const applied_textures = this.material ? this.material.apply(g) : 0;
		gl.drawElements(this.mode, this.indices_count, gl.UNSIGNED_SHORT, 0);
		g.remove_textures(applied_textures);
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
