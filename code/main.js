const CLEAR_COLOR = [0.0, 0.0, 0.0, 1.0]

let handle;
let last_time = 0;
let renderer;
let game;

function start() {
	const display = document.getElementById("display");

	display.width = window.innerWidth;
	display.height = window.innerHeight;

	renderer = new graphics(display);
	renderer.set_clear_color(CLEAR_COLOR);

	game = new game_instance(renderer);

	handle = requestAnimationFrame(game_loop);
}

function game_loop(timestamp) {
	const delta = timestamp - last_time;
	last_time = timestamp;

	game.update(delta);

	renderer.clear();
	game.render(renderer);

	handle = requestAnimationFrame(game_loop);
}
