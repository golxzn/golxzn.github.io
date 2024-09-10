
class ground {
	constructor(name, graphics, pipeline, scale = [1.0, 1.0, 1.0]) {
		const m = golxzn.math.mat4;

		this.name = name;
		this.transform = m.scale(m.make_identity(), scale);
		this.pipeline = pipeline;
		this.texture = null;
		this.mesh = new mesh(graphics.gl, "plane", pipeline, primitives.make_plane(graphics.gl));

		get_service("resource").load_texture("assets/textures/asphalt.jpg").then((tex) => {
			this.texture = tex;
		});
	}

	draw(graphics) {
		if (this.texture == null) return;

		graphics.push_pipeline(this.pipeline);

		graphics.apply_texture(0, this.texture);
		this.pipeline.set_uniform("u_model", this.transform);
		graphics.draw_mesh(this.mesh);

		graphics.pop_pipeline();
	}
}