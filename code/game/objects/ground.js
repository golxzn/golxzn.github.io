

class ground extends model_object {
	constructor(name, texture_name, scale = [1.0, 1.0, 1.0]) {
		const resource = get_service("resource");
		super(name, new model([
			new textured_mesh(
				[ resource.get_texture(texture_name) ],
				primitives.make_plane()
			)
		]));

		this.transform = golxzn.math.mat4.scale(this.transform, scale);
	}
}