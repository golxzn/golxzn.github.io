const PIPELINE_FLAGS = {
	nothing                   : 0,
	lighting_support          : 1 << 0,
	material_support          : 1 << 1,
	transform_feedback_support: 1 << 2,
};
Object.freeze(PIPELINE_FLAGS);

const SHADERS_COMMON = {

MAX_POINT_LIGHT_COLORS: 16,
MAX_SPOT_LIGHT_COLORS: 16,

LIGHTING_CONSTANTS: /* glsl */ `
#define MAX_POINT_LIGHT_COLORS 16
#define MAX_SPOT_LIGHT_COLORS 16
`,

LIGHTING_STRUCTURES: /* glsl */ `

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

`,

MATERIAL_STRUCTURE: /* glsl */ `
struct Material {
	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
	float shininess;
};
`,

LIGHTING_UTILITIES: /* glsl */ `
float attenuation(vec3 attenuation, float dist) {
	return attenuation.r + attenuation.g * dist + attenuation.b * dist * dist;
}

float spot_intensity(float spot_factor, Limits limits) {
	return clamp((spot_factor - limits.outer) / (limits.inner - limits.outer), 0.0, 1.0);
}

float calc_diffuse(vec3 to_light, vec3 normal) {
	return max(dot(normal, to_light), 0.0);
}

float calc_specular(vec3 to_light, vec3 to_view, vec3 normal, float shininess) {
	vec3 half_direction = normalize(to_light + to_view);
	return pow(max(dot(normal, half_direction), 0.0), shininess);
}
`,

SHADOW_CALCULATION: /* glsl */`
float calc_shadow(vec4 fragment_pos_light_space, int id, float bias, int accuracy) {
	// fragment_pos_light_space = { 22.99704, 10.25679, -12.5804, 19.86758 }
	float invert_w = 1.0 / fragment_pos_light_space.w; // 0.0503334592
	// (fragment_pos_light_space.xyz * invert_w) == { 1.158, 0.519, -0.637 }
	// projection_coords = { 1.079, 0.7595, 0.1815 }
	vec3 projection_coords = (fragment_pos_light_space.xyz * invert_w) * 0.5 + vec3(0.5);
	// current_depth = 0.1815
	float current_depth = projection_coords.z;
	if (current_depth > 1.0) return 0.0;

	// line_width = 5
	int line_width = accuracy * 2 + 1;
	vec2 texel_size = 1.0 / vec2(textureSize(u_spotlight_shadow_map, 0));
	float shadow = 0.0;
	for (int x = -accuracy; x <= accuracy; ++x) {
		for (int y = -accuracy; y <= accuracy; ++y) {
			vec3 uv = vec3(projection_coords.xy + vec2(x, y) * texel_size, id);
			float pcf_depth = texture(u_spotlight_shadow_map, uv).r; // 0.99962
			shadow += step(pcf_depth, current_depth - bias);
		}
	}

	float shadow_weight = 1.0 / float(line_width * line_width);
	return shadow * shadow_weight;
}
`

};
Object.freeze(SHADERS_COMMON);
