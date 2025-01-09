
Object.assign(SHADERS["3D"], { SNOW_PARTICLES_LIGHTING : {

properties : {
	flags: PIPELINE_FLAGS.material_support
},

vert : /* glsl */ `#version 300 es

layout(location = 0) in vec2 a_position; // [x, y]
layout(location = 1) in vec2 a_normal;   // [z, -]
layout(location = 2) in vec3 a_offset;
layout(location = 3) in vec3 a_scales;
layout(location = 4) in vec3 a_rotations;

out vec3 f_position;
out vec3 f_normal;

uniform mat4 u_mvp;
uniform mat4 u_model;
uniform mat3 u_normal_matrix;

mat3 make_rotation_matrix(vec3 rotations) {
	float cos_x = cos(rotations.x);
	float cos_y = cos(rotations.y);
	float cos_z = cos(rotations.z);
	float sin_x = sin(rotations.x);
	float sin_y = sin(rotations.y);
	float sin_z = sin(rotations.z);

	return mat3(
		cos_y * cos_z,  sin_x * sin_y * cos_z - cos_x * sin_z,  cos_x * sin_y * cos_z + sin_x * sin_z,
		cos_y * sin_z,  sin_x * sin_y * sin_z + cos_x * cos_z,  cos_x * sin_y * sin_z - sin_x * cos_z,
		       -sin_y,                          sin_x * cos_y,                          cos_x * cos_y
	);
}

void main() {
	mat3 rotation_matrix = make_rotation_matrix(a_rotations);
	f_position = (rotation_matrix * vec3(a_position, 0.0)) * a_scales + a_offset;
	f_normal = u_normal_matrix * rotation_matrix * vec3(0.0, 0.0, a_normal.x);

	gl_Position = u_mvp * vec4(f_position, 1.0);
}
`,


frag : /* glsl */ `#version 300 es
precision mediump float;

in vec3 f_position;
in vec3 f_normal;

layout(location = 0) out vec3 frag_position;
layout(location = 1) out vec3 frag_normal;
layout(location = 2) out vec3 frag_diffuse;

${SHADERS_COMMON.MATERIAL_STRUCTURE}

uniform Material u_material;

void main() {
	frag_position = f_position;
	frag_normal = normalize(f_normal);
	frag_diffuse  = u_material.ambient * u_material.diffuse * u_material.specular;
}
`

} });
