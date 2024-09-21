
const APPEAR_DURATION    = 0.75;
const DISAPPEAR_DURATION = 0.75;

const PRELOAD_TEXTURES = [
	"assets/textures/asphalt.jpg",
	"assets/textures/lain.jpg"
];

class loading_screen {
	static STATE_APPEAR               = 0;
	static STATE_RESOURCE_LOADING     = 1;
	static STATE_PIPELINE_COMPILATION = 2;
	static STATE_DISAPPEAR            = 3;
	static STATE_FINISHED             = 4;

	constructor(state_listener) {
		this.overlay = document.querySelector("#overlay");
		this.overlay.style.opacity = 0.0;

		this.progress_bar = this.overlay.querySelector(".progress");
		this.status_bar = this.overlay.querySelector("#status-bar");

		this._progress = 0.0;
		this._next_progress = 0.0;

		this._timer = 0.0;
		this._texture_promises = [];

		this.states = {
			[loading_screen.STATE_APPEAR]: (delta) => {
				state_listener(loading_screen.STATE_APPEAR);
				this.status_bar.innerHTML = 'figuring out what to do';
				this._timer += delta;
				this.overlay.style.opacity = this._lerp_time(this._timer, APPEAR_DURATION);
				if (this._timer >= APPEAR_DURATION) {
					this.current_state = loading_screen.STATE_RESOURCE_LOADING;
					this._timer = 0.0;
				}
			},
			[loading_screen.STATE_RESOURCE_LOADING]: (delta) => {
				state_listener(loading_screen.STATE_RESOURCE_LOADING);
				this.status_bar.innerHTML = 'loading resources 0%';
				this._process_resource_loading_state(delta)
			},
			[loading_screen.STATE_PIPELINE_COMPILATION]: (delta) => {
				state_listener(loading_screen.STATE_PIPELINE_COMPILATION);
				this.status_bar.innerHTML = 'compiling shaders';
				this._process_pipeline_compiling_state()
			},
			[loading_screen.STATE_DISAPPEAR]: (delta) => {
				state_listener(loading_screen.STATE_DISAPPEAR);
				this.status_bar.innerHTML = 'starting the game';
				this._timer += delta;
				this.overlay.style.opacity = 1.0 - this._lerp_time(this._timer, DISAPPEAR_DURATION);
				if (this._timer >= DISAPPEAR_DURATION) {
					this.current_state = loading_screen.STATE_FINISHED;
				}
			},
			[loading_screen.STATE_FINISHED]: (_) => {
				state_listener(loading_screen.STATE_FINISHED);
			}
		};
		this.current_state = loading_screen.STATE_APPEAR;

	}

	update(delta) {
		this.states[this.current_state](delta);
	}

	_process_resource_loading_state(delta) {
		if (this._texture_promises.length == 0) {
			this._texture_promises = get_service("resource").preload_textures(
				PRELOAD_TEXTURES, (loaded, total) => {
					this._next_progress = loaded / total;
				}
			);
			if (this._texture_promises.length == 0) {
				throw new Error("No resources found!");
			}
		}

		// TODO: Fix loading! The speed of progress changing should be lerped between next progress
		// to reach it faster!
		// this._progress = Math.min(this._progress + delta, this._next_progress);

		// Calculate the distance to the next progress
		const distance = this._next_progress - this._progress;

		// Determine a speed factor based on the distance
		// You can adjust the multiplier to control the speed
		const speed_factor = Math.max(0.1, Math.abs(distance)); // Minimum speed factor to avoid being too slow
		const speed = Math.min(delta * speed_factor, Math.abs(distance)); // Ensure we don't overshoot

		// Update the progress smoothly
		this._progress += speed * Math.sign(distance);


		// Ensure we don't exceed the next progress
		if (Math.abs(this._progress - this._next_progress) < 0.01) {
			this._progress = this._next_progress; // Snap to the target if very close
		}

		const percentage = Math.floor(this._progress * 100);
		this.progress_bar.style.width = `${percentage}%`;
		this.status_bar.innerHTML = `loading resources ${percentage}%`;

		if (percentage >= 100) {
			this.current_state = loading_screen.STATE_PIPELINE_COMPILATION;
		}
	}

	_process_pipeline_compiling_state(delta) {
		const pipeline_service = get_service("pipeline");

		for (const dimension of Object.keys(SHADERS)) {
			for (const shader of Object.keys(SHADERS[dimension])) {
				pipeline_service.load(dimension, shader);
			}
		}

		this.current_state = loading_screen.STATE_DISAPPEAR;
	}

	_lerp_time(timer, max_time) {
		return golxzn.math.lerp(0.0, 1.0, timer / max_time)
	}
}