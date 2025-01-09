
const MOUSE_BUTTON_LEFT    = 0;
const MOUSE_BUTTON_WHEEL   = 1;
const MOUSE_BUTTON_RIGHT   = 2;
const MOUSE_BUTTON_BACK    = 3;
const MOUSE_BUTTON_FORWARD = 4;

const MOUSE_BUTTON_COUNT   = 5;

class mouse_info {
	constructor(position = [0, 0]) {
		this.button_pressed = Array(MOUSE_BUTTON_COUNT).fill(false);
		this.button_timestamp = Array(MOUSE_BUTTON_COUNT).fill(0);
		this.last_press_pos = [0, 0];
		this.current_press_pos = [0, 0];
		this.last_scroll = [0, 0];
		this.position = position
		this.delta = [0, 0];
	}

	pressed(button = MOUSE_BUTTON_LEFT) {
		return this.button_pressed[button];
	}

	released(button = MOUSE_BUTTON_LEFT) {
		return this.button_pressed[button];
	}


	just_pressed(button = MOUSE_BUTTON_LEFT, timeout = 10) {
		return this.button_pressed[button] && Date.now() - this.button_timestamp[button] <= timeout;
	}

	just_released(button = MOUSE_BUTTON_LEFT, timeout = 10) {
		return !this.button_pressed[button] && Date.now() - this.button_timestamp[button] <= timeout;
	}

	on_mouse_down(event) {
		this.button_pressed[event.button] = true;
		this.button_timestamp[event.button] = Date.now();
		this.current_press_pos = [event.x, event.y];
		this._update_info(event);
	}

	on_mouse_move(event) {
		this.last_press_pos = this.current_press_pos
		this._update_info(event);
	}

	on_mouse_up(event) {
		this.button_pressed[event.button] = false;
		this.button_timestamp[event.button] = Date.now();
		this._update_info(event);
	}

	on_scroll(event) {
		this.last_scroll = [event.deltaX, event.deltaY];
	}

	_update_info(event) {
		this.delta = [event.movementX, -event.movementY];
		this.position = [event.x, event.y];
	}

};