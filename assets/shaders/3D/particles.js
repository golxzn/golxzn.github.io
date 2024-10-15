
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

mat4 make_rotation_matrix(vec3 rotations) {
	float cos_x = cos(rotations.x);
	float cos_y = cos(rotations.y);
	float cos_z = cos(rotations.z);
	float sin_x = sin(rotations.x);
	float sin_y = sin(rotations.y);
	float sin_z = sin(rotations.z);

	return mat4(
		cos_y * cos_z,  sin_x * sin_y * cos_z - cos_x * sin_z,  cos_x * sin_y * cos_z + sin_x * sin_z, 0.0,
		cos_y * sin_z,  sin_x * sin_y * sin_z + cos_x * cos_z,  cos_x * sin_y * sin_z - sin_x * cos_z, 0.0,
		       -sin_y,                          sin_x * cos_y,                          cos_x * cos_y, 0.0,
		          0.0,                                    0.0,                                    0.0, 1.0
	);
}

void main() {
	vec4 position = make_rotation_matrix(a_rotations) * vec4(a_position, 1.0);
	gl_Position = u_mvp * (position * vec4(a_scales, 1.0) + vec4(a_offset, 1.0));
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
