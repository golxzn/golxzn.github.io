
class rotating_cube {
	// TODO: It's better to take pipeline like: `pipeline_manager.load("primitive-3D")`
	constructor(name, graphics, pipeline, rotation_speed, rotation_axis = [0.0, 1.0, 0.0]) {
		this.name = name;
		this.pipeline = pipeline;
		this.mesh = new mesh(graphics.gl, "cube", pipeline, this._make_cube_vertices());
		this.rotation_speed = rotation_speed;
		this.rotation_axis  = rotation_axis;
		this.transform = golxzn.math.mat4.make_identity();
	}

	update(delta) {
		const m = golxzn.math.mat4;
		this.transform = m.rotate(this.transform, this.rotation_speed * delta, this.rotation_axis);
	}

	draw(graphics) {
		this.pipeline.use();
		this.pipeline.set_uniform("u_model", this.transform);

		this.mesh.bind();
		this.mesh.draw();
		this.mesh.unbind();
	}

	_make_cube_vertices() {
		// Define the 8 vertices of a cube
		const vertices = [
			new vertex([-1.0, -1.0, -1.0], [0, 0, -127], [0, 0]),  // Front bottom-left
			new vertex([ 1.0, -1.0, -1.0], [0, 0, -127], [1, 0]),  // Front bottom-right
			new vertex([ 1.0,  1.0, -1.0], [0, 0, -127], [1, 1]),  // Front top-right
			new vertex([-1.0,  1.0, -1.0], [0, 0, -127], [0, 1]),  // Front top-left

			new vertex([-1.0, -1.0,  1.0], [0, 0, 128], [0, 0]),   // Back bottom-left
			new vertex([ 1.0, -1.0,  1.0], [0, 0, 128], [1, 0]),   // Back bottom-right
			new vertex([ 1.0,  1.0,  1.0], [0, 0, 128], [1, 1]),   // Back top-right
			new vertex([-1.0,  1.0,  1.0], [0, 0, 128], [0, 1])    // Back top-left
		];

		// Return the array of vertices (positions, normals, and UVs) for a cube
		const faces = [
			vertices[0], vertices[1], vertices[2], vertices[2], vertices[3], vertices[0], // Front face
			vertices[5], vertices[4], vertices[7], vertices[7], vertices[6], vertices[5], // Back face
			vertices[3], vertices[2], vertices[6], vertices[6], vertices[7], vertices[3], // Top face
			vertices[4], vertices[5], vertices[1], vertices[1], vertices[0], vertices[4], // Bottom face
			vertices[1], vertices[5], vertices[6], vertices[6], vertices[2], vertices[1], // Right face
			vertices[4], vertices[0], vertices[3], vertices[3], vertices[7], vertices[4] // Left face
		];

		return faces;
	}
};
