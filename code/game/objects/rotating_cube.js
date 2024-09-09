
class rotating_cube {
	// TODO: It's better to take pipeline like: `pipeline_manager.load("primitive-3D")`
	constructor(name, graphics, pipeline, rotation_speed, rotation_axis = [0.0, 1.0, 0.0]) {
		this.name = name;
		this.pipeline = pipeline;
		this.mesh = new mesh(graphics.gl, "cube", pipeline,
			this._make_vertices(), this._make_indices());
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

		this.mesh.draw(graphics);
	}

	_make_vertices() {
		// Define the 8 vertices of a cube
		return vertex.pack([
			new vertex([-1.0, -1.0, -1.0], [0, 0, -127], [0, 0]),  // Front bottom-left
			new vertex([ 1.0, -1.0, -1.0], [0, 0, -127], [1, 0]),  // Front bottom-right
			new vertex([ 1.0,  1.0, -1.0], [0, 0, -127], [1, 1]),  // Front top-right
			new vertex([-1.0,  1.0, -1.0], [0, 0, -127], [0, 1]),  // Front top-left

			new vertex([-1.0, -1.0,  1.0], [0, 0, 128], [0, 0]),   // Back bottom-left
			new vertex([ 1.0, -1.0,  1.0], [0, 0, 128], [1, 0]),   // Back bottom-right
			new vertex([ 1.0,  1.0,  1.0], [0, 0, 128], [1, 1]),   // Back top-right
			new vertex([-1.0,  1.0,  1.0], [0, 0, 128], [0, 1])    // Back top-left
		]);
	}

	_make_indices() {
		return new Uint16Array([
			0, 1, 2, 2, 3, 0, // Front face
			5, 4, 7, 7, 6, 5, // Back face
			3, 2, 6, 6, 7, 3, // Top face
			4, 5, 1, 1, 0, 4, // Bottom face
			1, 5, 6, 6, 2, 1, // Right face
			4, 0, 3, 3, 7, 4 // Left face
		]);
	}
};
