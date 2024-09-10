
const VERTEX_SIZE = 20;

/*
TODO: Remove vertex class and pack the meshes just in array buffers
const response = await fetch("assets/geometry.bin");
const buffer = await response.arrayBuffer();
*/
class vertex {
	constructor(position = [0.0, 0.0, 0.0], normal = [0, 0, 0], uv = [0, 0]) {
		this.position = position;
		this.normal = normal;
		this.uv = uv;
	}

	static pack(vertices) {
		const buffer = new ArrayBuffer(VERTEX_SIZE * vertices.length);

		const data_view = new DataView(buffer);
		for (var i = 0; i < vertices.length; i++) {
			const offset = VERTEX_SIZE * i;
			const vert = vertices[i];

			data_view.setFloat32(offset + 0, vert.position[0], true);
			data_view.setFloat32(offset + 4, vert.position[1], true);
			data_view.setFloat32(offset + 8, vert.position[2], true);
			data_view.setInt8(offset + 12, vert.normal[0]);
			data_view.setInt8(offset + 13, vert.normal[1]);
			data_view.setInt8(offset + 14, vert.normal[2]);
			data_view.setInt8(offset + 15, 0);
			data_view.setUint16(offset + 16, vert.uv[0] * 0xFFFF, true);
			data_view.setUint16(offset + 18, vert.uv[1] * 0xFFFF, true);
		}
		return buffer;
	}
}

class primitive_info {
	constructor(vertices, indices, draw_mode = null) {
		this.vertices = vertices;
		this.indices = indices;
		this.draw_mode = draw_mode;
	}
};


class mesh {
	constructor(gl, name, pipeline, info) {
		this._gl = gl;
		this.name = name;
		this.vao = null;
		this.vbo = null;
		this.ebo = null;
		this.elements_count = info.indices.length;
		this.draw_mode = info.draw_mode != null ? info.draw_mode : gl.TRIANGLES;

		this._init_buffers(gl, pipeline, info);
	}

// private:
	_init_buffers(gl, pipeline, info) {
		this.vao = gl.createVertexArray();
		gl.bindVertexArray(this.vao);

		this.vbo = gl.createBuffer();
		this.ebo = gl.createBuffer();
		if (this.vbo == null || this.ebo == null) {
			console.error(`[model][${this.name}] Cannot create mesh buffers!`);
			return;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, info.vertices, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, info.indices, gl.STATIC_DRAW);

		pipeline.use();
		const position_location = pipeline.attribute_location("a_position");
		gl.vertexAttribPointer(position_location, 3, gl.FLOAT, false, VERTEX_SIZE, 0);
		gl.enableVertexAttribArray(position_location);

		const normal_location = pipeline.attribute_location("a_normal");
		gl.vertexAttribPointer(normal_location, 3, gl.BYTE, true, VERTEX_SIZE, 12)
		gl.enableVertexAttribArray(normal_location);

		const uv_location = pipeline.attribute_location("a_uv");
		gl.vertexAttribPointer(uv_location, 2, gl.UNSIGNED_SHORT, true, VERTEX_SIZE, 16)
		gl.enableVertexAttribArray(uv_location);
	}
}

