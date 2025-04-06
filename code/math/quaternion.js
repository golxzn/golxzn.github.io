Object.assign(golxzn.math, {
	quat: {
		make() {
			return [0.0, 0.0, 0.0, 1.0];
		},

		/** @param {number[3]} euler - [roll, pitch, yaw] */
		from_euler(euler) {
			const roll = euler[0] * 0.5;
			const pitch = euler[1] * 0.5;
			const yaw = euler[2] * 0.5;
			const cr = Math.cos(roll),  sr = Math.sin(roll);
			const cp = Math.cos(pitch), sp = Math.sin(pitch);
			const cy = Math.cos(yaw),   sy = Math.sin(yaw);

			return [
				sr * cp * cy - cr * sp * sy,
				cr * sp * cy + sr * cp * sy,
				cr * cp * sy - sr * sp * cy,
				cr * cp * cy + sr * sp * sy
			]
		},

		/** @param {number[4]} quaternion - [x, y, z, w] */
		to_euler(quaternion) {
			/// @todo Maybe there's more efficient algorithm to do so
			const [x, y, z, w] = quaternion;
			const yy = y * y;
			const wy_xz2 = 2.0 * (w * y - x * z)
			return [
				Math.atan2(2.0 * (w * x + y * z), 1.0 - 2.0 * (x * x + yy)),
				2.0 * Math.atan2(Math.sqrt(1.0 + wy_xz2), Math.sqrt(1.0 - wy_xz2)) - Math.PI * 0.5,
				Math.atan2(2.0 * (w * z + x * y), 1.0 - 2.0 * (yy + z * z))
			];
		}
	}
});
