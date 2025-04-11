
const UTILS = {
	get_random: function(from, to) {
		return (Math.random() * (to - from)) + from;
	},

	is_mobile: function() {
		return /android|iphone|kindle|ipad/i.test(navigator.userAgent)
	},

	string_hash: (string) => {
		if (string.length == 0) return 0;

		let hash = 0;
		for (var i = 0; i < string.length; i++) {
			hash = ((hash << 5) - hash) + string.charCodeAt(i);
			hash &= hash;
		}

		return hash;
	},

	/** @param {String[]} strings */
	strings_hash: (strings) => {
		let hash = 0;
		for (const string of strings) {
			hash ^= UTILS.string_hash(string);
		}
		return hash;
	},

	within_range: (array, id) => {
		return id >= 0 && id < array.length;
	},

	any_of(value, ...args) { return value in args },
	none_of(value, ...args) { return !this.any_of(value, args); },
	all_of(value, ...args) {
		for (const arg of args) {
			if (value != arg) return false;
		}
		return true;
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

