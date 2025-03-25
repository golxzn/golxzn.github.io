
Object.assign(SHADERS["3D"], { PBR : {

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

const float PI = 3.14159265359;
${SHADERS_COMMON.LIGHTING_CONSTANTS}

in vec2 f_uv;

layout(location = 0) out vec4 frag_color;
layout(location = 1) out vec4 bright_color;

${SHADERS_COMMON.LIGHTING_STRUCTURES}

uniform float            u_exposure;
uniform int              u_point_lights_count;
uniform int              u_spot_lights_count;
uniform DirectionalLight u_dir_light;
uniform PointLight       u_point_lights[MAX_POINT_LIGHT_COLORS];
uniform SpotLight        u_spot_lights[MAX_SPOT_LIGHT_COLORS];
uniform vec3             u_view_position;
// uniform vec4             u_spotlight_positions[MAX_SPOT_LIGHT_COLORS];
uniform mat4 u_spotlight_vp[MAX_SPOT_LIGHT_COLORS];

// /* uniform */ const FogInfo u_fog = FogInfo(vec3(0.01, 0.014, 0.022), 0.0, 60.0);

uniform sampler2D u_position;
uniform sampler2D u_albedo;
uniform sampler2D u_normal;
uniform sampler2D u_ambient_occlusion;
uniform sampler2D u_metallic_roughness;
uniform mediump sampler2DArray u_spotlight_shadow_map;

${SHADERS_COMMON.LIGHTING_UTILITIES}
${SHADERS_COMMON.SHADOW_CALCULATION}

vec3 fresnel_schlick(float cosTheta, vec3 F0) {
	// return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
	return F0 + (1.0 - F0) * pow(min(1.0 - cosTheta, 0.0), 5.0);
}

float distribution_GGX(vec3 N, vec3 H, float roughness) {
	float a2 = roughness * roughness * roughness * roughness;
	float NdotH = max(dot(N, H), 0.0);

	float denominator = (NdotH * NdotH) * (a2 - 1.0) + 1.0;
	denominator *= denominator * PI;
	return a2 / denominator;
}

float geometry_schlick_GGX(float NdotV, float roughness) {
	roughness += 1.0;
	float k_direct = (roughness * roughness) / 8.0;

	return NdotV / (NdotV * (1.0 - k_direct) + k_direct);
}

float geometry_smith(float NdotV, float NdotL, float roughness) {
	return geometry_schlick_GGX(NdotV, roughness)
		* geometry_schlick_GGX(NdotL, roughness);
}



vec3 tone_mapping(vec3 color, float exposure) {
	return vec3(1.0) - exp(-color * exposure);
}

vec3 gamma_correction(vec3 color) {
	const float gamma = 1.0 / 2.2;
	return pow(color, vec3(gamma));
}


void main() {
	vec3 to_view  = normalize(u_view_position);
	vec3 to_light = normalize(u_dir_light.direction);

	vec3 position = texture(u_position, f_uv).xyz;
	vec3 albedo   = texture(u_albedo, f_uv).xyz;
	vec3 normal   = normalize(texture(u_normal, f_uv).xyz);
	vec2 metallic_roughness = texture(u_metallic_roughness, f_uv).xy;
	float metallic  = metallic_roughness.x;
	float roughness = metallic_roughness.y;

	vec3 F0 = mix(vec3(0.04), albedo, metallic);
	vec3 Lo = vec3(0.0);


	// >-------------------| DIRECTIONAL LIGHT |-------------------< //
	// ???

	// >----------------------| POINT LIGHT |----------------------< //
	for (int i = 0; i < u_point_lights_count; ++i) {
		PointLight point = u_point_lights[i];
		to_light = point.position - position;
		float distance_to_light = length(to_light);
		to_light = normalize(to_light);

		if (dot(to_light, normal) <= 0.0) continue;

		vec3 halfway_dir = normalize(-u_view_position + to_light);

		// Cook-Torrance BRDF
		float NdotV = max(dot(normal, to_view), 0.0);
		float NdotL = max(dot(normal, to_light), 0.0);

		float NDF = distribution_GGX(normal, halfway_dir, roughness);
		float G   = geometry_smith(NdotV, NdotL, roughness);
		vec3 F    = fresnel_schlick(max(dot(halfway_dir, to_view), 0.0), F0);

		vec3 kS = F;
		vec3 kD = (vec3(1.0) - kS) * (1.0 - metallic);
		vec3 specular = (NDF * G * F)
			/ (4.0 * NdotV * NdotL + 0.0001);


		/// @todo: shadow calculation
		/// SHADOWS & ATTENUATION
		float att = attenuation(point.attenuation, distance_to_light);
		// float bias = max(0.0005 * (1.0 - kD.r), 0.0001);
		// PIZDEC!!!!
		// float shadow = 1.0 - calc_shadow(u_spotlight_positions[i], i, bias, 2);
		// vec4 spotlight_pos = u_spotlight_vp[i] * vec4(position, 1.0);
		// float shadow = 1.0 - calc_shadow(spotlight_pos, i, bias, 2);
		// float intensity = shadow * (spot_intensity(spot_factor, spot.limits) / att);
		/// Should be "COLOR" * intensity I guess
		vec3 radiance = point.properties.diffuse / att;

		Lo += (kD * albedo / PI + specular) * radiance * NdotL;
	}

	// >----------------------| SPOT  LIGHT |----------------------< //
	for (int i = 0; i < u_spot_lights_count; ++i) {
		SpotLight spot = u_spot_lights[i];
		to_light = spot.position - position;
		float distance_to_light = length(to_light);
		to_light = normalize(to_light);
		if (dot(to_light, normal) <= 0.0) continue;

		float spot_factor = dot(normalize(spot.direction), -to_light);
		if (spot_factor < spot.limits.outer) continue;

		vec3 halfway_dir = normalize(-u_view_position + to_light);

		// Cook-Torrance BRDF
		float NdotV = max(dot(normal, to_view), 0.0);
		float NdotL = max(dot(normal, to_light), 0.0);

		float NDF = distribution_GGX(normal, halfway_dir, roughness);
		float G   = geometry_smith(NdotV, NdotL, roughness);
		vec3 F    = fresnel_schlick(max(dot(halfway_dir, to_view), 0.0), F0);

		vec3 kS = F;
		vec3 kD = (vec3(1.0) - kS) * (1.0 - metallic);
		vec3 specular = (NDF * G * F)
			/ (4.0 * NdotV * NdotL + 0.0001);


		/// SHADOWS & ATTENUATION
		float att = attenuation(spot.attenuation, distance_to_light);
		float bias = max(0.0005 * (1.0 - kD.r), 0.0001);
		// PIZDEC!!!!
		// float shadow = 1.0 - calc_shadow(u_spotlight_positions[i], i, bias, 2);
		vec4 spotlight_pos = u_spotlight_vp[i] * vec4(position, 1.0);
		float shadow = 1.0 - calc_shadow(spotlight_pos, i, bias, 2);
		float intensity = shadow * (spot_intensity(spot_factor, spot.limits) / att);
		/// Should be "COLOR" * intensity I guess
		vec3 radiance = spot.properties.diffuse * intensity;

		Lo += (kD * albedo / PI + specular) * radiance * NdotL;
	}

	vec3 ambient = vec3(0.03) * albedo * texture(u_ambient_occlusion, f_uv).rgb;
	vec3 color = ambient + Lo;

	color /= color + vec3(1.0); // Tone mapping
	color = tone_mapping(color, u_exposure);
	color = gamma_correction(color);

	float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));

	frag_color = vec4(color, 1.0);
	bright_color = brightness > 1.0 ? frag_color : vec4(0.0, 0.0, 0.0, 1.0);
}
`

} });

