
Object.assign(SHADERS["3D"], { BLIT_SCREEN : {

vert: /* glsl */ `#version 300 es
#pragma vscode_glsllint_stage: vert
layout(location = 0) in vec2 a_position;

out vec2 f_uv;

void main() {
	gl_Position = vec4(a_position, 0.0, 1.0);
	f_uv = (a_position + vec2(1.0)) * 0.5;
}
`,




frag: /* glsl */ `#version 300 es
#pragma vscode_glsllint_stage: frag
precision mediump float;

in vec2 f_uv;
out vec4 frag_color;

#define WEIGHTS_COUNT 5

uniform sampler2D u_screen;
uniform sampler2D u_bloom;

void main() {
	frag_color = vec4(texture(u_screen, f_uv).rgb + texture(u_bloom, f_uv).rgb, 1.0);
}
`

} });


