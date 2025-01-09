Object.assign(SHADERS["3D"], { GEOMETRY : {

//============================================ VERTEX ============================================//

vert : /* glsl */ `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;

out vec3 f_position;
out vec3 f_normal;
out vec2 f_uv;

uniform mat4 u_mvp;
uniform mat4 u_model;
uniform mat3 u_normal_matrix;

void main() {
	vec4 position = vec4(a_position, 1.0);

	gl_Position = u_mvp * position;

	f_position = vec3(u_model * position);
	f_normal = normalize(u_normal_matrix * a_normal);
	f_uv = a_uv;
}
`,

//=========================================== FRAGMENT ===========================================//

frag : /* glsl */ `#version 300 es

precision mediump float;

in vec3 f_position;
in vec3 f_normal;
in vec2 f_uv;

layout(location = 0) out vec3 frag_position;
layout(location = 1) out vec3 frag_normal;
layout(location = 2) out vec3 frag_diffuse;

uniform sampler2D u_albedo;

void main() {
	frag_position = f_position;
	frag_normal = f_normal;
	frag_diffuse = texture(u_albedo, f_uv).rgb;
}
`

//================================================================================================//

} });
