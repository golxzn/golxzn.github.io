Object.assign(SHADERS["3D"], { LIGHTING : {

//============================================ VERTEX ============================================//

vert : /* glsl */ `#version 300 es

${SHADERS_COMMON.LIGHTING_CONSTANTS}

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;

out vec4 f_spotlight_positions[MAX_SPOT_LIGHT_COLORS];
out vec3 f_position;
out vec3 f_to_view;
out vec3 f_normal;
out vec2 f_uv;

uniform mat4 u_mvp;
uniform mat4 u_model;
uniform mat3 u_normal_matrix;
uniform vec3 u_view_position;

uniform mediump int u_spot_lights_count;
uniform mat4 u_spot_light_transform[MAX_SPOT_LIGHT_COLORS];

void main() {
	gl_Position = u_mvp * vec4(a_position, 1.0);
	vec4 vertex_position = u_model * vec4(a_position, 1.0);
	for (int i = 0; i < u_spot_lights_count; ++i) {
		f_spotlight_positions[i] = u_spot_light_transform[i] * vertex_position;
	}
	f_position = vec3(vertex_position);
	f_to_view = u_view_position - f_position;
	f_normal = u_normal_matrix * a_normal;
	f_uv = a_uv;
}
`,

//=========================================== FRAGMENT ===========================================//

frag : /* glsl */ `#version 300 es
precision mediump float;

${SHADERS_COMMON.LIGHTING_CONSTANTS}

in vec4 f_spotlight_positions[MAX_SPOT_LIGHT_COLORS];
in vec3 f_position;
in vec3 f_normal;
in vec3 f_to_view;
in vec2 f_uv;

out vec4 frag_color;

${SHADERS_COMMON.LIGHTING_STRUCTURES}
${SHADERS_COMMON.MATERIAL_STRUCTURE}

uniform DirectionalLight u_dir_light;
uniform int              u_point_lights_count;
uniform PointLight       u_point_lights[MAX_POINT_LIGHT_COLORS];
uniform int              u_spot_lights_count;
uniform SpotLight        u_spot_lights[MAX_SPOT_LIGHT_COLORS];
uniform Material         u_material;

uniform mediump sampler2DArray u_spotlight_shadow_map; // shadow map ALWAYS FIRST!!!!
uniform sampler2D u_diffuse;

${SHADERS_COMMON.LIGHTING_UTILITIES}
${SHADERS_COMMON.SHADOW_CALCULATION}

void main() {
	vec3 texel = texture(u_diffuse, f_uv).xyz;
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
		// float bias = max(0.001 * (1.0 - diffuse_component), 0.0001);
		float shadow = 1.0 - calc_shadow(f_spotlight_positions[i], i, 0.0001, 1);
		float intensity = shadow * (spot_intensity(spot_factor, spot.limits) / att);
		ambient += spot.properties.ambient * intensity;
		diffuse += spot.properties.diffuse * diffuse_component * intensity;
		specular += spot.properties.specular * calc_specular(to_light, to_view, normal, u_material.shininess) * intensity;
	}

	ambient *= u_material.ambient * texel;
	diffuse *= u_material.diffuse * texel;
	specular *= u_material.specular;

	frag_color = vec4(ambient + diffuse + specular, 1.0);
}
`

//================================================================================================//

} });


