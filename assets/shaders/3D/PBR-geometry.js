Object.assign(SHADERS["3D"], { PBR_GEOMETRY : {

// >----------------------------------< VERTEX >----------------------------------< //

vert : /* glsl */ `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;

out vec3 f_position;
out vec3 f_normal;
out vec2 f_uv;

uniform mat4 u_mvp;
uniform mat4 u_model;
uniform mat3 u_normal_matrix;

void main() {
	vec4 position = vec4(a_position, 1.0);

	gl_Position = u_mvp * position;

	f_position = vec3(u_model * position);
	f_normal = normalize(u_normal_matrix * a_normal);
	f_uv = vec2(a_uv.x, -a_uv.y);
}
`,

// >---------------------------------< FRAGMENT >---------------------------------< //

frag : /* glsl */ `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

in vec3 f_position;
in vec3 f_normal;
in vec2 f_uv;

layout(location = 0) out vec4 frag_albedo;
layout(location = 1) out vec3 frag_position;
layout(location = 2) out vec3 frag_normal;
layout(location = 3) out vec3 frag_ambient_occlusion;
layout(location = 4) out vec2 frag_metallic_roughness;

struct Material {
	sampler2D albedo;
	sampler2D normal;
	sampler2D metallic_roughness;
	sampler2D ambient_occlusion;
	float metallic_factor;
	float roughness_factor;
};

uniform Material u_material;

vec3 make_normal(sampler2D surface_normal) {
 	/// @todo apply f_normal. I'm not sure that this is correct way to do so
	return normalize(texture(surface_normal, f_uv).rgb + f_normal);
}

vec2 make_metallic_roughness(sampler2D metallic_roughness) {
	return texture(metallic_roughness, f_uv).rg
		* vec2(u_material.metallic_factor, u_material.roughness_factor);
	;
}

void main() {
	frag_position = f_position;
	frag_albedo = texture(u_material.albedo, f_uv);
	frag_normal = make_normal(u_material.normal);
	frag_metallic_roughness = make_metallic_roughness(u_material.metallic_roughness);
	frag_ambient_occlusion = texture(u_material.ambient_occlusion, f_uv).rgb;
}
`

} });
