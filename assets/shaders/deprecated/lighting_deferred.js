Object.assign(SHADERS["3D"], { LIGHTING_DEFERRED : {

properties : {
	flags: PIPELINE_FLAGS.lighting_support
},

//============================================ VERTEX ============================================//

vert : /* glsl */ `#version 300 es

// ${SHADERS_COMMON.LIGHTING_CONSTANTS}

layout(location = 0) in vec2 a_position;
// layout(location = 1) in vec3 a_normal;
// layout(location = 2) in vec2 a_uv;

// out vec4 f_spotlight_positions[MAX_SPOT_LIGHT_COLORS];
// out vec3 f_position;
// out vec3 f_to_view;
// out vec3 f_normal;
out vec2 f_uv;

uniform mat4 u_mvp;
// uniform mat4 u_model;
// uniform mat3 u_normal_matrix;
// uniform mediump vec3 u_view_position;

// uniform mediump int u_spot_lights_count;
// uniform mat4 u_spotlight_vp[MAX_SPOT_LIGHT_COLORS];

void main() {
	gl_Position = vec4(a_position, 0.0, 1.0);
	f_uv = (a_position + vec2(1.0)) * 0.5;

	// gl_Position = u_mvp * vec4(a_position, 1.0);
	// vec4 vertex_position = u_model * vec4(a_position, 1.0);
	// for (int i = 0; i < u_spot_lights_count; ++i) {
	// 	f_spotlight_positions[i] = u_spotlight_vp[i] * vertex_position;
	// }
	// f_position = vec3(vertex_position);
	// f_to_view = u_view_position - f_position;
	// f_normal = u_normal_matrix * a_normal;
	// f_uv = a_uv;
}
`,

//=========================================== FRAGMENT ===========================================//

frag : /* glsl */ `#version 300 es
precision mediump float;

${SHADERS_COMMON.LIGHTING_CONSTANTS}

// in vec4 f_spotlight_positions[MAX_SPOT_LIGHT_COLORS];
// in vec3 f_normal;
// in vec3 f_to_view;
in vec2 f_uv;

layout(location = 0) out vec4 frag_color;
layout(location = 1) out vec4 bright_color;

${SHADERS_COMMON.LIGHTING_STRUCTURES}

struct FogInfo {
	vec3 color;
	float min_distance;
	float max_distance;
};

uniform float u_exposure;
uniform DirectionalLight u_dir_light;
uniform int              u_point_lights_count;
uniform PointLight       u_point_lights[MAX_POINT_LIGHT_COLORS];
uniform int              u_spot_lights_count;
uniform SpotLight        u_spot_lights[MAX_SPOT_LIGHT_COLORS];
uniform vec3             u_view_position;
// uniform vec4             u_spotlight_positions[MAX_SPOT_LIGHT_COLORS];
uniform mat4 u_spotlight_vp[MAX_SPOT_LIGHT_COLORS];

/* uniform */ const FogInfo u_fog = FogInfo(vec3(0.01, 0.014, 0.022), 0.0, 60.0);

uniform sampler2D u_position;
uniform sampler2D u_normal;
uniform sampler2D u_diffuse; // albedo
// uniform sampler2D u_metallic;
// uniform sampler2D u_ruoghness;
// uniform sampler2D u_ambient_occlusion;
uniform mediump sampler2DArray u_spotlight_shadow_map;

${SHADERS_COMMON.LIGHTING_UTILITIES}
${SHADERS_COMMON.SHADOW_CALCULATION}

vec3 tone_mapping(vec3 color, float exposure) {
	return vec3(1.0) - exp(-color * exposure);
}

vec3 gamma_correction(vec3 color) {
	const float gamma = 1.0 / 2.2;
	return pow(color, vec3(gamma));
}


void main() {
	vec3 texel    = texture(u_diffuse, f_uv).xyz;
	vec3 position = texture(u_position, f_uv).xyz;
	vec3 normal   = normalize(texture(u_normal, f_uv).xyz);
	vec3 to_view  = normalize(u_view_position);
	vec3 to_light = normalize(u_dir_light.direction);

	float shininess = 32.0; // u_material.shininess;

	// Directional Light
	vec3 ambient  = u_dir_light.properties.ambient;
	vec3 diffuse  = u_dir_light.properties.diffuse * calc_diffuse(to_light, normal);
	vec3 specular = u_dir_light.properties.specular * calc_specular(to_light, to_view, normal, shininess);

	// Point Light
	#pragma optionNV(unroll)
	for (int i = 0; i < u_point_lights_count; ++i) {
		PointLight point = u_point_lights[i];
		to_light = point.position - position;
		float distance_to_light = length(to_light);
		to_light = normalize(to_light);

		if (dot(to_light, normal) <= 0.0) continue;

		float att = 1.0 / attenuation(point.attenuation, distance_to_light);

		/// @todo: shadow calculation

		ambient += point.properties.ambient * att;
		diffuse += point.properties.diffuse * calc_diffuse(to_light, normal) * att;
		specular += point.properties.specular * calc_specular(to_light, to_view, normal, shininess) * att;
	}

	// Spot light
	#pragma optionNV(unroll)
	for (int i = 0; i < u_spot_lights_count; ++i) {
		SpotLight spot = u_spot_lights[i];

		to_light = spot.position - position;
		float distance_to_light = length(to_light);
		to_light = normalize(to_light);
		if (dot(to_light, normal) <= 0.0) continue;

		float spot_factor = dot(normalize(spot.direction), -to_light);
		if (spot_factor < spot.limits.outer) continue;

		float att = attenuation(spot.attenuation, distance_to_light);
		float diffuse_component = calc_diffuse(to_light, normal);
		float bias = max(0.0005 * (1.0 - diffuse_component), 0.0001);
		// PIZDEC!!!!
		// float shadow = 1.0 - calc_shadow(u_spotlight_positions[i], i, bias, 2);
		float shadow = 1.0 - calc_shadow(u_spotlight_vp[i] * vec4(position, 1.0), i, bias, 2);
		float intensity = shadow * (spot_intensity(spot_factor, spot.limits) / att);

		ambient += spot.properties.ambient * intensity;
		diffuse += spot.properties.diffuse * diffuse_component * intensity;
		specular += spot.properties.specular * calc_specular(to_light, to_view, normal, shininess) * intensity;
	}

	ambient *= /*u_material.ambient * */texel;
	diffuse *= /*u_material.diffuse * */texel;
	// specular *= u_material.specular;

	float dist = length(u_view_position - position);
	float fog_factor = clamp((u_fog.max_distance - dist) / (u_fog.max_distance - u_fog.min_distance), 0.0, 1.0);

	vec3 color = mix(u_fog.color, ambient + diffuse + specular, fog_factor);
	// vec3 color = ambient + diffuse + specular;

	color = tone_mapping(color, u_exposure);
	// if (f_uv.x > 0.5) {
	// 	color = gamma_correction(color);
	// }

	float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));

	frag_color = vec4(color, 1.0);
	bright_color = brightness > 1.0 ? frag_color : vec4(0.0, 0.0, 0.0, 1.0);
}
`

//================================================================================================//

} });


