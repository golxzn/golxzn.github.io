
class rotating_cube extends model_object {
	constructor(name, texture_name, rotation_speed, rotation_axis = [0.0, 1.0, 0.0]) {
		super(name, new model([
			new mesh(
				{ u_diffuse: texture_name },
				"white rubber",
				primitives.make_cube()
			)
		]));

		this.rotation_speed = rotation_speed;
		this.rotation_axis  = rotation_axis;
	}

	update(delta) {
		const m = golxzn.math.mat4;
		this.transform = m.rotate(this.transform, this.rotation_speed * delta, this.rotation_axis);
	}
};
