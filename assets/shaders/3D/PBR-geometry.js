Object.assign(SHADERS["3D"], { PBR_GEOMETRY : {

properties : {
	flags: PIPELINE_FLAGS.material_support
},

// >----------------------------------< VERTEX >----------------------------------< //

vert : /* glsl */ `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;
layout(location = 3) in vec4 a_tangent;

out vec3 f_position;
out vec3 f_normal;
out vec2 f_uv;
out vec3 f_tangent;
out vec3 f_bitangent;

uniform mat4 u_mvp;
uniform mat4 u_model;
uniform mat3 u_normal_matrix;

void main() {
	vec4 position = vec4(a_position, 1.0);

	gl_Position = u_mvp * position;

	f_position = vec3(u_model * position);
	f_normal = normalize(u_normal_matrix * a_normal);
	f_uv = a_uv;
	f_tangent = a_tangent.xyz;
	f_bitangent = cross(f_normal, a_tangent.xyz) * a_tangent.w;
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
in vec3 f_normal;
in vec2 f_uv;
in vec3 f_tangent; /// @todo ParallaxMapping maybe?
in vec3 f_bitangent;

layout(location = 0) out vec4 frag_albedo;
layout(location = 1) out vec3 frag_position;
layout(location = 2) out vec3 frag_normal;
layout(location = 3) out vec3 frag_emissive;
layout(location = 4) out vec3 frag_occlusion_roughness_metallic;

struct Material {
	sampler2D albedo;
	sampler2D normal;
	sampler2D occlusion_roughness_metallic;
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

vec4 make_albedo(Material mat) {
	if (has_texture(MASK_OFFSET_ALBEDO)) {
		return texture(mat.albedo, f_uv) * mat.base_color_factor;
	}
	return mat.base_color_factor;
}

vec3 make_normal(sampler2D surface_normal) {
	if (has_texture(MASK_OFFSET_NORMAL)) {
 	/// @todo apply f_normal. I'm not sure that this is correct way to do so
		return normalize(texture(surface_normal, f_uv).rgb + f_normal);
	}
	return f_normal;
}

vec3 make_emissive(sampler2D emissive_surface) {
	if (has_texture(MASK_OFFSET_EMISSIVE)) {
		return texture(emissive_surface, f_uv).xyz;
	}
	return u_material.emissive_factor;
}

vec3 make_occlusion_roughness_metallic() {
	vec3 default_color = vec3(1.0, u_material.metallic_factor, u_material.roughness_factor);
	vec3 color = texture(u_material.occlusion_roughness_metallic, f_uv).rgb * default_color;

	if (!has_texture(MASK_OFFSET_METALLIC_ROUGHNESS)) {
		color = vec3(color.r, default_color.g, default_color.b);
	}
	if (!has_texture(MASK_OFFSET_AMBIENT_OCCLUSION)) {
		color.r = default_color.r;
	}
	return color;
}

vec3 pack(vec3 value, float coeff) {
	return (value * coeff) + vec3(0.5);
}

void main() {
	vec4 albedo = make_albedo(u_material);
	if (albedo.a < u_material.alpha_cutoff) discard;

	frag_position = pack(f_position, 0.025);
	frag_albedo = albedo;
	frag_normal = pack(make_normal(u_material.normal), 0.5);
	frag_emissive = make_emissive(u_material.emissive);
	frag_occlusion_roughness_metallic = make_occlusion_roughness_metallic();
}
`

} });
