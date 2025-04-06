
Object.assign(golxzn.math, {
	mat4 : {
		identity : function() {
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

		set_translation : function(matrix, offset) {
			matrix[12] = offset[0];
			matrix[13] = offset[1];
			matrix[14] = offset[2];
			return matrix;
		},

		scale : function(matrix, scale) {
			matrix[0] *= scale[0];
			matrix[5] *= scale[1];
			matrix[10] *= scale[2];
			return matrix;
		},

		set_scale : function(matrix, scale) {
			matrix[0] = scale[0];
			matrix[5] = scale[1];
			matrix[10] = scale[2];
			return matrix;
		},

		inverse: function(m) {
			// Calculate the determinant of the matrix
			const det = m[0] * (
				m[5] * (m[10] * m[15] - m[14] * m[11]) -
				m[9] * (m[6] * m[15] - m[14] * m[7]) +
				m[13] * (m[6] * m[11] - m[10] * m[7])
			) - m[1] * (
				m[4] * (m[10] * m[15] - m[14] * m[11]) -
				m[8] * (m[6] * m[15] - m[14] * m[7]) +
				m[12] * (m[6] * m[11] - m[10] * m[7])
			) + m[2] * (
				m[4] * (m[9] * m[15] - m[13] * m[11]) -
				m[8] * (m[5] * m[15] - m[13] * m[7]) +
				m[12] * (m[5] * m[11] - m[9] * m[7])
			) - m[3] * (
				m[4] * (m[9] * m[14] - m[13] * m[10]) -
				m[8] * (m[5] * m[14] - m[13] * m[6]) +
				m[12] * (m[5] * m[10] - m[9] * m[6])
			);

			// If determinant is 0, the matrix is not invertible
			if (det == 0) {
				return this.identity();
			}

			const inverted_det = 1.0 / det;
			return [
				+(m[5] * (m[10] * m[15] - m[14] * m[11]) - m[9] * (m[6] * m[15] - m[14] * m[7]) + m[13] * (m[6] * m[11] - m[10] * m[7])) * inverted_det,
				-(m[1] * (m[10] * m[15] - m[14] * m[11]) - m[9] * (m[2] * m[15] - m[14] * m[3]) + m[13] * (m[2] * m[11] - m[10] * m[3])) * inverted_det,
				+(m[1] * (m[6] * m[15] - m[14] * m[7]) - m[5] * (m[2] * m[15] - m[14] * m[3]) + m[13] * (m[2] * m[7] - m[6] * m[3])) * inverted_det,
				-(m[1] * (m[6] * m[11] - m[10] * m[7]) - m[5] * (m[2] * m[11] - m[10] * m[3]) + m[9] * (m[2] * m[7] - m[6] * m[3])) * inverted_det,

				-(m[4] * (m[10] * m[15] - m[14] * m[11]) - m[8] * (m[6] * m[15] - m[14] * m[7]) + m[12] * (m[6] * m[11] - m[10] * m[7])) * inverted_det,
				+(m[0] * (m[10] * m[15] - m[14] * m[11]) - m[8] * (m[2] * m[15] - m[14] * m[3]) + m[12] * (m[2] * m[11] - m[10] * m[3])) * inverted_det,
				-(m[0] * (m[6] * m[15] - m[14] * m[7]) - m[4] * (m[2] * m[15] - m[14] * m[3]) + m[12] * (m[2] * m[7] - m[6] * m[3])) * inverted_det,
				+(m[0] * (m[6] * m[11] - m[10] * m[7]) - m[4] * (m[2] * m[11] - m[10] * m[3]) + m[8] * (m[2] * m[7] - m[6] * m[3])) * inverted_det,

				+(m[4] * (m[9] * m[15] - m[13] * m[11]) - m[8] * (m[5] * m[15] - m[13] * m[7]) + m[12] * (m[5] * m[11] - m[9] * m[7])) * inverted_det,
				-(m[0] * (m[9] * m[15] - m[13] * m[11]) - m[8] * (m[1] * m[15] - m[13] * m[3]) + m[12] * (m[1] * m[11] - m[9] * m[3])) * inverted_det,
				+(m[0] * (m[5] * m[15] - m[13] * m[7]) - m[4] * (m[1] * m[15] - m[13] * m[3]) + m[12] * (m[1] * m[7] - m[5] * m[3])) * inverted_det,
				-(m[0] * (m[5] * m[11] - m[9] * m[7]) - m[4] * (m[1] * m[11] - m[9] * m[3]) + m[8] * (m[1] * m[7] - m[5] * m[3])) * inverted_det,

				-(m[4] * (m[9] * m[14] - m[13] * m[10]) - m[8] * (m[5] * m[14] - m[13] * m[6]) + m[12] * (m[5] * m[10] - m[9] * m[6])) * inverted_det,
				+(m[0] * (m[9] * m[14] - m[13] * m[10]) - m[8] * (m[1] * m[14] - m[13] * m[2]) + m[12] * (m[1] * m[10] - m[9] * m[2])) * inverted_det,
				-(m[0] * (m[5] * m[14] - m[13] * m[6]) - m[4] * (m[1] * m[14] - m[13] * m[2]) + m[12] * (m[1] * m[6] - m[5] * m[2])) * inverted_det,
				+(m[0] * (m[5] * m[10] - m[9] * m[6]) - m[4] * (m[1] * m[10] - m[9] * m[2]) + m[8] * (m[1] * m[6] - m[5] * m[2])) * inverted_det,
			];
		},

		transpose: function(m) {
			return [
				m[0], m[4], m[ 8], m[12],
				m[1], m[5], m[ 9], m[13],
				m[2], m[6], m[10], m[14],
				m[3], m[7], m[11], m[15]
			];
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

		from_quaternion(quaternion) {
			const x = quaternion[0];
			const y = quaternion[1];
			const z = quaternion[2];
			const w = quaternion[3];

			const xx = x * x, yy = y * y, zz = z * z;
			const xy = x * y, xz = x * z, xw = x * w;
			const yz = y * z, yw = y * w, zw = z * w;

			return [
				1 - 2 * (yy + zz), 2 * (xy + zw),     2 * (xz - yw),     0,
				2 * (xy - zw),     1 - 2 * (xx + zz), 2 * (yz + xw),     0,
				2 * (xz + yw),     2 * (yz - xw),     1 - 2 * (xx + yy), 0,
				0,                 0,                 0,                 1
			];
		},

		look_at(eye, center, up) {
			const f = golxzn.math.normalize(golxzn.math.sub(center, eye));
			const s = golxzn.math.normalize(golxzn.math.vec3.cross(f, up));
			const u = golxzn.math.vec3.cross(s, f);
			const dot = golxzn.math.dot;
			return [
				s[0], u[0], -f[0], 0.0,
				s[1], u[1], -f[1], 0.0,
				s[2], u[2], -f[2], 0.0,
				-dot(s, eye), -dot(u, eye), dot(f, eye), 1.0
			]
		},

		multiply_vec4(m, v) {
			return [
				m[ 0] * v[0] + m[ 1] * v[1] + m[ 2] * v[2] + m[ 3] * v[3],
				m[ 4] * v[0] + m[ 5] * v[1] + m[ 6] * v[2] + m[ 7] * v[3],
				m[ 8] * v[0] + m[ 9] * v[1] + m[10] * v[2] + m[11] * v[3],
				m[12] * v[0] + m[13] * v[1] + m[14] * v[2] + m[15] * v[3]
			];
		}
	},

	mat3 : {
		identity : function() {
			return [
				1.0, 0.0, 0.0,
				0.0, 1.0, 0.0,
				0.0, 0.0, 1.0
			]
		},

		build_from : function(m) {
			return [
				m[0], m[1], m[2],
				m[4], m[5], m[6],
				m[8], m[9], m[10]
			]
		},

		inverse: function(m) {
			const det =
				m[0] * (m[4] * m[8] - m[5] * m[7]) -
				m[1] * (m[3] * m[8] - m[5] * m[6]) +
				m[2] * (m[3] * m[7] - m[4] * m[6]);

			if (det === 0) {
				return this.identity(); // Return identity matrix if not invertible
			}

			const invdet = 1.0 / det;
			return [
				(m[4] * m[8] - m[5] * m[7]) * invdet,
				(m[2] * m[7] - m[1] * m[8]) * invdet,
				(m[1] * m[5] - m[2] * m[4]) * invdet,
				(m[5] * m[6] - m[3] * m[8]) * invdet,
				(m[0] * m[8] - m[2] * m[6]) * invdet,
				(m[3] * m[2] - m[0] * m[5]) * invdet,
				(m[3] * m[7] - m[6] * m[4]) * invdet,
				(m[6] * m[1] - m[0] * m[7]) * invdet,
				(m[0] * m[4] - m[3] * m[1]) * invdet,
			];
		},

		transpose: function(m) {
			return [
				m[0], m[3], m[6],
				m[1], m[4], m[7],
				m[2], m[5], m[8]
			];
		},


		multiply_vec3 : function(m, v) {
			return [
				m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
				m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
				m[6] * v[0] + m[7] * v[1] + m[8] * v[2]
			];
		}
	}
});
