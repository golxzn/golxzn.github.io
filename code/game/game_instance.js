
class game_instance {
	constructor(display, graphics) {
		this.display = display;
		this.keys = {};
		this.mouse = new mouse_info([display.width / 2, display.height / 2]);
		this.keyboard = new keyboard_info();

		this.scene_manager = get_service("scene");
		this.paused = true;

		this.camera = new flying_camera([0.0, 5.0, -10.0]);
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

	render_gizmos(g) {
		this.scene_manager.render_gizmos(g);
	}

	_load_model(path, on_load = (_obj) => {}) {
		const push_to_scene_manager = (model) => {
			on_load(model);
			this.scene_manager.add_object(model);
		};

		const res = get_service("resource");
		if (!res.has_model(path)) {
			res.load_model(path).then(push_to_scene_manager);
		} else {
			push_to_scene_manager(res.get_model(path));
		}
	}

	_load_demo_scene(graphics) {
		const m4 = golxzn.math.mat4;

		// GAME OBJECTS

		/*
		for (var i = -5; i < 5; ++i) {
			for (var j = -5; j < 5; ++j) {
				const x = i;
				const y = j;
				this._load_model("assets/models/street-lamp-pillar/street-lamp-pillar.gltf", (obj) => {
					obj.transform.position = [ x, 0.0, y ];
					// obj.transform.rotation = [ 0.258819, 0, 0, 0.9659258 ]; // 30 deg around X
				});
			}
		}
		*/

		this._load_model("assets/models/water-bottle/WaterBottle.gltf", (obj) => {
			obj.transform.position = [ 0.0, 1.3, 3.0 ];
			obj.transform.scale = [10.0, 10.0, 10.0];
		});
		this._load_model("assets/models/street-lamp-pillar/street-lamp-pillar.gltf", (obj) => {
			obj.transform.position = [ 3.0, 0.0, -3.0 ];
			// obj.transform.rotation = [ 0.258819, 0, 0, 0.9659258 ]; // 30 deg around X
		});

		this._load_model("assets/models/logitech-keyboard/Logitech Keyboard.gltf", (obj) => {
			obj.transform.position = [ 3.0, 0.0, 0.0 ];
			obj.transform.rotation = golxzn.math.quat.from_euler([ 0, Math.PI * 0.75, 0 ]);
		});
		this._load_model("assets/models/alpha-blend-mode-test/AlphaBlendModeTest.gltf", (obj) => {
			obj.transform.position = [ -5.0, 0.0, 2.0 ];
			obj.transform.rotation = golxzn.math.quat.from_euler([ 0, Math.PI * 1.25, 0 ]);
		});
		this._load_model("assets/models/ground/ground.gltf");
		// this._load_model("assets/models/sponza/Sponza.gltf");


		const setup_light_gizmo = (obj, color, position) => {
			var base_color = color.slice(0);
			while (base_color.length < 4) base_color.push(0.4);

			var emissive_factor = color.slice(0);
			while (emissive_factor.length >= 4) emissive_factor.pop();

			obj.transform.position = position;
			for (var primitive of obj.mesh.primitives) {
				primitive.material.base_color_factor = base_color;
				primitive.material.emissive_factor = emissive_factor;
			}
		}

		// LIGHTING
		// const directional_power = [0.1, 0.14, 0.22];
		const directional_color = [0.2, 0.28, 0.44];
		graphics.directional_lights = new DirectionalLight([-1.0, -1.0, -1.0], {
			color: directional_color,
			intensity: 1.0
		});


		const attenuation = [ 1.0, 0.09, 0.032 ];
		const rgb = [
			[1.0, 0.0, 0.0],
			[0.0, 1.0, 0.0],
			[0.0, 0.0, 1.0]
		];

		for (const color of rgb) {
			const pos = golxzn.math.sum(golxzn.math.scale(color, 5.0), [0.0, 2.0, 0.0]);
			graphics.point_lights.push(new PointLight(pos, attenuation, { color: color, intensity: 10.0 }));

			this._load_model("assets/models/gizmos/gizmos_sphere.gltf", (obj) => {
				setup_light_gizmo(obj, color, pos);
			});
		}


		const spot_color = [0.96, 0.72, 0.36];
		const spot_limits = {
			inner: Math.cos(golxzn.math.to_radians(18.0)),
			outer: Math.cos(golxzn.math.to_radians(19.5))
		};

		const distance_from_center = 5.0;
		const light_height = 10.0;
		// const light_count = SHADERS_COMMON.MAX_SPOT_LIGHT_COLORS;
		const light_count = 3;
		const angle = 2.0 * Math.PI / light_count;

		for (var i = 0; i < light_count; ++i) {
			const position = [
				distance_from_center * Math.cos(i * angle),
				light_height,
				distance_from_center * Math.sin(i * angle)
			];
			const direction = golxzn.math.normalize(golxzn.math.vec3.negative(position));

			var light = new SpotLight(
				position, direction, [1.0, 0.007, 0.0002], spot_limits, { color: spot_color }
			);

			graphics.spot_lights.push(light);
			this._load_model("assets/models/gizmos/gizmos_sphere.gltf", (obj) => {
				setup_light_gizmo(obj, spot_color, position);
			});
		}

		// PARTICLES
		// const particles_count = 50000;
		// this.scene_manager.add_object(new cpu_falling_snow(
		// 	"snow-particles", {}, particles_count
		// ));
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
		if (event.code == 'KeyP') {
			this._load_model("assets/models/street-lamp-pillar/street-lamp-pillar.gltf", (obj) => {
				obj.transform.position = [ (Math.random() - 0.5) * 5.0, 0.0, (Math.random() - 0.5) * 5.0 ];
				// obj.transform.rotation = [ 0.258819, 0, 0, 0.9659258 ]; // 30 deg around X
			});
		}
	}

	on_key_down(event) {
		if (this.paused) return;

		this.keyboard.on_key_down(event);
	}

	on_wheel(event) {
		if (this.paused) return;

		this.camera.speed -= event.deltaY * 0.001;
	}
}