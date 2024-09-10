
class rotating_cube {
	// TODO: It's better to take pipeline like: `pipeline_manager.load("primitive-3D")`
	constructor(name, graphics, pipeline, rotation_speed, rotation_axis = [0.0, 1.0, 0.0]) {
		this.name = name;
		this.rotation_speed = rotation_speed;
		this.rotation_axis  = rotation_axis;
		this.transform = golxzn.math.mat4.make_identity();

		this.pipeline = pipeline;
		const cube = primitives.make_cube(graphics.gl);
		this.mesh = new mesh(graphics.gl, "cube", pipeline,
		this.mesh = new mesh(graphics.gl, "cube", pipeline, primitives.make_cube(graphics.gl));
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
};
