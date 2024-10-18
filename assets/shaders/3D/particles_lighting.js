
Object.assign(SHADERS["3D"], { PARTICLES_LIGHTING : {

vert : /* glsl */ `#version 300 es

layout(location = 0) in vec2 a_position; // [x, y]
layout(location = 1) in vec2 a_normal;   // [z, -]
layout(location = 2) in vec3 a_offset;
layout(location = 3) in vec3 a_scales;
layout(location = 4) in vec3 a_rotations;

out vec3 f_position;
out vec3 f_to_view;
out vec3 f_normal;

uniform mat4 u_mvp;
uniform mat4 u_model;
uniform mat3 u_normal_matrix;
uniform vec3 u_view_position;

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
	gl_Position = u_mvp * vec4(f_position, 1.0);
	f_to_view = u_view_position - f_position;
	f_normal = u_normal_matrix * rotation_matrix * vec3(0.0, 0.0, a_normal.x);
}
`,


frag : /* glsl */ `#version 300 es
precision mediump float;

${SHADERS_COMMON.LIGHTING_CONSTANTS}

in vec3 f_position;
in vec3 f_to_view;
in vec3 f_normal;

layout(location = 0) out vec4 frag_color;
layout(location = 1) out vec4 bright_color;

${SHADERS_COMMON.LIGHTING_STRUCTURES}
${SHADERS_COMMON.MATERIAL_STRUCTURE}

uniform DirectionalLight u_dir_light;
uniform int              u_point_lights_count;
uniform PointLight       u_point_lights[MAX_POINT_LIGHT_COLORS];
uniform int              u_spot_lights_count;
uniform SpotLight        u_spot_lights[MAX_SPOT_LIGHT_COLORS];
uniform Material         u_material;

${SHADERS_COMMON.LIGHTING_UTILITIES}

void main() {
	vec3 normal = normalize(f_normal);
	vec3 to_view = normalize(f_to_view);
	vec3 to_light = normalize(-u_dir_light.direction);

	// Directional Light
	vec3 ambient = u_dir_light.properties.ambient;
	vec3 diffuse = u_dir_light.properties.diffuse * calc_diffuse(to_light, normal);
	vec3 specular = u_dir_light.properties.specular * calc_specular(to_light, to_view, normal, u_material.shininess);

	// Point Light
	#pragma optionNV(unroll)
	for (int i = 0; i < u_point_lights_count; ++i) {
		if (dot(normal, to_view) <= 0.0) continue;

		PointLight point = u_point_lights[i];
		to_light = point.position - f_position;
		float att = 1.0 / attenuation(point.attenuation, length(to_light));
		to_light = normalize(to_light);

		ambient += point.properties.ambient * att;
		diffuse += point.properties.diffuse * calc_diffuse(to_light, normal) * att;
		specular += point.properties.specular * calc_specular(to_light, to_view, normal, u_material.shininess) * att;
	}

	// Spot light
	#pragma optionNV(unroll)
	for (int i = 0; i < u_spot_lights_count; ++i) {
		SpotLight spot = u_spot_lights[i];

		to_light = spot.position - f_position;
		float att = attenuation(spot.attenuation, length(to_light));
		to_light = normalize(to_light);

		float spot_factor = dot(normalize(spot.direction), -to_light);
		if (spot_factor < spot.limits.outer) continue;

		float diffuse_component = calc_diffuse(to_light, normal);
		float intensity = (spot_intensity(spot_factor, spot.limits) / att);
		ambient += spot.properties.ambient * intensity;
		diffuse += spot.properties.diffuse * diffuse_component * intensity;
		specular += spot.properties.specular * calc_specular(to_light, to_view, normal, u_material.shininess) * intensity;
	}

	ambient *= u_material.ambient;
	diffuse *= u_material.diffuse;
	specular *= u_material.specular;

	vec3 color = ambient + diffuse + specular;
	float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));

	frag_color = vec4(color, 1.0);
	bright_color = brightness > 1.0 ? frag_color : vec4(0.0, 0.0, 0.0, 1.0);
}
`

} });
