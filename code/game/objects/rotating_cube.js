
class rotating_cube {
	// TODO: It's better to take pipeline like: `pipeline_manager.load("primitive-3D")`
	constructor(name, graphics, pipeline, rotation_speed, rotation_axis = [0.0, 1.0, 0.0]) {
		this.name = name;
		this.rotation_speed = rotation_speed;
		this.rotation_axis  = rotation_axis;
		this.transform = golxzn.math.mat4.make_identity();

		this.pipeline = pipeline;
		this.texture = null;
		this.mesh = new mesh(graphics.gl, "cube", pipeline, primitives.make_cube_strip(graphics.gl));
		get_service("resource").load_texture("assets/textures/lain.jpg").then((tex) => {
			this.texture = tex;
		});
	}

	update(delta) {
		const m = golxzn.math.mat4;
		this.transform = m.rotate(this.transform, this.rotation_speed * delta, this.rotation_axis);
	}

	draw(graphics) {
		if (this.texture == null) return;

		graphics.push_pipeline(this.pipeline);

		graphics.apply_texture(0, this.texture);
		this.pipeline.set_uniform("u_model", this.transform);
		graphics.draw_mesh(this.mesh);

		graphics.pop_pipeline();
	}
};
