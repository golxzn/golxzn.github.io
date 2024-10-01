const CLEAR_COLOR = [0.0, 0.0, 0.0, 1.0]

let handle;
let last_time = 0;
let renderer = null;
let loading = null;
let game = null;

function instantiate_game(display, renderer) {
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

function start() {
	const display = document.getElementById("display");

	display.width = window.innerWidth;
	display.height = window.innerHeight;

	renderer = new graphics(display);
	renderer.set_clear_color(CLEAR_COLOR);

	// SINGLETON
	new service_provider_singleton({
		"graphics": renderer,
		"pipeline": new pipeline_manager(renderer),
		"resource": new resource_manager(renderer),
		"scene"   : new scene_manager()
	});

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
	const delta = (timestamp - last_time) * 0.001;
	last_time = timestamp;

	game.update(delta);
	renderer.render(game);

	handle = requestAnimationFrame(game_loop);
}
