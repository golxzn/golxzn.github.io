
class game_instance {
	constructor(display, graphics) {
		this.display = display;
		this.keys = {};
		this.mouse = new mouse_info([display.width / 2, display.height / 2]);
		this.keyboard = new keyboard_info();

		this.scene_manager = get_service("scene");
		this.paused = true;

		this.camera = new flying_camera([0.0, 20.0, -20.0]);
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

		for (var i = 0; i < 6; ++i) {
			const cube = this.scene_manager.add_object(new rotating_cube(
				`cube_${i}`, "assets/textures/lain.jpg", i * 0.5
			));
			cube.transform = m4.translate(cube.transform, [0.0, 0.5 + 2.1 * i, 0.0]);
		}

		// LIGHTING
		// const directional_power = [0.1, 0.14, 0.22];
		const directional_power = [0.02, 0.028, 0.044];
		const directional_properties = {
			ambient: directional_power,
			diffuse: directional_power,
			specular: directional_power
		};
		graphics.directional_lights = new DirectionalLight([-1.0, -1.0, -1.0], directional_properties);

		const attenuation = [ 1.0, 0.09, 0.032 ];
		const rgb = [
			[1.0, 0.0, 0.0],
			[0.0, 1.0, 0.0],
			[0.0, 0.0, 1.0]
		];

		for (const color of rgb) {
			const pos = golxzn.math.scale(color, 15.0);
			graphics.point_lights.push(new PointLight(
				pos, attenuation, { ambient: color, diffuse: color, specular: color }
			));

			this.scene_manager.add_object(new model_object(color.toString(), new model([
				new mesh({}, null, primitives.make_cube_colored(color))
			]), m4.scale(m4.translate(m4.make_identity(), pos), [0.25, 0.25, 0.25])));
		}


		const spot_color = [0.96, 0.72, 0.36];
		const spot_limits = {
			inner: Math.cos(golxzn.math.to_radians(18.0)),
			outer: Math.cos(golxzn.math.to_radians(19.5))
		};
		const spot_properties = {
			ambient: spot_color,
			diffuse: spot_color,
			specular: spot_color
		};

		const distance_from_center = 16.0;
		const light_height = 16.0;
		const light_count = SHADERS_COMMON.MAX_SPOT_LIGHT_COLORS;
		const angle = 2.0 * Math.PI / light_count;

		for (var i = 0; i < light_count; ++i) {
			const position = [
				distance_from_center * Math.cos(i * angle),
				light_height,
				distance_from_center * Math.sin(i * angle)
			];
			const direction = golxzn.math.normalize(golxzn.math.vec3.negative(position));

			var light = new SpotLight(
				position, direction, [1.0, 0.007, 0.0002], spot_limits, spot_properties
			);

			graphics.spot_lights.push(light);

			this.scene_manager.add_object(new floating_cube(`spot_${i}`,
				new model([ new mesh({}, null, primitives.make_cube_colored(spot_color)) ]),
				m4.scale(m4.translate(m4.make_identity(), position), [0.25, 0.25, 0.25]),
				1.0, 0.08, light, i * (Math.PI / 4.0)
			));
		}


		// PARTICLES
		const particles_count = 50000;
		this.scene_manager.add_object(new cpu_falling_snow(
			"snow-particles", {}, particles_count
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