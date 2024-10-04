Object.assign(SHADERS["3D"], { LIGHTING : {

//============================================ VERTEX ============================================//

vert : /* glsl */ `#version 300 es

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;

out vec4 f_position_light_space;
out vec3 f_position;
out vec3 f_to_view;
out vec3 f_normal;
out vec2 f_uv;

uniform mat4 u_mvp;
uniform mat4 u_model;
uniform mat4 u_light;
uniform mat3 u_normal_matrix;
uniform vec3 u_view_position;

void main() {
	gl_Position = u_mvp * vec4(a_position, 1.0);
	vec4 vertex_position = u_model * vec4(a_position, 1.0);
	f_position = vec3(vertex_position);
	f_position_light_space = u_light * vertex_position;
	f_to_view = u_view_position - f_position;
	f_normal = u_normal_matrix * a_normal;
	f_uv = a_uv;
}
`,

//=========================================== FRAGMENT ===========================================//

frag : /* glsl */ `#version 300 es
precision mediump float;

#define MAX_POINT_LIGHT_COLORS 16
#define MAX_SPOT_LIGHT_COLORS 16

in vec4 f_position_light_space;
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

struct Limits {
	float inner;
	float outer;
};
struct SpotLight {
	LightProperties properties;

	vec3 position;
	vec3 attenuation; // [constant, linear, cubic]
	vec3 direction;
	Limits limits;
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
uniform int              u_spot_lights_count;
uniform SpotLight        u_spot_lights[MAX_SPOT_LIGHT_COLORS];
uniform Material         u_material;
uniform sampler2D        u_texture_0; // shadow map ALWAYS FIRST!!!!
uniform sampler2D        u_texture_1; // diffuse

float attenuation(vec3 attenuation, float dist) {
	return attenuation.r + attenuation.g * dist + attenuation.b * dist * dist;
}

float spot_intensity(float spot_factor, Limits limits) {
	return clamp((spot_factor - limits.outer) / (limits.inner - limits.outer), 0.0, 1.0);
}

float calc_diffuse(vec3 to_light, vec3 normal) {
	return max(dot(normal, to_light), 0.0);
}

float calc_specular(vec3 to_light, vec3 to_view, vec3 normal) {
	vec3 half_direction = normalize(to_light + to_view);
	return pow(max(dot(normal, half_direction), 0.0), u_material.shininess);
}

float calc_shadow(vec4 fragment_pos_light_space, float bias, int accuracy) {
	vec3 projection_coords = (fragment_pos_light_space.xyz / fragment_pos_light_space.w) * 0.5 + 0.5;
	if (projection_coords.z > 1.0) return 0.0;

	// float closest_depth = texture(u_texture_0, projection_coords.xy).r;
	float current_depth = projection_coords.z;

	int line_width = accuracy * 2 + 1;
	float shadow_weight = 1.0 / float(line_width * line_width);
	vec2 texel_size = 1.0 / vec2(textureSize(u_texture_0, 0));
	float shadow = 0.0;
	for (int x = -accuracy; x <= accuracy; ++x) {
		for (int y = -accuracy; y <= accuracy; ++y) {
			float pcf_depth = texture(u_texture_0, projection_coords.xy + vec2(x, y) * texel_size).r;
			shadow += step(pcf_depth, current_depth - bias) * shadow_weight;
		}
	}

	return shadow;
}

void main() {
	vec3 texel = texture(u_texture_1, f_uv).xyz;
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
		float att = 1.0 / attenuation(point.attenuation, length(to_light));
		to_light = normalize(to_light);

		ambient += point.properties.ambient * att;
		diffuse += point.properties.diffuse * calc_diffuse(to_light, normal) * att;
		specular += point.properties.specular * calc_specular(to_light, to_view, normal) * att;
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
		// float bias = max(0.001 * (1.0 - diffuse_component), 0.0001);
		float shadow = 1.0 - calc_shadow(f_position_light_space, 0.0001, 1);
		float intensity = shadow * (spot_intensity(spot_factor, spot.limits) / att);
		ambient += spot.properties.ambient * intensity;
		diffuse += spot.properties.diffuse * diffuse_component * intensity;
		specular += spot.properties.specular * calc_specular(to_light, to_view, normal) * intensity;
	}

	ambient *= u_material.ambient * texel;
	diffuse *= u_material.diffuse * texel;
	specular *= u_material.specular;

	frag_color = vec4(ambient + diffuse + specular, 1.0);
}
`

//================================================================================================//

} });


