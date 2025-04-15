const PIPELINE_FLAGS = {
	nothing                   : 0,
	lighting_support          : 1 << 0,
	material_support          : 1 << 1,
	material_textures_support : 1 << 2,
	transform_feedback_support: 1 << 3,
};
Object.freeze(PIPELINE_FLAGS);

const SHADER_TYPES = {
	float: { elements_count: 1, byte_length:  4, padding: 0 },
	vec2 : { elements_count: 2, byte_length:  8, padding: 2 },
	vec3 : { elements_count: 3, byte_length: 12, padding: 1 },
	vec4 : { elements_count: 4, byte_length: 16, padding: 0 },
};
Object.freeze(PIPELINE_FLAGS);

const SHADERS_COMMON = {

UNIFORM_BLOCKS: {
	GEOMETRY          : { name: "Geometry"         , binding: 0 },
	MATERIAL_CONSTANTS: { name: "MaterialConstants", binding: 1 },
	LIGHT_PROPERTIES  : { name: "LightProperties"  , binding: 2 },
},

LIGHTING_INFO: {
	DIRECTIONAL: {
		COMPONENTS_COUNT: 24,
	},
	POINT: {
		COMPONENTS_COUNT: 12,
		MAX_COUNT: 16
	},
	SPOT: {
		COMPONENTS_COUNT: 32,
		MAX_COUNT: 16
	},
},

PBR_LIGHTING_STRUCTURES: /* glsl */ `

struct DirectionalLight {
	mat4 view_projection;
	vec3 color;
	float intensity;
	vec3 direction;
};

struct PointLight {
	vec3 color;
	float intensity;
	vec3 position;
	vec3 attenuation; // [constant, linear, cubic]
};

struct SpotLight {
	mat4 view_projection;
	vec3 color;
	float intensity;
	vec3 position;
	float inner_limit;
	vec3 attenuation; // [constant, linear, cubic]
	float outer_limit;
	vec3 direction;
};
`,

/*
dm0, dm1, dm2, dm3
dm4, dm5, dm6, dm7
dm8, dm9, dm0, dm1
dm2, dm3, dm4, dm5
dcr, dcg, dcb, din
ddx, ddy, ddz, ___

pcr, pcg, pcb, pin
ppx, ppy, ppz, ___
pac, pal, pac, ___

scr, scg, scb, sin
spx, spy, spz, sil
sac, sal, sac, sol
sdx, sdy, sdz, ___

sm0, sm1, sm2, sm3
sm4, sm5, sm6, sm7
sm8, sm9, sm0, sm1
sm2, sm3, sm4, sm5
scr, scg, scb, sin
spx, spy, spz, sil
sac, sal, sac, sol
sdx, sdy, sdz, ___

*/

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
Object.defineProperties(SHADERS_COMMON.LIGHTING_INFO, {
	UNIFORM_BUFFER_LENGTH: {
		value: SHADERS_COMMON.LIGHTING_INFO.DIRECTIONAL.COMPONENTS_COUNT
			+ SHADERS_COMMON.LIGHTING_INFO.POINT.COMPONENTS_COUNT * SHADERS_COMMON.LIGHTING_INFO.POINT.MAX_COUNT
			+ SHADERS_COMMON.LIGHTING_INFO.SPOT.COMPONENTS_COUNT * SHADERS_COMMON.LIGHTING_INFO.SPOT.MAX_COUNT
	},
});
Object.defineProperties(SHADERS_COMMON.LIGHTING_INFO.POINT, {
	BYTES_OFFSET: {
		value: SHADERS_COMMON.LIGHTING_INFO.DIRECTIONAL.COMPONENTS_COUNT * Float32Array.BYTES_PER_ELEMENT
	},
});
Object.defineProperties(SHADERS_COMMON.LIGHTING_INFO.SPOT, {
	BYTES_OFFSET: {
		value: SHADERS_COMMON.LIGHTING_INFO.POINT.BYTES_OFFSET
			+ SHADERS_COMMON.LIGHTING_INFO.POINT.COMPONENTS_COUNT
				* SHADERS_COMMON.LIGHTING_INFO.POINT.MAX_COUNT * Float32Array.BYTES_PER_ELEMENT
	},
});
Object.freeze(SHADERS_COMMON);
