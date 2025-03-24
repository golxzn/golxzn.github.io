
const DEFAULT_TRANSFORM = {
	matrix: golxzn.math.mat4.make_identity(),
	position: [0.0, 0.0, 0.0],
	rotation: [0.0, 0.0, 0.0, 1.0],
	scale: [1.0, 1.0, 1.0]
};
Object.freeze(DEFAULT_TRANSFORM);

const TRANSFORM_DIRTY = {
	POSITION: (1 << 0),
	ROTATION: (1 << 1),
	SCALE:    (1 << 2),

	EVERYTHING: 0x07
};
Object.freeze(TRANSFORM_DIRTY);

class transform {
	constructor(info = DEFAULT_TRANSFORM) {
		this.matrix = info.matrix || DEFAULT_TRANSFORM.matrix;
		this._position = info.position || DEFAULT_TRANSFORM.position;
		this._rotation = info.rotation || DEFAULT_TRANSFORM.rotation;
		this._scale = info.scale || DEFAULT_TRANSFORM.scale;
		this.dirty_flags = TRANSFORM_DIRTY.EVERYTHING;
	}

	is_dirty() {
		return this.dirty_flags != 0;
	}

	actualize_matrix() {
		const is_set = (flag) => (this.dirty_flags & flag) == flag;
		const m4 = golxzn.math.mat4;

		if (is_set(TRANSFORM_DIRTY.POSITION)) m4.set_translation(this.matrix, this.position);
		/// @todo Rotation
		// if (is_set(TRANSFORM_DIRTY.ROTATION)) m4.set_rotation(this.matrix, this.rotation);
		if (is_set(TRANSFORM_DIRTY.SCALE   )) m4.set_scale(this.matrix, this.scale);

		this.dirty_flags = 0;
	}

	/** @param {Array<float>} value */
	set position(value) {
		if (!Array.isArray(value) || value.length != DEFAULT_TRANSFORM.position.length) {
			console.warn("[transform] Attempt to assign ", typeof(value), " as position");
			return;
		}

		this._position = value;
		this.dirty_flags |= TRANSFORM_DIRTY.POSITION;
	}
	get position() { return this._position; }


	/** @param {Array<float>} value */
	set rotation(value) {
		if (!Array.isArray(value) || value.length != DEFAULT_TRANSFORM.rotation.length) {
			console.warn("[transform] Attempt to assign ", typeof(value), " as position");
			return;
		}

		this._rotation = value;
		this.dirty_flags |= TRANSFORM_DIRTY.ROTATION;
	}
	get rotation() { return this._rotation; }

	/** @param {Array<float>} value */
	set scale(value) {
		if (!Array.isArray(value) || value.length != DEFAULT_TRANSFORM.scale.length) {
			console.warn("[transform] Attempt to assign ", typeof(value), " as position");
			return;
		}

		this._scale = value;
		this.dirty_flags |= TRANSFORM_DIRTY.SCALE;
	}
	get scale() { return this._scale; }
};
