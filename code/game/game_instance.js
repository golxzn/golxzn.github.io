
class game_instance {
	constructor(display, graphics) {
		this.display = display;
		this.keys = {};
		this.mouse = new mouse_info([display.width / 2, display.height / 2]);
		this.keyboard = new keyboard_info();

		this.scene_manager = get_service("scene");

		this.paused = true;

		// Should be somewhere else. for example in the player class or as the independent object
		this.camera = new flying_camera([0.0, 3.0, 0.0]);
		graphics.set_active_camera(this.camera);

		this.scene_manager.add_object(new ground(
			"ground", "assets/textures/asphalt.jpg", [10.0, 1.0, 10.0]
		));
		const cube = this.scene_manager.add_object(new rotating_cube(
			"cube", "assets/textures/lain.jpg", 1
		));
		cube.transform = golxzn.math.mat4.translate(cube.transform, [0.0, 3.0, 3.0]);
	}

	update(delta) {
		this.scene_manager.update(delta);
		this.camera.update(this.keyboard, delta);
	}

	render(g) {
		this.scene_manager.render(g);
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