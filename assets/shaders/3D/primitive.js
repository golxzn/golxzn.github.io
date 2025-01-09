
Object.assign(SHADERS["3D"], { PRIMITIVE : {

vert : /* glsl */ `#version 300 es

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec3 a_color;

out vec3 f_position;
out vec3 f_normal;
out vec3 f_color;

uniform mat4 u_mvp;
uniform mat4 u_model;
uniform mat3 u_normal_matrix;

void main() {
	gl_Position = u_mvp * vec4(a_position, 1.0);
	f_position = vec3(u_model * vec4(a_position, 1.0));
	f_normal = u_normal_matrix * a_normal;
	f_color = a_color;
}
`,


frag : /* glsl */ `#version 300 es
precision mediump float;

in vec3 f_position;
in vec3 f_normal;
in vec3 f_color;

layout(location = 0) out vec3 frag_position;
layout(location = 1) out vec3 frag_normal;
layout(location = 2) out vec3 frag_diffuse;


void main() {
	frag_position = f_position;
	frag_normal = normalize(f_normal);
	frag_diffuse = f_color;
}
`

} });
