Object.assign(SHADERS["3D"], { LIGHTING : {

//============================================ VERTEX ============================================//

vert : /* glsl */ `#version 300 es

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;

out vec3 f_position;
out vec3 f_to_view;
out vec3 f_normal;
out vec2 f_uv;

uniform mat4 u_mvp;
uniform mat4 u_model;
uniform mat3 u_normal_matrix;
uniform vec3 u_view_position;

void main() {
	gl_Position = u_mvp * vec4(a_position, 1.0);
	f_position = vec3(u_model * vec4(a_position, 1.0));
	f_to_view = u_view_position - f_position;
	f_normal = u_normal_matrix * a_normal;
	f_uv = a_uv;
}
`,

//=========================================== FRAGMENT ===========================================//

frag : /* glsl */ `#version 300 es
precision mediump float;

#define MAX_POINT_LIGHT_COLORS 16

in vec3 f_position;
in vec3 f_normal;
in vec3 f_to_view;
in vec2 f_uv;

out vec4 frag_color;

struct LightProperties {
	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
};

struct DirectionalLight {
	LightProperties properties;
	vec3 direction;
};

struct PointLight {
	LightProperties properties;

	vec3 position;
	vec3 attenuation; // [constant, linear, cubic]
};

struct Material {
	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
	float shininess;
};

uniform DirectionalLight u_dir_light;
uniform int              u_point_lights_count;
uniform PointLight       u_point_lights[MAX_POINT_LIGHT_COLORS];
uniform Material         u_material;
uniform sampler2D        u_texture_0; // diffuse


float attenuation(PointLight light, float dist) {
	return 1.0 / (light.attenuation.r + light.attenuation.g * dist + light.attenuation.b * dist * dist);
}

float calc_diffuse(vec3 to_light, vec3 normal) {
	return max(dot(normal, to_light), 0.0);
}

float calc_specular(vec3 to_light, vec3 to_view, vec3 normal) {
	vec3 half_direction = normalize(to_light + to_view);
	return pow(max(dot(normal, half_direction), 0.0), u_material.shininess);
}


void main() {
	vec3 texel = texture(u_texture_0, f_uv).xyz;
	vec3 normal = normalize(f_normal);
	vec3 to_view = normalize(f_to_view);
	vec3 to_light = normalize(-u_dir_light.direction);

	// Directional Light
	vec3 ambient = u_dir_light.properties.ambient;
	vec3 diffuse = u_dir_light.properties.diffuse * calc_diffuse(to_light, normal);
	vec3 specular = u_dir_light.properties.specular * calc_specular(to_light, to_view, normal);

	#pragma optionNV(unroll)
	for (int i = 0; i < u_point_lights_count; ++i) {
		if (dot(normal, to_view) <= 0.0) continue;

		PointLight point = u_point_lights[i];
		to_light = point.position - f_position;
		float att = attenuation(point, length(to_light));
		to_light = normalize(to_light);

		ambient += point.properties.ambient * att;
		diffuse += point.properties.diffuse * calc_diffuse(to_light, normal) * att;
		specular += point.properties.specular * calc_specular(to_light, to_view, normal) * att;
	}

	ambient *= u_material.ambient * texel;
	diffuse *= u_material.diffuse * texel;
	specular *= u_material.specular;

	frag_color = mix(vec4(ambient + diffuse + specular, 1.0), vec4(normal, 1.0), 0.0);
}
`

//================================================================================================//

} });


