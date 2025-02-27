
const POWER_PREFERENCE = {
	DEFAULT: "default",
	HIGH_PERFORMANCE: "high-performance",
	LOW_POWER: "low-power"
};
Object.freeze(POWER_PREFERENCE);

const SETTINGS = {
	graphics: {
		exposure: 0.5,
		antialias: true,
		power_preference: POWER_PREFERENCE.HIGH_PERFORMANCE,
		shadow_resolution: [1024, 1024],
		clear_color: [0.01, 0.014, 0.022, 1.0],
		render_scale: 0.75,
		bloom: {
			direction: [1.0, 1.0],
			weights: [0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216]
		}
	}
};
