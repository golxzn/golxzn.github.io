'use strict';

const display = document.getElementById("display");
const gl = display.getContext("webgl2", {
	antialias: SETTINGS.antialias,
	powerPreference: SETTINGS.powerPreference, // Could be "default", "high-performance", and "low-power"
	preserveDrawingBuffer: true,
});
