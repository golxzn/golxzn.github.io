
const APPEAR_DURATION    = 0.75;
const DISAPPEAR_DURATION = 0.75;
const LOADING_SPEED      = 2.0;

const PRELOAD_TEXTURES = [
	{ path: "assets/textures/asphalt.jpg", sampler: DEFAULT_SAMPLER },
	{ path: "assets/textures/lain.jpg", sampler: DEFAULT_SAMPLER },
	{ path: "assets/models/street-lamp-pillar/pillar_diffuse.png", sampler: DEFAULT_SAMPLER },
];
Object.freeze(PRELOAD_TEXTURES);

const PRELOAD_MODELS = [
	// "assets/models/gizmos/gizmos_sphere.gltf",
	"assets/models/sponza/Sponza.gltf",
	"assets/models/ground/ground.gltf",
	"assets/models/water-bottle/WaterBottle.gltf",
	"assets/models/street-lamp-pillar/street-lamp-pillar.gltf",
	"assets/models/alpha-blend-mode-test/AlphaBlendModeTest.gltf",
	"assets/models/logitech-keyboard/Logitech Keyboard.gltf"
];
Object.freeze(PRELOAD_MODELS);


class progress_counter {
	constructor(total) {
		this._total = total;
		this._counter = 0;
	}

	set_total(value) {
		this._total = value;
		this._counter = 0;
	}

	increment() {
		++this._counter;
	}

	progress() {
		return this._counter / this._total;
	}

	done() {
		return this._counter == this._total;
	}
}


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

		this._timer = 0.0;
		this._loading_progress = new progress_counter(PRELOAD_TEXTURES.length + PRELOAD_MODELS.length);
		this._compiling_pipeline_progress = new progress_counter(0);

		this.states = new state_machine({
			[loading_screen.STATE_APPEAR]: new state({
				on_enter: () => {
					this._timer = 0.0;
					this.status_bar.innerHTML = 'figuring out what to do';
				},
				update: (delta) => {
					this._timer += delta;
					this.overlay.style.opacity = this._lerp_time(this._timer, APPEAR_DURATION);
					if (this._timer >= APPEAR_DURATION) {
						return loading_screen.STATE_RESOURCE_LOADING;
					}
				}
			}),
			[loading_screen.STATE_RESOURCE_LOADING]: new state({
				on_enter: () => {
					this.status_bar.innerHTML = 'loading resources 0%';
					const resources = get_service("resource");
					const increment = (_loaded, _total) => this._loading_progress.increment();

					resources.preload_textures(PRELOAD_TEXTURES, increment);
					resources.preload_models(PRELOAD_MODELS, increment);
				},
				update: (delta) => {
					// TODO: Fix loading! The speed of progress changing should be lerped between next progress
					// to reach it faster!
					const next_progress = this._loading_progress.progress()

					this._progress = Math.min(this._progress + LOADING_SPEED * delta, next_progress);

					// Ensure we don't exceed the next progress
					if (Math.abs(this._progress - next_progress) < 0.01) {
						this._progress = next_progress; // Snap to the target if very close
					}

					const percentage = Math.floor(this._progress * 100);
					this.progress_bar.style.width = `${percentage}%`;
					this.status_bar.innerHTML = `loading resources ${percentage}%`;

					if (percentage >= 100) {
						return loading_screen.STATE_PIPELINE_COMPILATION;
					}
				}
			}),
			[loading_screen.STATE_PIPELINE_COMPILATION]: new state({
				on_enter: () => {
					this.status_bar.innerHTML = 'compiling shaders';
					var pipelines_count = 0;
					for (const dimension of Object.keys(SHADERS)) {
						pipelines_count += Object.keys(SHADERS[dimension]).length
					}
					this._compiling_pipeline_progress.set_total(pipelines_count);

					new Promise((resolve, reject) => {
						const pipeline_service = get_service("pipeline");

						for (const dimension of Object.keys(SHADERS)) {
							for (const shader of Object.keys(SHADERS[dimension])) {
								pipeline_service.load(dimension, shader);
								this._compiling_pipeline_progress.increment();
							}
						}
						resolve();
					});
				},
				update: (delta) => {
					if (this._compiling_pipeline_progress.done()) {
						return loading_screen.STATE_DISAPPEAR;
					}
				}
			}),
			[loading_screen.STATE_DISAPPEAR]: new state({
				on_enter: () => {
					this._timer = 0.0;
					this.status_bar.innerHTML = 'starting the game';
				},
				update: (delta) => {
					this._timer += delta;
					this.overlay.style.opacity = 1.0 - this._lerp_time(this._timer, DISAPPEAR_DURATION);
					if (this._timer >= DISAPPEAR_DURATION) {
						return loading_screen.STATE_FINISHED;
					}
				}
			}),
			[loading_screen.STATE_FINISHED]: new state(),

		}, loading_screen.STATE_APPEAR, state_listener);
	}

	update(delta) {
		this.states.update(delta);
	}

	_lerp_time(timer, max_time) {
		return golxzn.math.lerp(0.0, 1.0, timer / max_time)
	}
}