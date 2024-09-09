
const CAMERA_MIN_PITCH = -89.0;
const CAMERA_MAX_PITCH = 89.0;

const TO_RADIANS = Math.PI / 180.0;

class camera {
	static DIRECTION_FORWARD  = 0;
	static DIRECTION_BACKWARD = 1;
	static DIRECTION_LEFT     = 2;
	static DIRECTION_RIGHT    = 3;
	static DIRECTION_UP       = 4;
	static DIRECTION_DOWN     = 5;

	constructor(position) {
		this.position = position;
		this.front    = [0.0, 0.0, -1.0];
		this.up       = [0.0, 1.0, 0.0];

		this.sensitivity = [0.1, 0.1];

		this._yaw   = -90.0;
		this._pitch = 0.0;
		this._roll  = 0.0;

		this._yaw_pitch_dirty = false;
	}

	set yaw(value) {
		this._yaw_pitch_dirty = true;
		this._yaw = value;
	}

	set pitch(value) {
		this._yaw_pitch_dirty = true;
		this._pitch = value;
		if (this._pitch >= CAMERA_MAX_PITCH) this._pitch = CAMERA_MAX_PITCH;
		if (this._pitch <= CAMERA_MIN_PITCH) this._pitch = CAMERA_MIN_PITCH;
	}

	get yaw()   { return this._yaw; }
	get pitch() { return this._pitch; }
	get roll()  { return this._roll; }

	make_view() {
		if (this._yaw_pitch_dirty) {
			this.front = golxzn.math.normalize([
				Math.cos(this._yaw * TO_RADIANS) * Math.cos(this._pitch * TO_RADIANS),
				Math.sin(this._pitch * TO_RADIANS),
				Math.sin(this._yaw * TO_RADIANS) * Math.cos(this._pitch * TO_RADIANS),
			]);
			this._yaw_pitch_dirty = false;
		}

		return golxzn.math.mat4.look_at(
			this.position,
			golxzn.math.sum(this.position, this.front),
			this.up
		);
	}
}
