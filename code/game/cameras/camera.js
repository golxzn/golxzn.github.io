
const CAMERA_MIN_PITCH = -89.0;
const CAMERA_MAX_PITCH = 89.0;

const PERSPECTIVE_NEAR = 0.01;
const PERSPECTIVE_FAR  = 100;


class camera {
	static DIRECTION_FORWARD  = 0;
	static DIRECTION_BACKWARD = 1;
	static DIRECTION_LEFT     = 2;
	static DIRECTION_RIGHT    = 3;
	static DIRECTION_UP       = 4;
	static DIRECTION_DOWN     = 5;

	constructor(position, fov = golxzn.math.to_radians(75), aspect = 1.0) {
		this.position = position;
		this.front    = [0.0, 0.0, -1.0];
		this.up       = [0.0, 1.0, 0.0];

		this.sensitivity = [0.1, 0.1];

		this._yaw   =  90.0;
		this._pitch = 0.0;
		// this._roll  = 0.0;

		this._fov = fov;
		this._aspect = aspect;

		this.perspective = golxzn.math.mat4.make_identity();

		this._perspective_dirty = true;
		this._yaw_pitch_dirty = false;
		this.update_front();
	}

	set yaw(value) {
		this._yaw_pitch_dirty = true;
		this._yaw = value;
	}

	set pitch(value) {
		this._yaw_pitch_dirty = true;
		this._pitch = golxzn.math.clamp(value, CAMERA_MIN_PITCH, CAMERA_MAX_PITCH);
	}

	set fov(value) {
		this._fov = value;
		this._perspective_dirty = true;
	}
	set aspect(value) {
		this._aspect = value;
		this._perspective_dirty = true;
	}

	get yaw()   { return this._yaw; }
	get pitch() { return this._pitch; }
	// get roll()  { return this._roll; }
	get fov()   { return this._fov; }
	get aspect() { return this._aspect; }

	make_view() {
		if (this._yaw_pitch_dirty) {
			this.update_front();
			this._yaw_pitch_dirty = false;
		}

		return golxzn.math.mat4.look_at(
			this.position,
			golxzn.math.sum(this.position, this.front),
			this.up
		);
	}

	make_projection() {
		if (this._perspective_dirty) {
			this.perspective = golxzn.math.mat4.make_perspective(
				this._fov, this._aspect, PERSPECTIVE_NEAR, PERSPECTIVE_FAR
			);
			this._perspective_dirty = false;
		}
		return this.perspective;
	}

	update_front() {
		this.front = golxzn.math.normalize([
			Math.cos(golxzn.math.to_radians(this._yaw)) * Math.cos(golxzn.math.to_radians(this._pitch)),
			Math.sin(golxzn.math.to_radians(this._pitch)),
			Math.sin(golxzn.math.to_radians(this._yaw)) * Math.cos(golxzn.math.to_radians(this._pitch)),
		]);
	}
}
