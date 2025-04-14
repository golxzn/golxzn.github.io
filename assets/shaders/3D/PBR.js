
Object.assign(SHADERS["3D"], { PBR : {

properties : {
	flags: PIPELINE_FLAGS.lighting_support
},

// >----------------------------------< VERTEX >----------------------------------< //

vert : /* glsl */ `#version 300 es

layout(location = 0) in vec2 a_position;

out vec2 f_uv;

void main() {
	gl_Position = vec4(a_position, 0.0, 1.0);
	f_uv = (a_position + vec2(1.0)) * 0.5;
}
`,

// >---------------------------------< FRAGMENT >---------------------------------< //

frag : /* glsl */ `#version 300 es
precision mediump float;

const float GAMMA = 2.2;
const float PI = 3.14159265359;
const float INV_PI = 0.318309886184;
const float BLOOM_BRIGHTNESS_THRESHOLD = 1.0;
const vec3 GRAYSCALE_WEIGHT = vec3(0.2126, 0.7152, 0.0722);

${SHADERS_COMMON.LIGHTING_CONSTANTS}

in vec2 f_uv;

layout(location = 0) out vec4 frag_color;
layout(location = 1) out vec4 bright_color;

${SHADERS_COMMON.PBR_LIGHTING_STRUCTURES}

uniform vec3             u_view_position;
uniform float            u_exposure;
uniform int              u_point_lights_count;
uniform int              u_spot_lights_count;
uniform DirectionalLight u_dir_light;
uniform PointLight       u_point_lights[MAX_POINT_LIGHT_COLORS];
uniform SpotLight        u_spot_lights[MAX_SPOT_LIGHT_COLORS];
uniform mat4             u_spotlight_vp[MAX_SPOT_LIGHT_COLORS];

// /* uniform */ const FogInfo u_fog = FogInfo(vec3(0.01, 0.014, 0.022), 0.0, 60.0);

uniform sampler2D u_albedo;
uniform sampler2D u_position;
uniform sampler2D u_normal;
uniform sampler2D u_emissive;
uniform sampler2D u_occlusion_metallic_roughness;
uniform sampler2D u_depth;
uniform mediump sampler2DArray u_spotlight_shadow_map;

${SHADERS_COMMON.LIGHTING_UTILITIES}
${SHADERS_COMMON.SHADOW_CALCULATION}

vec3 fresnel_schlick(float cosTheta, vec3 F0) {
	return F0 + (1.0 - F0) * pow(max(1.0 - cosTheta, 0.0), 5.0);
}

float distribution_GGX(vec3 N, vec3 H, float roughness) {
	float a2 = roughness * roughness;
	float NdotH = max(dot(N, H), 0.0001);

	float denominator = (NdotH * NdotH) * (a2 - 1.0) + 1.0;
	denominator *= denominator * PI;
	return a2 / denominator;
}

float geometry_schlick_GGX(float NdotV, float roughness) {
	float r = roughness + 1.0;
	float k = r * r * 0.125; // DIRECT

	return NdotV / (NdotV * (1.0 - k) + k);
}

float geometry_smith(float NdotV, float NdotL, float roughness) {
	return geometry_schlick_GGX(NdotV, roughness)
		* geometry_schlick_GGX(NdotL, roughness);
}

struct lighting_equation_config {
	vec3 albedo;
	vec3 normal;
	vec3 to_view;
	vec3 to_light;
	vec3 radiance;
	vec3 F0;
	float roughness;
	float metallic;
};

// Cook-Torrance BRDF
/// The 4th component of output is diffuse impact for shadows
vec3 lighting_equation(in lighting_equation_config config) {
	vec3 halfway_dir = normalize(config.to_view + config.to_light);

	float NdotL = dot(config.normal, config.to_light);
	if (NdotL <= 0.0) {
		return vec3(0.0);
	}
	float NdotV = max(dot(config.normal, config.to_view), 0.0001);

	float NDF = distribution_GGX(config.normal, halfway_dir, config.roughness);
	float G   = geometry_smith(NdotV, NdotL, config.roughness);
	vec3  F   = fresnel_schlick(max(dot(halfway_dir, config.to_view), 0.0), config.F0);

	vec3 diffuse = (vec3(1.0) - F) * (1.0 - config.metallic) * config.albedo * INV_PI;
	vec3 specular = (NDF * G * F) / (4.0 * NdotV * NdotL);

	return (diffuse + specular) * config.radiance * NdotL;
}

vec3 tone_mapping(vec3 color, float exposure) {
	return color / (color + vec3(1.0)); // HDR tone mapping
	// return vec3(1.0) - exp(-color * exposure);
}

vec3 gamma_correction(vec3 color) {
	const float gamma = 1.0 / GAMMA;
	return pow(color, vec3(gamma));
}

void main() {
	const vec4 gamma = vec4(GAMMA, GAMMA, GAMMA, 1.0);

	vec4 albedo = pow(texture(u_albedo, f_uv), gamma);
	vec3 position = texture(u_position, f_uv).xyz;
	vec3 normal   = texture(u_normal, f_uv).xyz;
	vec3 occlusion_metallic_roughness = texture(u_occlusion_metallic_roughness, f_uv).rgb;
	vec3 ambient_occlusion = vec3(occlusion_metallic_roughness.r);
	float depth = texture(u_depth, f_uv).r;
	float metallic = clamp(occlusion_metallic_roughness.g, 0.0, 1.0);

	vec3 to_light = normalize(-u_dir_light.direction);
	lighting_equation_config config = lighting_equation_config(
		/* .albedo    = */ albedo.rgb,
		/* .normal    = */ normal,
		/* .to_view   = */ normalize(u_view_position), /// @todo Think about it,
		/* .to_light  = */ to_light,
		/* .radiance  = */ u_dir_light.intensity * u_dir_light.color,
		/* .F0        = */ mix(vec3(0.04), albedo.rgb, metallic),
		/* .roughness = */ clamp(occlusion_metallic_roughness.b, 0.0, 1.0),
		/* .metallic  = */ metallic
	);

	// >-------------------| DIRECTIONAL LIGHT |-------------------< //
	vec3 Lo = lighting_equation(config);

	// >----------------------| POINT LIGHT |----------------------< //
	for (int i = 0; i < u_point_lights_count; ++i) {
		PointLight point = u_point_lights[i];
		config.to_light = point.position - position;
		float att = attenuation(point.attenuation, length(config.to_light));
		config.to_light = normalize(config.to_light);
		config.radiance = point.intensity * (point.color / att);
		/// @todo: shadow calculation

		Lo += lighting_equation(config);
	}

	// >----------------------| SPOT  LIGHT |----------------------< //
	for (int i = 0; i < u_spot_lights_count; ++i) {
		SpotLight spot = u_spot_lights[i];
		vec3 to_light = spot.position - position;
		float distance_to_light = length(to_light);
		to_light = normalize(to_light);

		float NdotL = dot(config.normal, to_light); /// Shouldn't be here
		if (NdotL <= 0.0) continue;

		float spot_factor = max(dot(normalize(spot.direction), -to_light), spot.outer_limit);
		if (spot_factor < spot.outer_limit) continue;

		/// SHADOWS & ATTENUATION
		float att = attenuation(spot.attenuation, distance_to_light); // in tutorial they use distance_to_light * distance_to_light;
		float bias = max(0.0005 * (1.0 - NdotL), 0.0001);
		float shadow = 1.0 - calc_shadow(u_spotlight_vp[i] * vec4(position, 1.0), i, bias, 2);
		float intensity = shadow * spot_intensity(spot_factor, spot.inner_limit, spot.outer_limit) / att;

		config.to_light = to_light;
		config.radiance = spot.intensity * spot.color * intensity;

		Lo += lighting_equation(config);
	}

	/// Should be replaced with IBL
	vec3 emissive = pow(texture(u_emissive, f_uv).rgb, gamma.rgb);
	vec3 ambient = vec3(0.03) * albedo.rgb * ambient_occlusion;
	vec3 color = emissive + ambient + Lo;

	color = tone_mapping(color, u_exposure);
	color = gamma_correction(color);

	float brightness = dot(color, GRAYSCALE_WEIGHT);

	frag_color = vec4(color, 1.0);
	// frag_color = vec4(mix(color, normal * 0.5 + 0.5, 1.0), 1.0);
	bright_color = vec4(brightness > BLOOM_BRIGHTNESS_THRESHOLD ? emissive : vec3(0.0), 1.0);

	gl_FragDepth = depth;
}
`

} });

