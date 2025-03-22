
let handle;
let last_time = 0;
let renderer = null;
let loading = null;
let game = null;

function instantiate_game(display, renderer) {
	gl.getExtension("EXT_color_buffer_float");

	let instance = new game_instance(display, renderer);

	document.onkeydown = (event) => instance.on_key_down(event);
	document.onkeyup   = (event) => instance.on_key_up(event);

	display.onmousedown = (event) => instance.on_mouse_down(event);
	display.onmousemove = (event) => instance.on_mouse_move(event);
	display.onmouseup = (event) => instance.on_mouse_up(event);
	display.addEventListener("click", async () => {
		display.requestPointerLock({
			unadjustedMovement: true,
		});
	});

	document.addEventListener("pointerlockchange", () => {
		if (document.pointerLockElement === display) {
			instance.on_mouse_capture();
		} else {
			instance.on_mouse_release();
		}
	});

	return instance;
}

async function start() {
	display.width = window.innerWidth;
	display.height = window.innerHeight;


	// SINGLETON
	new service_provider_singleton({
		"pipeline": new pipeline_manager(),
		"resource": new resource_manager(),
		"scene"   : new scene_manager()
	});
	// Requires pipeline manager
	const renderer = service_provider().set("graphics", new graphics(display));
	renderer.set_clear_color(SETTINGS.graphics.clear_color);

	loading = new loading_screen((state) => {
		switch (state) {
			case loading_screen.STATE_DISAPPEAR:
				if (game == null) {
					game = instantiate_game(display, renderer);
				}
				break;
			case loading_screen.STATE_FINISHED:
				loading = null;
				break;
		}
	});

	handle = requestAnimationFrame(loading_loop);
}

function loading_loop(timestamp) {
	const delta = (timestamp - last_time) * 0.001;
	last_time = timestamp;

	if (loading == null) {
		handle = requestAnimationFrame(game_loop);
		return;
	}

	loading.update(delta);
	if (game != null){
		renderer.render(game);
	}

	handle = requestAnimationFrame(loading_loop);
}

function game_loop(timestamp) {
	ensure_canvas_size();

	const delta = (timestamp - last_time) * 0.001;
	updateFPS(delta);
	last_time = timestamp;

	game.update(delta);
	renderer.render(game);

	handle = requestAnimationFrame(game_loop);
}

function ensure_canvas_size() {
	gl.canvas.width = gl.canvas.clientWidth;
	gl.canvas.height = gl.canvas.clientHeight;
}


var fps_update_timer = 0;
const fps_display = document.querySelector("#fps")

function updateFPS(delta) {
	fps_update_timer += delta;
	if (fps_update_timer >= 0.25) {
		const fps = Math.round(1.0 / delta);
		fps_display.textContent = Math.round(fps);
		fps_update_timer = 0;
	}
}