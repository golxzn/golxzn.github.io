Object.assign(SHADERS["3D"], { PBR_GEOMETRY : {

properties : {
	flags: PIPELINE_FLAGS.material_support
},

// >----------------------------------< VERTEX >----------------------------------< //

vert : /* glsl */ `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location = 0) in vec3 POSITION;
layout(location = 1) in vec3 NORMAL;
layout(location = 2) in vec4 TANGENT;
layout(location = 3) in vec2 TEXCOORD_0;
layout(location = 4) in vec2 TEXCOORD_1;

out vec3 f_position;
out vec2 f_uv;
out mat3 f_TBN;
flat out int f_tangent_exists;

uniform mat4 u_mvp;
uniform mat4 u_model;
uniform mat3 u_normal_matrix;

void main() {
	vec4 position = vec4(POSITION, 1.0);

	gl_Position = u_mvp * position;

	f_position = vec3(u_model * position);
	f_uv = TEXCOORD_0;

	vec3 normal    = normalize(u_normal_matrix * NORMAL);
	f_TBN[2] = normal;
	f_tangent_exists = TANGENT.xyz != vec3(0.0) ? 1 : 0;

	if (f_tangent_exists == 1) {
		vec3 tangent   = normalize(u_normal_matrix * normalize(TANGENT.xyz));
		// tangent -= dot(tangent, normal) * normal;
		vec3 bitangent = normalize(vec3(cross(normal, tangent) * TANGENT.w));

		f_TBN[0] = tangent;
		f_TBN[1] = bitangent;
	}
}
`,

// >---------------------------------< FRAGMENT >---------------------------------< //

frag : /* glsl */ `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

const int MASK_OFFSET_ALBEDO = (1 << 0);
const int MASK_OFFSET_NORMAL = (1 << 1);
const int MASK_OFFSET_METALLIC_ROUGHNESS = (1 << 2);
const int MASK_OFFSET_AMBIENT_OCCLUSION = (1 << 3);
const int MASK_OFFSET_EMISSIVE = (1 << 4);

in vec3 f_position;
in vec2 f_uv;
in mat3 f_TBN;
flat in int f_tangent_exists;

layout(location = 0) out vec4 frag_albedo;
layout(location = 1) out vec3 frag_position;
layout(location = 2) out vec3 frag_normal;
layout(location = 3) out vec4 frag_emissive;
layout(location = 4) out vec3 frag_occlusion_metallic_roughness;

struct Material {
	sampler2D albedo;
	sampler2D normal;
	sampler2D occlusion_metallic_roughness;
	sampler2D emissive;
	vec4 base_color_factor;
	vec3 emissive_factor;
	float metallic_factor;
	float roughness_factor;
	float alpha_cutoff;
	int textures_mask;
};

uniform Material u_material;

bool has_texture(int mask) {
	return (u_material.textures_mask & mask) == mask;
}

vec4 make_albedo(in Material mat) {
	if (has_texture(MASK_OFFSET_ALBEDO)) {
		return texture(mat.albedo, f_uv) * mat.base_color_factor;
	}
	return mat.base_color_factor;
}

vec3 make_normal(in Material mat) {
	if (has_texture(MASK_OFFSET_NORMAL) && f_tangent_exists == 1) {
		return normalize(f_TBN * (texture(mat.normal, f_uv).xyz * 2.0 - 1.0));
	}
	return normalize(f_TBN[2]);
}

vec4 make_emissive(in Material mat) {
	if (has_texture(MASK_OFFSET_EMISSIVE)) {
		return texture(mat.emissive, f_uv);
	}
	return vec4(mat.emissive_factor, 1.0);
}

vec3 make_occlusion_metallic_roughness(in Material mat) {
	vec3 default_color = vec3(1.0, mat.metallic_factor, mat.roughness_factor);
	vec3 color = texture(mat.occlusion_metallic_roughness, f_uv).rgb;// * default_color;

	if (!has_texture(MASK_OFFSET_METALLIC_ROUGHNESS)) {
		color.gb = default_color.gb;
	}
	if (!has_texture(MASK_OFFSET_AMBIENT_OCCLUSION)) {
		color.r = default_color.r;
	}
	return color;
}

void main() {
	vec4 albedo = make_albedo(u_material);
	if (albedo.a < u_material.alpha_cutoff) discard;

	frag_albedo = albedo;
	frag_position = f_position;
	frag_normal = make_normal(u_material);
	frag_emissive = make_emissive(u_material);
	frag_occlusion_metallic_roughness = make_occlusion_metallic_roughness(u_material);
}
`

} });
