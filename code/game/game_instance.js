
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
		// GAME OBJECTS
		this._load_model("assets/models/water-bottle/WaterBottle.gltf", (obj) => {
			obj.transform.position = [-1.0, 1.5, -1.0];
			obj.transform.scale = [10.0, 10.0, 10.0];
		});
		this._load_model("assets/models/EmissiveStrengthTest/EmissiveStrengthTest.gltf", (obj) => {
			obj.transform.position = [0.0, 6.0, 10.0];
			obj.transform.rotation = golxzn.math.quat.from_euler([0.0, Math.PI, 0.0]);
		});
		this._load_model("assets/models/street-lamp-pillar/street-lamp-pillar.gltf", (obj) => {
			obj.transform.position = [1.0, 0.0, 1.0];
		});
		this._load_model("assets/models/DamagedHelmet/DamagedHelmet.gltf", (obj) => {
			obj.transform.position = [3.0, 3.0, 0.0];
		});
		this._load_model("assets/models/ground/ground.gltf");




		// LIGHTING
		const setup_light_gizmo = (obj, color, position) => {
			var emissive_factor = color.slice(0);
			while (emissive_factor.length >= 4) emissive_factor.pop();

			obj.transform.position = position;
			for (var primitive of obj.mesh.primitives) {
				primitive.material.base_color_factor = [0.0, 0.0, 0.0, 1.0];
				primitive.material.emissive_factor = emissive_factor;
			}
		}

		graphics.directional_lights = new DirectionalLight([-0.5, -1.0, -1.0], {
			color: [0.1, 0.14, 0.22],
			intensity: 2.0
		});


		const rgb = [
			[1.0, 0.0, 0.0],
			[0.0, 1.0, 0.0],
			[0.0, 0.0, 1.0]
		];

		const point_attenuation = [ 1.0, 0.09, 0.032 ];
		const point_lights = this.scene_manager.add_object(new node({ name: "PointLights" }));
		for (const color of rgb) {
			const pos = golxzn.math.sum(golxzn.math.scale(color, 5.0), [0.0, 1.0, 0.0]);
			graphics.point_lights.push(new PointLight(pos, point_attenuation, {
				color: color,
				intensity: 1.0
			}));

			this._load_model("assets/models/gizmos/gizmos_sphere.gltf", (obj) => {
				setup_light_gizmo(obj, color, pos);
				obj.parent = point_lights;
			});
		}


		const spot_color = [0.96, 0.72, 0.36];
		const spot_limits = {
			inner: Math.cos(golxzn.math.to_radians(30.0)),
			outer: Math.cos(golxzn.math.to_radians(33.5))
		};
		const spot_attenuation = [1.0, 0.007, 0.0002];

		const distance_from_center = 4.5;
		const light_height = 6.0;
		// const light_count = SHADERS_COMMON.MAX_SPOT_LIGHT_COLORS;
		const light_count = 2;
		const angle = 2.0 * Math.PI / light_count;

		const spot_lights = this.scene_manager.add_object(new node({ name: "SpotLights" }));
		for (var i = 0; i < light_count; ++i) {
			const position = [
				distance_from_center * Math.cos(i * angle),
				light_height,
				distance_from_center * Math.sin(i * angle)
			];
			var light = new SpotLight(
				position, golxzn.math.vec3.negative(position), spot_attenuation, spot_limits, {
					color: spot_color,
					intensity: 4.0
				}
			);

			graphics.spot_lights.push(light);
			this._load_model("assets/models/gizmos/gizmos_sphere.gltf", (obj) => {
				obj.name += `_${i}`;
				setup_light_gizmo(obj, spot_color, position);
				obj.parent = spot_lights;
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