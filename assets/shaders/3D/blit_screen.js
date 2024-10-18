
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
in vec2 f_uv;
out vec4 frag_color;

#define WEIGHTS_COUNT 5

uniform float u_exposure;

uniform sampler2D u_screen;
uniform sampler2D u_bloom;

vec3 tone_mapping(vec3 color, float exposure) {
	return vec3(1.0) - exp(-color * exposure);
}

vec3 gamma_correction(vec3 color) {
	const float gamma = 1.0 / 2.2;
	return pow(color, vec3(gamma));
}

void main() {
    vec3 color = texture(u_screen, f_uv).rgb + texture(u_bloom, f_uv).rgb;// + bloom(u_bloom, u_direction, u_weights);
	color = tone_mapping(color, u_exposure);
	// color = gamma_correction(color);
	frag_color = vec4(color, 1.0);
}
`

} });


