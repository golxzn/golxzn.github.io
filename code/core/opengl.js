
const display = document.getElementById("display");
const gl = display.getContext("webgl2", {
	antialias: true,
	powerPreference: "low-power", // Could be "default", "high-performance", and "low-power"
	preserveDrawingBuffer: true,
});
