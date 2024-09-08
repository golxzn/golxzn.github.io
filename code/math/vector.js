let golxzn = {
	math : {}
};

Object.assign(golxzn.math, {
	vec3 : {

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

});
