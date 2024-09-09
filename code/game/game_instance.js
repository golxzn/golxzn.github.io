
class game_instance {
	constructor(display, graphics) {
		this.display = display;
		this.keys = {}
		this.mouse = new mouse_info([display.width / 2, display.height / 2]);
		this.keyboard = new keyboard_info();
		this.scene_manager = new scene_manager()

		this.paused = true;

		// Should be somewhere else. for example in the player class or as the independent object
		this.camera = new flying_camera([0.0, 0.0, 3.0]);

		let shaders = {};
		shaders[graphics.gl.VERTEX_SHADER]   = document.querySelector("#primitive-vertex-3D").text;
		shaders[graphics.gl.FRAGMENT_SHADER] = document.querySelector("#primitive-fragment-3D").text;
		this.primitive_pipeline = new pipeline(graphics.gl, "primitive", shaders);

		this.scene_manager.add_object(new rotating_cube("cube", graphics, this.primitive_pipeline, 1));

		// TODO: Move projection to the camera???
		const aspect = graphics.aspect_ratio();
		this.projection = golxzn.math.mat4.make_perspective(Math.PI * 0.4, aspect, 0.001, 1000) // ~72 deg
		this.model = golxzn.math.mat4.make_identity();
	}

	update(delta) {
		console.log("Delta:", delta)
		this.scene_manager.update(delta);
		this.camera.update(this.keyboard, delta);
	}

	render(g) {
		this.primitive_pipeline.use();
		this.primitive_pipeline.set_uniform("u_model", this.model);
		this.primitive_pipeline.set_uniform("u_view", this.camera.make_view());
		this.primitive_pipeline.set_uniform("u_projection", this.projection);

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