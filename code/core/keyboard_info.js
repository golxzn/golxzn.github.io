
class key_info {
	constructor(pressed, timestamp = Date.now()) {
		this.pressed = pressed;
		this.timestamp = timestamp;
	}
}

class keyboard_info {
	constructor() {
		this.keys = {};
	}

	pressed(key_name) {
		return key_name in this.keys && this.keys[key_name].pressed;
	}

	released(key_name) {
		return !this.pressed(key_name)
	}

	just_pressed(key_name, timeout = 10) {
		if (!(key_name in this.keys)) return false;

		const key_info = this.keys[key_name];
		if (!key_info.pressed) return false;

		return Date.now() - key_info.timestamp <= timeout;
	}

	just_released(key_name, timeout = 10) {
		if (!(key_name in this.keys)) return false;

		const key_info = this.keys[key_name];
		if (key_info.pressed) return false;

		return Date.now() - key_info.timestamp <= timeout;
	}

	on_key_down(event) {
		this.keys[event.code] = new key_info(true);
	}

	on_key_up(event) {
		this.keys[event.code] = new key_info(false);
	}

}
