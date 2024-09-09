
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
			data_view.setInt8(offset + 12, vert.normal[0] * 0x7F);
			data_view.setInt8(offset + 13, vert.normal[1] * 0x7F);
			data_view.setInt8(offset + 14, vert.normal[2] * 0x7F);
			data_view.setInt8(offset + 15, 0);
			data_view.setUint16(offset + 16, vert.uv[0] * 0xFFFF, true);
			data_view.setUint16(offset + 17, vert.uv[1] * 0xFFFF, true);
		}
		return buffer;
	}
}

class mesh {
	constructor(gl, name, pipeline, vertices, indices, draw_mode = null) {
		this._gl = gl;
		this._elements_count = indices.length;
		this._draw_mode = draw_mode != null ? draw_mode : gl.TRIANGLES;

		this.name = name;
		this.vbo = -1;

		this._init_buffers(gl, pipeline, vertices, indices);
	}

	draw(graphics) {
		const gl = graphics.gl;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
		gl.drawElements(this._draw_mode, this._elements_count, gl.UNSIGNED_SHORT, 0);
	}


// private:
	_init_buffers(gl, pipeline, vertices, indices) {
		this.vbo = gl.createBuffer();
		this.ebo = gl.createBuffer();
		if (this.vbo == null || this.ebo == null) {
			console.error(`[model][${this.name}] Cannot create mesh buffers!`);
			return;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

		pipeline.use();
		const position_location = pipeline.attribute_location("a_position");
		gl.vertexAttribPointer(position_location, 3, gl.FLOAT, false, VERTEX_SIZE, 0);
		gl.enableVertexAttribArray(position_location);

		const color_location = pipeline.attribute_location("a_normal");
		gl.vertexAttribPointer(color_location, 3, gl.BYTE, true, VERTEX_SIZE, 12)
		gl.enableVertexAttribArray(color_location);

		const uv_location = pipeline.attribute_location("a_uv");
		gl.vertexAttribPointer(uv_location, 2, gl.UNSIGNED_SHORT, true, VERTEX_SIZE, 16)
		gl.enableVertexAttribArray(uv_location);
	}
}

