
const UTILS = {
	get_random: function(from, to) {
		return (Math.random() * (to - from)) + from;
	},

	is_mobile: function() {
		return /android|iphone|kindle|ipad/i.test(navigator.userAgent)
	}
};

Object.assign(golxzn, UTILS);
