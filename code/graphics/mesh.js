
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
			data_view.setInt8(offset + 12, vert.normal[0] * 0x7f);
			data_view.setInt8(offset + 13, vert.normal[1] * 0x7f);
			data_view.setInt8(offset + 14, vert.normal[2] * 0x7f);
			data_view.setInt8(offset + 15, 0);
			data_view.setUint16(offset + 16, vert.uv[0] * 0xffff, true);
			data_view.setUint16(offset + 17, vert.uv[1] * 0xffff, true);
		}
		return buffer;
	}
}

class mesh {
	constructor(gl, name, pipeline, vertices, draw_mode = null) {
		this._initialize(gl, name, gl.ARRAY_BUFFER, vertices.length, draw_mode);
		this._init_buffer(gl, pipeline, vertex.pack(vertices));
	}

	// constructor(gl, name, pipeline, buffer_data, vertex_count, draw_mode = null) {
	// 	this._initialize(gl, name, gl.ARRAY_BUFFER, vertex_count, draw_mode);
	// 	this._init_buffer(pipeline, buffer_data);
	// }

	draw() {
		this._gl.drawArrays(this._draw_mode, 0, this._vertex_count);
	}

	bind() {
		this._gl.bindBuffer(this._type, this.vbo);
	}

	unbind() {
		this._gl.bindBuffer(this._type, null);
	}

// private:
	_initialize(gl, name, type, vertex_count, draw_mode) {
		this._gl = gl;
		this._type = type;
		this._vertex_count = vertex_count;
		this._draw_mode = draw_mode != null ? draw_mode : gl.TRIANGLES;

		this.name = name;
		this.vbo = -1;
	}

	_init_buffer(gl, pipeline, buffer_data) {
		this.vbo = gl.createBuffer();
		if (this.vbo == null) {
			console.error(`[model][${this.name}] Cannot create vertex buffer object!`);
			return;
		}

		this.bind();

		gl.bufferData(this._type, buffer_data, gl.STATIC_DRAW);

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

		this.unbind();
	}

}

