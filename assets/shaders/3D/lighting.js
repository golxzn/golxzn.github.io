Object.assign(SHADERS["3D"], { LIGHTING : {

vert : /* glsl */ `#version 300 es

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;

out vec3 f_position;
out vec3 f_normal;
out vec2 f_uv;

uniform mat4 u_model_view;
uniform mat4 u_projection;
uniform mat3 u_normal_matrix;

void main() {
	vec4 mv_position = u_model_view * vec4(a_position, 1.0);
	gl_Position = u_projection * mv_position;
	f_position = mv_position.xyz;
	f_normal = u_normal_matrix * a_normal;
	f_uv = a_uv;
}
`,


frag : /* glsl */ `#version 300 es
precision mediump float;

in vec3 f_position;
in vec3 f_normal;
in vec2 f_uv;

out vec4 frag_color;

struct DirectionalLight {
	vec3 direction;
	vec3 color;
};

struct PointLight {
	vec3 position;
	vec3 color;

	// Attenuation
	float att_constant;
	float att_linear;
	float att_qubic;
};

struct Material {
	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
	float shininess;
};

const PointLight u_point_light = PointLight(
	vec3(0.0, 0.5, 0.0),
	vec3(1.0, 0.1, 1.0),
	1.0, 0.22, 0.2
);

uniform DirectionalLight u_dir_light;
uniform Material u_material;

uniform sampler2D u_texture_0; // diffuse

float attenuation(PointLight light, float dist) {
	return 1.0 / (light.att_constant + light.att_linear * dist + light.att_qubic * dist * dist);
}

void main() {
	vec3 normal = normalize(f_normal);
	vec3 to_light = normalize(-u_dir_light.direction);
	vec3 to_view = normalize(-f_position);
	vec3 texel = texture(u_texture_0, f_uv).xyz;

	// Directional Light
	vec3 ambient = u_material.ambient * u_dir_light.color;

	float diffuse_component = max(dot(to_light, normal), 0.0);
	vec3 diffuse = u_material.diffuse * diffuse_component * texel;

	float specular_component = pow(max(dot(to_view, reflect(-to_light, normal)), 0.0), u_material.shininess);
	vec3 specular = u_material.specular * specular_component * u_dir_light.color;


	// Point Light
	vec3 to_point_light = u_point_light.position - f_position;
	float to_point_light_dist = length(to_point_light);
	to_point_light = normalize(to_point_light);
	float att = attenuation(u_point_light, to_point_light_dist);

	vec3 point_ambient = u_material.ambient * u_point_light.color * att;

	float point_diffuse_component = max(dot(to_point_light, normal), 0.0) * att;
	vec3 point_diffuse = u_material.diffuse * (point_diffuse_component * texel);

	vec3 point_reflection = reflect(-to_point_light, normal);
	float point_specular_component = pow(max(dot(to_view, point_reflection), 0.0), u_material.shininess) * att;
	vec3 point_specular = u_material.specular * point_specular_component * u_point_light.color;

	ambient += point_ambient;
	diffuse += point_diffuse;
	specular += point_specular;

	frag_color = vec4((ambient + diffuse + specular) * texel, 1.0);
}
`

} });


