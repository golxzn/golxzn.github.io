
const DEFAULT_TRANSFORM = {
	matrix: golxzn.math.mat4.identity(),
	position: [0.0, 0.0, 0.0],
	rotation: [0.0, 0.0, 0.0, 1.0],
	scale: [1.0, 1.0, 1.0]
};
Object.freeze(DEFAULT_TRANSFORM);

class transform {
	constructor(info = DEFAULT_TRANSFORM) {
		this._matrix = info.matrix || DEFAULT_TRANSFORM.matrix;
		this._position = info.position || DEFAULT_TRANSFORM.position;
		this._rotation = info.rotation || DEFAULT_TRANSFORM.rotation;
		this._scale = info.scale || DEFAULT_TRANSFORM.scale;
		this.dirty_flags = true;
	}

	is_dirty() {
		return this.dirty_flags;
	}

	mark_dirty() {
		this.dirty_flags = true;
	}

	actualize_matrix() {
		const m4 = golxzn.math.mat4;
		this._matrix = m4.translate(
			m4.multiply(
				m4.scale(m4.identity(), this._scale),
				m4.from_quaternion(this._rotation)
			),
			this._position
		);


		this.dirty_flags = false;
	}

	get matrix() {
		if (this.is_dirty()) this.actualize_matrix();
		return this._matrix;
	}

	/** @param {Array<float>} value */
	set position(value) {
		if (!Array.isArray(value) || value.length != DEFAULT_TRANSFORM.position.length) {
			console.warn("[transform] Attempt to assign ", typeof(value), " as position");
			return;
		}

		this._position = value;
		this.dirty_flags = true;
	}
	get position() { return this._position; }


	/** @param {Array<float>} value */
	set rotation(value) {
		if (!Array.isArray(value) || value.length != DEFAULT_TRANSFORM.rotation.length) {
			console.warn("[transform] Attempt to assign ", typeof(value), " as position");
			return;
		}

		this._rotation = value;
		this.dirty_flags = true;
	}
	get rotation() { return this._rotation; }

	/** @param {Array<float>} value */
	set scale(value) {
		if (!Array.isArray(value) || value.length != DEFAULT_TRANSFORM.scale.length) {
			console.warn("[transform] Attempt to assign ", typeof(value), " as position");
			return;
		}

		this._scale = value;
		this.dirty_flags = true;
	}
	get scale() { return this._scale; }
};
