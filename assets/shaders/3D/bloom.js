
const COMMON_BLOOM_VERTEX_SHADER_CODE = /* glsl */ `#version 300 es

layout(location = 0) in vec2 a_position;

out vec2 f_uv;

void main() {
	gl_Position = vec4(a_position, 0.0, 1.0);
	f_uv = (a_position + vec2(1.0)) * 0.5;
}
`;

Object.assign(SHADERS["3D"], { BLOOM : {

vert : COMMON_BLOOM_VERTEX_SHADER_CODE,

frag : /* glsl */ `#version 300 es
precision mediump float;

#define WEIGHTS_COUNT 5

in vec2 f_uv;

layout(location = 0) out vec4 frag_color;

uniform vec2      u_direction;
uniform float     u_weights[WEIGHTS_COUNT];
uniform sampler2D u_bloom;

float rand(vec2 co){
	return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec4 calc_bloom(sampler2D tex, vec2 dir, float weights[WEIGHTS_COUNT]) {
	vec2 pixel_size = 1.0 / vec2(textureSize(tex, 0));
	vec3 result = texture(tex, f_uv).rgb * weights[0];
	for(int i = 1; i < WEIGHTS_COUNT; ++i) {
		vec2 offset = pixel_size * vec2(i);
		float noise = (rand(offset) - 0.5) * 0.001;
		result += dir.x * (texture(tex, f_uv + vec2(offset.x, noise)).rgb * weights[i]);
		noise = (rand(result.xy) - 0.5) * 0.001;
		result += dir.x * (texture(tex, f_uv - vec2(offset.x, noise)).rgb * weights[i]);
		noise = (rand(result.xy) - 0.5) * 0.001;
		result += dir.y * (texture(tex, f_uv + vec2(noise, offset.y)).rgb * weights[i]);
		noise = (rand(result.xy) - 0.5) * 0.001;
		result += dir.y * (texture(tex, f_uv - vec2(noise, offset.y)).rgb * weights[i]);
	}
	return vec4(result, 1.0);
}

void main() {
	frag_color = calc_bloom(u_bloom, u_direction, u_weights);
}
`

}, BLOOM_HORIZONTAL: {

vert: COMMON_BLOOM_VERTEX_SHADER_CODE,
frag: /* glsl */ `#version 300 es
precision mediump float;

#define WEIGHTS_COUNT 5

in vec2 f_uv;

layout(location = 0) out vec4 frag_color;

uniform float     u_direction;
uniform float     u_weights[WEIGHTS_COUNT];
uniform sampler2D u_bloom;

vec4 calc_bloom(sampler2D tex, float dir, float weights[WEIGHTS_COUNT]) {
	vec2 pixel_size = 1.0 / vec2(textureSize(tex, 0));
	vec3 result = texture(tex, f_uv).rgb * weights[0];
	for(int i = 1; i < WEIGHTS_COUNT; ++i) {
		vec2 offset = pixel_size * vec2(i);
		result +=
			dir * (texture(tex, f_uv + vec2(offset.x, 0.0)).rgb * weights[i]) +
			dir * (texture(tex, f_uv - vec2(offset.x, 0.0)).rgb * weights[i])
		;
	}
	return vec4(result, 1.0);
}

void main() {
	frag_color = calc_bloom(u_bloom, u_direction, u_weights);
}
`

}, BLOOM_VERTICAL: {

vert: COMMON_BLOOM_VERTEX_SHADER_CODE,
frag: /* glsl */ `#version 300 es
precision mediump float;

#define WEIGHTS_COUNT 5

in vec2 f_uv;

layout(location = 0) out vec4 frag_color;

uniform float     u_direction;
uniform float     u_weights[WEIGHTS_COUNT];
uniform sampler2D u_bloom;

vec4 calc_bloom(sampler2D tex, float dir, float weights[WEIGHTS_COUNT]) {
	vec2 pixel_size = 1.0 / vec2(textureSize(tex, 0));
	vec3 result = texture(tex, f_uv).rgb * weights[0];
	for(int i = 1; i < WEIGHTS_COUNT; ++i) {
		vec2 offset = pixel_size * vec2(i);
		result +=
			dir * (texture(tex, f_uv + vec2(0.0, offset.y)).rgb * weights[i]) +
			dir * (texture(tex, f_uv - vec2(0.0, offset.y)).rgb * weights[i])
		;
	}
	return vec4(result, 1.0);
}

void main() {
	frag_color = calc_bloom(u_bloom, u_direction, u_weights);
}
`

} });

