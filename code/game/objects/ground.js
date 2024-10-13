

class ground extends model_object {
	constructor(name, texture_name, scale = [1.0, 1.0, 1.0]) {
		const resource = get_service("resource");
		super(name, new model([
			new mesh(
				{ u_diffuse: texture_name },
				"white rubber",
				primitives.make_custom_plane(5, 5)
			)
		]));

		this.transform = golxzn.math.mat4.scale(this.transform, scale);
	}
}