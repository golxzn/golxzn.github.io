
const UTILS = {
	get_random: function(from, to) {
		return (Math.random() * (to - from)) + from;
	},

	is_mobile: function() {
		return /android|iphone|kindle|ipad/i.test(navigator.userAgent)
	}
};

Object.assign(golxzn, UTILS);

class optional {
	constructor(value) {
		this._value = value;
	}

	value() {
		return this._value;
	}

	value_or(other) {
		return this._value || other;
	}

	has_value() {
		return this._value != null;
	}

	and_then(func) {
		return this.has_value() ? new optional(func(this._value)) : this;
	}

	or_else(func) {
		return this.has_value() ? this : new optional(func());
	}
};

const nullopt = new optional(null);
Object.freeze(nullopt);

