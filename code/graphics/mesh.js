
class primitive_info {

	/* Layout is an array of the attribute parameters:
	 * [
	 * 	{ count: 3, bytes_length: 3 * 4, type: gl.FLOAT, normalized: false, }
	 * ]
	 */
	constructor(pipeline_name, layout, vertices, indices, draw_mode = null) {
		this.pipeline_name = pipeline_name;
		this.layout = layout;
		this.vertices = vertices;
		this.indices = indices;
		this.draw_mode = draw_mode;
	}
};


class mesh {
	constructor(textures, material, info) {
		this.vao = null;
		this.vbo = null;
		this.ebo = null;
		this.elements_count = info.indices.length;
		this.draw_mode = info.draw_mode != null ? info.draw_mode : gl.TRIANGLES;

		this.pipeline_name = info.pipeline_name;
		this.textures = textures;
		this.material = material;

		this._init_buffers(info);
	}

// private:
	_init_buffers(info) {
		this.vao = gl.createVertexArray();
		gl.bindVertexArray(this.vao);

		this.vbo = gl.createBuffer();
		this.ebo = gl.createBuffer();
		if (this.vbo == null || this.ebo == null) {
			console.error(`[model] Cannot create mesh buffers!`);
			return;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, info.vertices, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, info.indices, gl.STATIC_DRAW);

		var vertex_size = 0;
		var attribute_sizes = new Array(info.layout.length);
		for (var i = 0; i < info.layout.length; i++) {
			const attribute = info.layout[i];
			attribute_sizes[i] = mesh.get_bytes_size(attribute.type) * attribute.count;
			vertex_size += attribute_sizes[i];
		}

		var offset = 0;
		for (var i = 0; i < info.layout.length; i++) {
			const attribute = info.layout[i];
			gl.vertexAttribPointer(i,
				attribute.count,
				attribute.type,
				attribute.normalized,
				vertex_size,
				offset
			);
			gl.enableVertexAttribArray(i);
			offset += attribute_sizes[i];
		}
	}

	static get_bytes_size(type) {
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
}
