
Object.assign(SHADERS["3D"], { BLIT_SCREEN : {

vert: /* glsl */ `#version 300 es
layout(location = 0) in vec2 a_position;

out vec2 f_uv;

void main() {
	gl_Position = vec4(a_position, 0.0, 1.0);
	f_uv = (a_position + vec2(1.0)) * 0.5;
}
`,




frag: /* glsl */ `#version 300 es
precision mediump float;

const float GAMMA = 2.2;

in vec2 f_uv;
out vec4 frag_color;

uniform float     u_exposure;
uniform sampler2D u_screen;
uniform sampler2D u_bloom;

vec3 tone_mapping(vec3 color, float exposure) {
	return color / (color + vec3(1.0)); // HDR tone mapping
	// return vec3(1.0) - exp(-color * exposure);
}

vec3 gamma_correction(vec3 color) {
	const float gamma = 1.0 / GAMMA;
	return pow(color, vec3(gamma));
}

void main() {
	vec3 color = texture(u_screen, f_uv).rgb + texture(u_bloom, f_uv).rgb;
	frag_color = vec4(gamma_correction(tone_mapping(color, u_exposure)), 1.0);
}
`

} });


