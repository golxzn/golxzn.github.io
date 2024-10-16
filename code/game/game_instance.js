
class game_instance {
	constructor(display, graphics) {
		this.display = display;
		this.keys = {};
		this.mouse = new mouse_info([display.width / 2, display.height / 2]);
		this.keyboard = new keyboard_info();

		this.scene_manager = get_service("scene");
		this.paused = true;

		this.camera = new flying_camera([0.0, 3.0, -5.0]);
		graphics.set_active_camera(this.camera);

		this._load_demo_scene(graphics);
	}

	update(delta) {
		this.scene_manager.update(delta);
		this.camera.update(this.keyboard, delta);
	}

	render(g) {
		this.scene_manager.render(g);
	}

	_load_demo_scene(graphics) {
		const m4 = golxzn.math.mat4;

		// GAME OBJECTS

		const grnd = this.scene_manager.add_object(new ground(
			"ground", "assets/textures/asphalt.jpg", [10.0, 1.0, 10.0]
		));
		grnd.transform = m4.translate(grnd.transform, [0.0, -1.0, 0.0]);

		const cube = this.scene_manager.add_object(new rotating_cube(
			"cube", "assets/textures/lain.jpg", 1
		));
		cube.transform = m4.translate(cube.transform, [0.0, 0.5, 0.0]);

		// LIGHTING
		const directional_power = [0.19, 0.23, 0.31];
		const directional_properties = {
			ambient: directional_power,
			diffuse: directional_power,
			specular: directional_power
		};
		graphics.directional_lights = new DirectionalLight([0.0, -1.0, -1.0], directional_properties);

		const attenuation = [ 1.0, 0.09, 0.032 ];
		const rgb = [
			// [1.0, 0.0, 0.0],
			// [0.0, 1.0, 0.0],
			// [0.0, 0.0, 1.0]
		];

		for (const color of rgb) {
			const pos = golxzn.math.scale(color, 5.0);
			graphics.point_lights.push(new PointLight(
				pos, attenuation, { ambient: color, diffuse: color, specular: color }
			));

			this.scene_manager.add_object(new model_object(color.toString(), new model([
				new mesh({}, null, primitives.make_cube_colored(color))
			]), m4.scale(m4.translate(m4.make_identity(), pos), [0.25, 0.25, 0.25])));
		}




		const spot_color = [0.96, 0.72, 0.36];
		const spot_limits = {
			inner: Math.cos(golxzn.math.to_radians(29.5)),
			outer: Math.cos(golxzn.math.to_radians(55.5))
		};
		graphics.spot_lights.push(new SpotLight(
			[-8.0, 12.0, -8.0], // position
			[0.5, -1.0, 0.0], // direction
			[1.0, 0.007, 0.0002], // attenuation
			spot_limits,
			{ ambient: spot_color, diffuse: spot_color, specular: spot_color }
		));
		this.scene_manager.add_object(new model_object("spot", new model([
			new mesh({}, null, primitives.make_cube_colored(spot_color))
		]), m4.scale(m4.translate(m4.make_identity(), graphics.spot_lights[0].position), [0.25, 0.25, 0.25])));

		graphics.spot_lights.push(new SpotLight(
			[-8.0, 12.0, 8.0], // position
			[0.5, -1.0, 0.0], // direction
			[1.0, 0.007, 0.0002], // attenuation
			spot_limits,
			{ ambient: spot_color, diffuse: spot_color, specular: spot_color }
		));
		this.scene_manager.add_object(new model_object("spot2", new model([
			new mesh({}, null, primitives.make_cube_colored(spot_color))
		]), m4.scale(m4.translate(m4.make_identity(), graphics.spot_lights[1].position), [0.25, 0.25, 0.25])));


		// PARTICLES
		const particles_count = 50000;
		this.scene_manager.add_object(new falling_snow(
			"snow-particles", {}, particles_count
		));

		// var snow = this.scene_manager.add_object(new particles(
		// 	"snow-particles", { u_diffuse: "assets/textures/lain.jpg" }, particles_count
		// ));

		// const spawn_rectangle = {
		// 	x1: -50.0, z1: -50.0,
		// 	x2:  50.0, z2:  50.0
		// };

		// // Spawn particles
		// const x = 0;
		// const y = 1;
		// const z = 2;
		// snow.transform_all_particles((id, particle) => {
		// 	particle.offsets[x] = golxzn.get_random(spawn_rectangle.x1, spawn_rectangle.x2);
		// 	particle.offsets[y] = golxzn.get_random(20, 22);
		// 	particle.offsets[z] = golxzn.get_random(spawn_rectangle.z1, spawn_rectangle.z2);

		// 	particle.rotation[x] = 0;
		// 	particle.rotation[y] = golxzn.math.to_radians(golxzn.get_random(0, 180));
		// 	particle.rotation[z] = 0;

		// 	// const scale = 1.0 + (Math.random() - 0.5) * 0.1; // From 0.95 to 1.05
		// 	const scale = Math.random() * 0.7 + 0.1; // From 0.1 to 0.8
		// 	particle.scale[x] = scale;
		// 	particle.scale[y] = 1.0;
		// 	particle.scale[z] = scale;
		// });
	}

// Event handling

	on_mouse_capture() { this.paused = false; }
	on_mouse_release() { this.paused = true;  }

	on_mouse_down(event) {
		if (this.paused) return;

		this.mouse.on_mouse_down(event);
	}

	on_mouse_move(event) {
		if (this.paused) return;

		this.mouse.on_mouse_move(event);
		this.camera.mouse_move(this.mouse.delta);
	}

	on_mouse_up(event) {
		if (this.paused) return;

		this.mouse.on_mouse_up(event);
	}

	on_key_up(event) {
		if (this.paused) return;

		this.keyboard.on_key_up(event);
	}

	on_key_down(event) {
		if (this.paused) return;

		this.keyboard.on_key_down(event);
	}
}