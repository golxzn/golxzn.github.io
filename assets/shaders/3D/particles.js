
Object.assign(SHADERS["3D"], { PARTICLES : {

vert : /* glsl */ `#version 300 es

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_color;
layout(location = 2) in vec2 a_uv;
layout(location = 3) in vec3 a_offset;
layout(location = 4) in vec3 a_scales;
layout(location = 5) in vec3 a_rotations;

out vec2 f_uv;

uniform mat4 u_mvp;

void main() {
	gl_Position = u_mvp * vec4(a_position * a_scales + a_offset, 1.0);
	f_uv = a_uv;
}
`,


frag : /* glsl */ `#version 300 es
precision mediump float;

in vec2 f_uv;

out vec4 frag_color;

uniform sampler2D u_diffuse;

void main() {
	frag_color = texture(u_diffuse, f_uv);
}
`

} });
