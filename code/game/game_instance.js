
class game_instance {
	constructor(display, graphics) {
		this.display = display;
		this.keys = {};
		this.mouse = new mouse_info([display.width / 2, display.height / 2]);
		this.keyboard = new keyboard_info();

		this.scene_manager = get_service("scene");

		this.paused = true;

		// Should be somewhere else. for example in the player class or as the independent object
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
		// const directional_power = [0.1, 0.1, 0.08];
		const directional_power = [0.5, 0.5, 0.5];
		const directional_properties = {
			ambient: directional_power,
			diffuse: directional_power,
			specular: directional_power
		};
		graphics.directional_lights = new DirectionalLight([0.0, -1.0, 0.0], directional_properties);

		const attenuation = [ 1.0, 0.09, 0.032 ];
		const rgb = [
			[1.0, 0.0, 0.0],
			[0.0, 1.0, 0.0],
			[0.0, 0.0, 1.0]
		];

		for (const color of rgb) {
			const pos = golxzn.math.scale(color, 5.0);
			graphics.point_lights.push(new PointLight(
				pos, attenuation, { ambient: color, diffuse: color, specular: color }
			));

			this.scene_manager.add_object(new model_object(color.toString(), new model([
				new mesh([], null, primitives.make_cube_colored(color))
			]), m4.scale(m4.translate(m4.make_identity(), pos), [0.25, 0.25, 0.25])));
		}

		const spot_color = [0.9, 0.1, 0.9]
		graphics.spot_lights.push(new SpotLight(
			[-10.0, 2.0, 0.0], // position
			[0.0, -1.0, 0.0], // direction
			[1.0, 0.022, 0.019], // attenuation
			{ inner: golxzn.math.to_radians(15), outer: golxzn.math.to_radians(17) },
			{ ambient: spot_color, diffuse: spot_color, specular: spot_color }
		));
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