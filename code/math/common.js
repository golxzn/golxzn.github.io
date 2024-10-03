const TO_RADIANS = Math.PI / 180.0;

let golxzn = { math : {
	clamp : function(value, from, to) {
		return Math.min(Math.max(value, from), to);
	},

	lerp : function(from, to, progress) {
		return from * (1.0 - progress) + progress * to
	},

	to_radians: function(value) {
		return value * TO_RADIANS;
	}
} };
