'use strict';

const context_settings = {
	alpha: true,
	depth: true,
	stencil: true,
	colorSpace: "srgb",
	desynchronized: true,
	antialias: SETTINGS.antialias,
	powerPreference: SETTINGS.power_preference, // Could be "default", "high-performance", and "low-power"
	preserveDrawingBuffer: true,
};
Object.freeze(context_settings);

const RECORDS_BUFFER_SIZE = 40;
var RECORDS_BUFFER = [];

function format_call(functionName, args) {
	return `gl.${functionName}(${WebGLDebugUtils.glFunctionArgsToString(functionName, args)})`;
}

function logGLCall(functionName, args) {
	if (RECORDS_BUFFER.length == RECORDS_BUFFER_SIZE) RECORDS_BUFFER.shift();
	RECORDS_BUFFER.push(format_call(functionName, args));
}

function logOnError(err, funcName, args) {
	console.log('-------------------------------------------------');
	RECORDS_BUFFER.pop();
	RECORDS_BUFFER.forEach((record) => console.log(record));
	console.error(`[${WebGLDebugUtils.glEnumToString(err)}]`, format_call(funcName, args));
}

const display = document.querySelector("#display");
const gl = SETTINGS.debug_mode
	? WebGLDebugUtils.makeDebugContext(display.getContext("webgl2", context_settings), logOnError, logGLCall)
	: display.getContext("webgl2", context_settings)
;


gl.getExtension("EXT_color_buffer_float");

