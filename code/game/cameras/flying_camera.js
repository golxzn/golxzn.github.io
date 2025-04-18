
const MIN_CAMERA_SPEED = 0.1;
const MAX_CAMERA_SPEED = 100.0;

class flying_camera extends camera {
	constructor(position, speed = 10, fov = golxzn.math.to_radians(75), aspect = 1.0) {
		super(position, fov, aspect);
		this._speed = speed;
	}

	get speed() { return this._speed; }
	set speed(value) {
		this._speed = golxzn.math.clamp(value, MIN_CAMERA_SPEED, MAX_CAMERA_SPEED);
	}

	update(keyboard, delta) {
		if      (keyboard.pressed("KeyW")) this.move(camera.DIRECTION_FORWARD, delta);
		else if (keyboard.pressed("KeyS")) this.move(camera.DIRECTION_BACKWARD, delta);

		if      (keyboard.pressed("KeyA")) this.move(camera.DIRECTION_LEFT, delta);
		else if (keyboard.pressed("KeyD")) this.move(camera.DIRECTION_RIGHT, delta);

		if (keyboard.pressed("KeyE") || keyboard.pressed("Space")) {
			this.move(camera.DIRECTION_UP, delta);
		} else if (keyboard.pressed("KeyQ") || keyboard.pressed("ShiftLeft")) {
			this.move(camera.DIRECTION_DOWN, delta);
		}
	}

	move(direction, delta) {
		const m = golxzn.math;

		const distance = this._speed * delta;
		switch (direction) {
			case camera.DIRECTION_FORWARD:
				this.position = m.sum(this.position, m.scale(this.front, distance));
				break;

			case camera.DIRECTION_BACKWARD:
				this.position = m.sub(this.position, m.scale(this.front, distance));
				break;

			case camera.DIRECTION_LEFT:
				this.position = m.sub(this.position, m.scale(m.vec3.cross(this.front, this.up), distance));
				break;

			case camera.DIRECTION_RIGHT:
				this.position = m.sum(this.position, m.scale(m.vec3.cross(this.front, this.up), distance));
				break;

			case camera.DIRECTION_UP:
				this.position = m.sum(this.position, m.scale(this.up, distance));
				break;

			case camera.DIRECTION_DOWN:
				this.position = m.sub(this.position, m.scale(this.up, distance));
				break;

			default:
				console.warn("[camera] Invalid move direction:", direction);
				break;
		}
	}

	mouse_move(delta) {
		this.yaw   += delta[0] * this.sensitivity[0];
		this.pitch += delta[1] * this.sensitivity[1];
	}

}

