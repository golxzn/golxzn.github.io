Object.assign(golxzn.math, {
	vec3 : {
		cross : function(lhv, rhv) {
			return [
				lhv[1] * rhv[2] - lhv[2] * rhv[1],
				lhv[2] * rhv[0] - lhv[0] * rhv[2],
				lhv[0] * rhv[1] - lhv[1] * rhv[0]
			];
		}
	},

	length_squared : function(vector) {
		var result = 0.0;
		for (var i = 0; i < vector.length; i++) {
			result += vector[i] * vector[i];
		}
		return result;
	},

	length : function(vector) {
		return Math.sqrt(this.length_squared(vector));
	},


	scale : function(vector, scalar) {
		var result = Array(vector.length).fill(0.0);
		for (var i = 0; i < vector.length; i++) {
			result[i] = vector[i] * scalar;
		}
		return result;
	},

	normalize : function(vector) {
		const flipped_vector_length = 1.0 / this.length(vector);
		return this.scale(vector, flipped_vector_length);
	},

	sub : function(lhv, rhv) {
		var result = Array(lhv.length).fill(0.0);
		for (var i = 0; i < lhv.length; i++) {
			result[i] = lhv[i] - rhv[i];
		}
		return result;
	},

	sum : function(lhv, rhv) {
		var result = Array(lhv.length).fill(0.0);
		for (var i = 0; i < lhv.length; i++) {
			result[i] = lhv[i] + rhv[i];
		}
		return result;
	},

	multiply : function(lhv, rhv) {
		var result = Array(lhv.length).fill(0.0);
		for (var i = 0; i < lhv.length; i++) {
			result[i] = lhv[i] * rhv[i];
		}
		return result;
	},

	dot : function(lhv, rhv) {
		var sum = 0.0;
		for (var i = 0; i < lhv.length; i++) {
			sum += lhv[i] * rhv[i];
		}
		return sum;
	}
});
