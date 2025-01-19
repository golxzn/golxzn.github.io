const DEFAULT_CALLBACKS = {
	update: (_) => {},
	on_enter: () => {},
	on_exit: () => {}
};
Object.freeze(DEFAULT_CALLBACKS);

class state {
	constructor(callbacks = DEFAULT_CALLBACKS) {
		this.update = callbacks.update != null ? callbacks.update : DEFAULT_CALLBACKS.update;
		this.on_enter = callbacks.on_enter != null ? callbacks.on_enter : DEFAULT_CALLBACKS.on_enter;
		this.on_exit = callbacks.on_exit != null ? callbacks.on_enter : DEFAULT_CALLBACKS.on_enter;
	}
};

class state_machine {
	constructor(states = {}, current_state = null, listener = null) {
		this._states = states;
		this._listener = listener;
		this._current_state = current_state;

		if (this._current_state != null) {
			this._set_state(current_state, true);
		}
	}

	change_state(state_id) {
		this._set_state(state_id);
	}

	current_state() {
		return this._current_state in this._states ? this._states[this._current_state] : null;
	}

	update(delta) {
		const result = this.current_state().update(delta)
		if (result != null) {
			this.change_state(result);
		}
	}



	_set_state(state_id, initial = false) {
		if (state_id == this._current_state) return;
		if (!(state_id in this._states)) {
			console.error(`[state_machine] State ${state_id} does not exist!`);
			return;
		}

		if (!initial) this._safe_on_exit();
		this._current_state = state_id;
		this._safe_on_enter();

		if (this._listener != null) {
			this._listener(state_id);
		}
	}

	_safe_on_enter() {
		const state = this.current_state();
		if (state != null && state.on_enter != null) {
			this.current_state().on_enter();
		}
	}

	_safe_on_exit() {
		const state = this.current_state();
		if (state != null && state.on_exit != null) {
			this.current_state().on_exit();
		}
	}
};