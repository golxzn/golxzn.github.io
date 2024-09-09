const CLEAR_COLOR = [0.0, 0.0, 0.0, 1.0]

let handle;
let last_time = 0;
let renderer;
let game;

function start() {
	const display = document.getElementById("display");

	display.width = window.innerWidth;
	display.height = window.innerHeight;
	// display.width = 1024;
	// display.height = 720;

	renderer = new graphics(display);
	renderer.set_clear_color(CLEAR_COLOR);

	game = new game_instance(display, renderer);

	document.onkeydown = (event) => game.on_key_down(event);
	document.onkeyup   = (event) => game.on_key_up(event);

	display.onmousedown = (event) => game.on_mouse_down(event);
	display.onmousemove = (event) => game.on_mouse_move(event);
	display.onmouseup = (event) => game.on_mouse_up(event);
	display.addEventListener("click", async () => {
		display.requestPointerLock({
			unadjustedMovement: true,
		});
	});

	document.addEventListener("pointerlockchange", () => {
		if (document.pointerLockElement === display) {
			game.on_mouse_capture();
		} else {
			game.on_mouse_release();
		}
	})

	handle = requestAnimationFrame(game_loop);
}

function game_loop(timestamp) {
	const delta = (timestamp - last_time) * 0.001;
	last_time = timestamp;

	game.update(delta);

	renderer.clear();
	game.render(renderer);

	handle = requestAnimationFrame(game_loop);
}
