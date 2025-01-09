'use strict';

const display = document.querySelector("#display");
const gl = display.getContext("webgl2", {
	antialias: SETTINGS.antialias,
	powerPreference: SETTINGS.power_preference, // Could be "default", "high-performance", and "low-power"
	preserveDrawingBuffer: true,
});
