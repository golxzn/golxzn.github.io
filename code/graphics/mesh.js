
const VERTEX_SIZE = 16;

/*
TODO: Remove vertex class and pack the meshes just in array buffers
const response = await fetch("assets/geometry.bin");
const buffer = await response.arrayBuffer();
*/
class vertex {
	constructor(position = [0.0, 0.0, 0.0], color = [255, 255, 255, 255]) {
		this.position = position;
		this.color = color;
	}

	static pack(vertices) {
		const buffer = new ArrayBuffer(VERTEX_SIZE * vertices.length);
		// Fill array buffer
		const data_view = new DataView(buffer);

		for (var i = 0; i < vertices.length; i++) {
			const offset = VERTEX_SIZE * i;
			const vert = vertices[i];

			data_view.setFloat32(offset + 0, vert.position[0], true);
			data_view.setFloat32(offset + 4, vert.position[1], true);
			data_view.setFloat32(offset + 8, vert.position[2], true);
			data_view.setUint8(offset + 12, vert.color[0]);
			data_view.setUint8(offset + 13, vert.color[1]);
			data_view.setUint8(offset + 14, vert.color[2]);
			data_view.setUint8(offset + 15, vert.color[3]);
			// data_view.setUint16(offset + 16, vert.texCoord[0] * 0xffff, true);
			// data_view.setUint16(offset + 18, vert.texCoord[1] * 0xffff, true);
		}
		return buffer;
	}
}

class mesh {
	constructor(gl, vertices, pipeline) {
		this._gl = gl;
		this._type = gl.ARRAY_BUFFER;
		this._vertex_count = vertices.length;
		this.vbo = gl.createBuffer();

		this.bind();
		gl.bufferData(this._type, vertex.pack(vertices), gl.STATIC_DRAW);

		pipeline.use();
		const position_location = pipeline.attribute_location("a_position");
		gl.vertexAttribPointer(position_location, 3, gl.FLOAT, false, VERTEX_SIZE, 0);
		gl.enableVertexAttribArray(position_location);

		const color_location = pipeline.attribute_location("a_color");
		gl.vertexAttribPointer(color_location, 4, gl.UNSIGNED_BYTE, true, VERTEX_SIZE, 12)
		gl.enableVertexAttribArray(color_location);

		this.unbind();
	}

	draw() {
		this._gl.drawArrays(this._gl.TRIANGLES, 0, this._vertex_count);
	}

	bind() {
		this._gl.bindBuffer(this._type, this.vbo);
	}

	unbind() {
		this._gl.bindBuffer(this._type, null);
	}
}

