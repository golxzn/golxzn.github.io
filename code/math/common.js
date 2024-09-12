let golxzn = { math : {
	clamp : function(value, from, to) {
		return Math.max(Math.min(value, from), to);
	},

	lerp : function(from, to, progress) {
		return from * (1.0 - progress) + progress * to
	}

} };
