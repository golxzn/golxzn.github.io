const PIPELINE_FLAGS = {
	nothing                   : 0,
	lighting_support          : 1 << 0,
	material_support          : 1 << 1,
	material_textures_support : 1 << 2,
	transform_feedback_support: 1 << 3,
};
Object.freeze(PIPELINE_FLAGS);

const SHADERS_COMMON = {

UNIFORM_BLOCKS: {
	GEOMETRY          : { name: "Geometry",          binding: 0 },
	MATERIAL_CONSTANTS: { name: "MaterialConstants", binding: 1 }
},

MAX_POINT_LIGHT_COLORS: 16,
MAX_SPOT_LIGHT_COLORS: 16,

LIGHTING_CONSTANTS: /* glsl */ `
#define MAX_POINT_LIGHT_COLORS 16
#define MAX_SPOT_LIGHT_COLORS 16
`,

PBR_LIGHTING_STRUCTURES: /* glsl */ `

struct DirectionalLight {
	vec3 color;
	vec3 direction;
	float intensity;
};

struct PointLight {
	vec3 color;
	vec3 position;
	vec3 attenuation; // [constant, linear, cubic]
	float intensity;
};

/*
/// @todo uniform buffer
LAYOUT
cr, cg, rb, in, // intensity
px, py, pz, il, // inner limit
ax, ay, az, ol, outer // limit
dx, dy, dz, __
*/
struct SpotLight {
	vec3 color;
	float intensity;
	vec3 position;
	float inner_limit;
	vec3 attenuation; // [constant, linear, cubic]
	float outer_limit;
	vec3 direction;
};
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

float spot_intensity(float spot_factor, float inner_limit, float outer_limit) {
	return clamp((spot_factor - outer_limit) / (inner_limit - outer_limit), 0.0, 1.0);
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
	vec3 projection_coords = (fragment_pos_light_space.xyz / fragment_pos_light_space.w) * 0.5 + 0.5;
	float current_depth = projection_coords.z;
	if (current_depth > 1.0) return 0.0;

	float threshold = current_depth - bias;
	int line_width = accuracy * 2 + 1;
	float shadow_weight = 1.0 / float(line_width * line_width);
	vec2 texel_size = 1.0 / vec2(textureSize(u_spotlight_shadow_map, id));

	float shadow = 0.0;
	for (int x = -accuracy; x <= accuracy; ++x) {
		for (int y = -accuracy; y <= accuracy; ++y) {
			vec3 uv = vec3(projection_coords.xy + vec2(x, y) * texel_size, id);
			float pcf_depth = texture(u_spotlight_shadow_map, uv).r;
			shadow += step(pcf_depth, threshold) * shadow_weight;
		}
	}

	return shadow;
}
`,

};
Object.freeze(SHADERS_COMMON);
