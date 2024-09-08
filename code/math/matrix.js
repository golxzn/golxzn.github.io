
Object.assign(golxzn.math, {
	mat4 : {
		make_identity : function() {
			return [
				1.0, 0.0, 0.0, 0.0,
				0.0, 1.0, 0.0, 0.0,
				0.0, 0.0, 1.0, 0.0,
				0.0, 0.0, 0.0, 1.0
			]
		},

		translate : function(matrix, offset) {
			matrix[12] += offset[0];
			matrix[13] += offset[1];
			matrix[14] += offset[2];
			return matrix;
		},

		multiply : function (lhm, rhm) {
			return [
				// Row 1
				lhm[0] * rhm[0] + lhm[1] * rhm[4] + lhm[2] * rhm[8] + lhm[3] * rhm[12],
				lhm[0] * rhm[1] + lhm[1] * rhm[5] + lhm[2] * rhm[9] + lhm[3] * rhm[13],
				lhm[0] * rhm[2] + lhm[1] * rhm[6] + lhm[2] * rhm[10] + lhm[3] * rhm[14],
				lhm[0] * rhm[3] + lhm[1] * rhm[7] + lhm[2] * rhm[11] + lhm[3] * rhm[15],

				// Row 2
				lhm[4] * rhm[0] + lhm[5] * rhm[4] + lhm[6] * rhm[8] + lhm[7] * rhm[12],
				lhm[4] * rhm[1] + lhm[5] * rhm[5] + lhm[6] * rhm[9] + lhm[7] * rhm[13],
				lhm[4] * rhm[2] + lhm[5] * rhm[6] + lhm[6] * rhm[10] + lhm[7] * rhm[14],
				lhm[4] * rhm[3] + lhm[5] * rhm[7] + lhm[6] * rhm[11] + lhm[7] * rhm[15],

				// Row 3
				lhm[8] * rhm[0] + lhm[9] * rhm[4] + lhm[10] * rhm[8] + lhm[11] * rhm[12],
				lhm[8] * rhm[1] + lhm[9] * rhm[5] + lhm[10] * rhm[9] + lhm[11] * rhm[13],
				lhm[8] * rhm[2] + lhm[9] * rhm[6] + lhm[10] * rhm[10] + lhm[11] * rhm[14],
				lhm[8] * rhm[3] + lhm[9] * rhm[7] + lhm[10] * rhm[11] + lhm[11] * rhm[15],

				// Row 4
				lhm[12] * rhm[0] + lhm[13] * rhm[4] + lhm[14] * rhm[8] + lhm[15] * rhm[12],
				lhm[12] * rhm[1] + lhm[13] * rhm[5] + lhm[14] * rhm[9] + lhm[15] * rhm[13],
				lhm[12] * rhm[2] + lhm[13] * rhm[6] + lhm[14] * rhm[10] + lhm[15] * rhm[14],
				lhm[12] * rhm[3] + lhm[13] * rhm[7] + lhm[14] * rhm[11] + lhm[15] * rhm[15]
			];
		},

		rotate : function(matrix, angle_radian, axis_vector) {
			const c = Math.cos(angle_radian);
			const s = Math.sin(angle_radian);

			const a = golxzn.math.normalize(axis_vector);
			const t = golxzn.math.scale(a, 1.0 - c);

			const rotate_matrix = [
				c + t[0] * a[0],           t[0] * a[1] + s * a[2],    t[0] * a[2] - s * a[1], 0.0,
				t[1] * a[0] - s * a[2],    c + t[1] * a[1],           t[1] * a[2] + s * a[0], 0.0,
				t[2] * a[0] + s * a[1],    t[2] * a[1] - s * a[0],    c + t[2] * a[2],        0.0,
				0.0, 0.0, 0.0, 1.0
			]

			return this.multiply(matrix, rotate_matrix);
		},

		make_orthographic : function(left, right, bottom, top, near, far) {
			const width = right - left;
			const height = top - bottom;
			const depth = far - near;

			return [
				2.0 / width,          0.0,          0.0, -(right + left) / height,
						0.0, 2.0 / height,          0.0, -(top + bottom) / height,
						0.0,          0.0, -2.0 / depth, -(far + near) / depth,
						0.0,          0.0,          0.0, 1.0
			];
		},

		make_perspective : function(fov, aspect, near, far) {
			const f = 1.0 / Math.tan(fov / 2.0); // Cotangent of half FOV
			const invert_range = 1.0 / (near - far);

			return [
				f / aspect, 0.0,                             0.0,  0.0,
					0.0,   f,                             0.0,  0.0,
					0.0, 0.0,     (near + far) * invert_range, -1.0,
					0.0, 0.0, 2.0 * near * far * invert_range,  0.0
			];
		},
	}
});
