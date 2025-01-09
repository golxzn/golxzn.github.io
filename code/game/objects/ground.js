

class ground extends model_object {
	constructor(name, texture_name, scale = [1.0, 1.0]) {
		super(name, new model([
			new mesh(
				{ u_albedo: texture_name },
				"white rubber",
				primitives.make_custom_plane(scale[0], scale[2])
			)
		]));

		this.transform = golxzn.math.mat4.scale(this.transform, scale);
	}
}