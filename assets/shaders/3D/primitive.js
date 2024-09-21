
Object.assign(SHADERS["3D"], { PRIMITIVE : {

vert : /* glsl */ `#version 300 es

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;

out vec2 f_uv;

uniform mat4 u_model_view;
uniform mat4 u_projection;

void main() {
	gl_Position = u_projection * u_model_view * vec4(a_position, 1.0);
	f_uv = a_uv;
}
`,


frag : /* glsl */ `#version 300 es
precision mediump float;

in vec2 f_uv;

out vec4 frag_color;

uniform sampler2D u_texture_0;

void main() {
	frag_color = texture(u_texture_0, f_uv);
}
`

} });
