const VERTEX_SHADER_SOURCE = `
attribute vec3 a_position;
attribute vec4 a_color;

varying vec4 frag_color;

void main() {
	gl_Position = vec4(a_position, 1.0);
	frag_color = a_color;
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision mediump float;

varying vec4 frag_color;

void main() {
	gl_FragColor = frag_color;
}
`;

class game_instance {
	constructor(graphics) {
		this.scene_manager = new scene_manager()

		let shaders = {};
		shaders[graphics.gl.VERTEX_SHADER]   = VERTEX_SHADER_SOURCE;
		shaders[graphics.gl.FRAGMENT_SHADER] = FRAGMENT_SHADER_SOURCE;
		this.primitive_pipeline = new pipeline(graphics.gl, "primitive", shaders);

		const vertices = [
			new vertex([ 0.0,  0.5,  0.0], [255,   0,   0, 255]),
			new vertex([-0.5, -0.5,  0.0], [  0, 255,   0, 255]),
			new vertex([ 0.5, -0.5,  0.0], [  0,   0, 255, 255])
		]
		this.triangle = new mesh(graphics.gl, vertices, this.primitive_pipeline);
	}

	update(delta) {
		this.scene_manager.update(delta);
	}

	render(g) {
		this.primitive_pipeline.use();
		this.triangle.bind();
		this.triangle.draw();
		this.triangle.unbind();
	}
}