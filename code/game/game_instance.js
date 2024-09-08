
function make_cube() {
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


class game_instance {
	constructor(graphics) {
		this.keys = {}
		this.scene_manager = new scene_manager()

		let shaders = {};
		shaders[graphics.gl.VERTEX_SHADER]   = document.querySelector("#primitive-vertex-3D").text;
		shaders[graphics.gl.FRAGMENT_SHADER] = document.querySelector("#primitive-fragment-3D").text;
		this.primitive_pipeline = new pipeline(graphics.gl, "primitive", shaders);
		this.cube = new mesh(graphics.gl, "cube", this.primitive_pipeline, make_cube());

		const aspect = graphics.aspect_ratio();
		this.projection = golxzn.math.mat4.make_perspective(Math.PI * 0.4, aspect, 0.001, 1000) // ~72 deg
		this.view = golxzn.math.mat4.translate(golxzn.math.mat4.make_identity(), [0.0, 0.0, -3.0]);

		this.model = golxzn.math.mat4.make_identity(); // TODO: Move to the model
	}

	update(delta) {
		if (this.key_just_pressed("KeyS")) {
			this.view = golxzn.math.mat4.translate(this.view, [0.0, 0.0, -1.0]);
		}
		if (this.key_just_pressed("KeyW")) {
			this.view = golxzn.math.mat4.translate(this.view, [0.0, 0.0, 1.0]);
		}
		if (this.key_just_pressed("KeyD")) {
			this.view = golxzn.math.mat4.translate(this.view, [-1.0, 0.0, 0.0]);
		}
		if (this.key_just_pressed("KeyA")) {
			this.view = golxzn.math.mat4.translate(this.view, [1.0, 0.0, 0.0]);
		}
		if (this.key_just_pressed("KeyQ")) {
			this.view = golxzn.math.mat4.translate(this.view, [0.0, 1.0, 0.0]);
		}
		if (this.key_just_pressed("KeyE")) {
			this.view = golxzn.math.mat4.translate(this.view, [0.0, -1.0, 0.0]);
		}

		this.model = golxzn.math.mat4.rotate(this.model, delta, [0.0, 1.0, 0.0]);

		this.scene_manager.update(delta);
	}

	render(g) {
		this.primitive_pipeline.use();
		this.primitive_pipeline.set_uniform("u_model", this.model);
		this.primitive_pipeline.set_uniform("u_view", this.view);
		this.primitive_pipeline.set_uniform("u_projection", this.projection);

		this.cube.bind();
		this.cube.draw();
		this.cube.unbind();
	}

	key_just_pressed(key_name, timeout = 10) {
		if (!(key_name in this.keys)) return false;

		const key_info = this.keys[key_name];
		if (!key_info["pressed"]) return false;

		return Date.now() - key_info["timestamp"] <= timeout;
	}
}