const SHADER_DEFINITIONS = {
	TEXTURE_ALBEDO                    : "MATERIAL_TEXTURE_ALBEDO",
	TEXTURE_NORMAL                    : "MATERIAL_TEXTURE_NORMAL",
	TEXTURE_SPECULAR                  : "MATERIAL_TEXTURE_SPECULAR",
	TEXTURE_METALLIC_ROUGHNESS        : "MATERIAL_TEXTURE_METALLIC_ROUGHNESS",
	TEXTURE_AMBIENT_OCCLUSION         : "MATERIAL_TEXTURE_AMBIENT_OCCLUSION",
	TEXTURE_AMBIENT_METALLIC_ROUGHNESS: "MATERIAL_TEXTURE_AMBIENT_METALLIC_ROUGHNESS",
	TEXTURE_EMISSIVE                  : "MATERIAL_TEXTURE_EMISSIVE",
};
Object.freeze(SHADER_DEFINITIONS)

class pbr_pipeline_builder {
	constructor(primitive = null, accessors = null, materials = null) {
		this.attributes = []; // { type: "", name: "" }
		this.definitions = [];
		this.properties = null;
		this.scan(primitive, accessors, materials);
	}

	scan(primitive, accessors, materials) {
		if (golxzn.any_of(null, primitive, accessors, materials)) {
			return this;
		}

		this._scan_attributes(primitive.attributes, accessors);
		if (golxzn.within_range(materials, primitive.material)) {
			this._scan_material(materials[primitive.material]);
		}

		return this;
	}

	generate() {
		return {
			vert: this._generate_vertex(),
			frag: this._generate_fragment(),
			properties: this.properties
		};
	}

	make_hash() {
		var hash = golxzn.strings_hash(this.definitions);
		for (const attribute of this.attributes) {
			hash ^= golxzn.strings_hash([attribute.type, attribute.name]);
		}
		return hash;
	}

	_scan_attributes(attributes, accessors) {
		this.attributes = [];
		for (const [name, id] of Object.entries(attributes)) {
			this.definitions.push(`SUPPORT_${name}`);

			const accessor = accessors[id];
			this.attributes.push({
				type: accessor.type.toLowerCase(),
				name: name
			});
		}

		if (!primitive.tangents_required(attributes)) return;

		this.definitions.push(`SUPPORT_${ATTRIBUTE_NAMES.TANGENT}`);
		this.attributes.push({ type: "vec4", name: ATTRIBUTE_NAMES.TANGENT });
	}

	_scan_material(material) {
		if (!material) return;

		this.properties = {};
		Object.assign(this.properties, PIPELINE_DEFAULT_PROPERTIES);
		this.properties.flags |=
			PIPELINE_FLAGS.lighting_support |
			PIPELINE_FLAGS.material_support
		;

		const pbr = material.pbrMetallicRoughness;
		if (pbr.baseColorTexture) {
			this.definitions.push(SHADER_DEFINITIONS.TEXTURE_ALBEDO)
		}
		if (pbr.metallicRoughnessTexture && material.occlusionTexture &&
			pbr.metallicRoughnessTexture.index == material.occlusionTexture.index
		) {
			this.definitions.push(SHADER_DEFINITIONS.TEXTURE_AMBIENT_METALLIC_ROUGHNESS)
		} else {
			if (pbr.metallicRoughnessTexture) {
				this.definitions.push(SHADER_DEFINITIONS.TEXTURE_METALLIC_ROUGHNESS);
			}
			if (pbr.occlusionTexture) {
				this.definitions.push(SHADER_DEFINITIONS.TEXTURE_AMBIENT_OCCLUSION);
			}
		}

		if (material.emissiveTexture) {
			this.definitions.push(SHADER_DEFINITIONS.TEXTURE_EMISSIVE);
		}

		if (material.normalTexture) {
			this.definitions.push(SHADER_DEFINITIONS.TEXTURE_NORMAL)
		}
	}

	_make_definitions() {
		return this.definitions.reduce(
			(result, definition) => `${result}#define ${definition}\n`,
			""
		);
	}

	_make_attributes() {
		return this.attributes.reduce((result, attribute, id) => {
			return result + `layout(location = ${id}) in ${attribute.type} ${attribute.name};\n`
		}, "");
	}


	_generate_vertex() {
		return /* glsl */ `#version 300 es
${this._make_definitions()}
${this._make_attributes()}

out vec3 f_position;
#if defined(SUPPORT_TANGENT) && defined(SUPPORT_NORMAL)
out mat3 f_TBN;
#elif defined(SUPPORT_NORMAL)
out vec3 f_normal;
#endif

#if defined(SUPPORT_TEXCOORD_0)
out vec2 f_uv0;
#endif
#if defined(SUPPORT_TEXCOORD_1)
out vec2 f_uv1;
#endif

uniform mat4 u_mvp;
uniform mat4 u_model;
#if defined(SUPPORT_NORMAL)
uniform mat3 u_normal_matrix;
#endif

void main() {
	vec4 position = vec4(POSITION, 1.0);
	gl_Position = u_mvp * position;

	f_position = vec3(u_model * position);
#if defined(SUPPORT_TEXCOORD_0)
	f_uv0 = TEXCOORD_0; /// @todo apply uv transform?
#endif
#if defined(SUPPORT_TEXCOORD_1)
	f_uv1 = TEXCOORD_1;
#endif

#if defined(SUPPORT_NORMAL)
	vec3 normal = normalize(u_normal_matrix * NORMAL);
#if defined(SUPPORT_TANGENT)
	vec3 tangent   = normalize(u_normal_matrix * normalize(TANGENT.xyz));
	vec3 bitangent = normalize(vec3(cross(normal, tangent) * TANGENT.w));
	f_TBN = mat3(tangent, bitangent, normal);
#else
	f_normal = normal;
#endif // defined(SUPPORT_TANGENT)
#endif // defined(SUPPORT_NORMAL)
}
`;
	}

	_generate_fragment() {
		return /* glsl */ `#version 300 es
precision mediump float;

${this._make_definitions()}

in vec3 f_position;

#if defined(SUPPORT_TANGENT) && defined(SUPPORT_NORMAL)
in mat3 f_TBN;
#elif defined(SUPPORT_NORMAL)
in vec3 f_normal;
#endif

#if defined(SUPPORT_TEXCOORD_0)
in vec2 f_uv0;
#endif
#if defined(SUPPORT_TEXCOORD_1)
in vec2 f_uv1;
#endif

layout(location = 0) out vec4 frag_albedo;
layout(location = 1) out vec3 frag_position;
layout(location = 2) out vec3 frag_normal;
layout(location = 3) out vec4 frag_emissive;
layout(location = 4) out vec3 frag_occlusion_roughness_metallic;

#define ALBEDO_ID 0
#define NORMAL_ID 1
#define METALLIC_ROUGHNESS_ID 2
#define AMBIENT_OCCLUSION_ID 3
#define EMISSIVE_ID 4

struct Material {
#if defined(${SHADER_DEFINITIONS.TEXTURE_ALBEDO})
	sampler2D albedo;
#endif
#if defined(${SHADER_DEFINITIONS.TEXTURE_NORMAL})
	sampler2D normal;
#endif
#if defined(${SHADER_DEFINITIONS.TEXTURE_AMBIENT_METALLIC_ROUGHNESS})
	sampler2D occlusion_roughness_metallic;
#else
#if defined(${SHADER_DEFINITIONS.TEXTURE_METALLIC_ROUGHNESS})
	sampler2D metallic_roughness;
#endif
#if defined(${SHADER_DEFINITIONS.TEXTURE_AMBIENT_OCCLUSION})
	sampler2D ambient_occlusion;
#endif
#endif // TEXTURE_AMBIENT_METALLIC_ROUGHNESS
#if defined(${SHADER_DEFINITIONS.TEXTURE_EMISSIVE})
	sampler2D emissive;
#endif

	vec4 base_color_factor;
	vec3 emissive_factor;
	float metallic_factor;
	float roughness_factor;
	float alpha_cutoff;
#if defined(SUPPORT_TEXCOORD_0) && defined(SUPPORT_TEXCOORD_1)
	int uv_usage_mask; // from left to right in order of textures, 0 bit is uv0, 1 is uv1
#endif // defined(SUPPORT_TEXCOORD_0) && defined(SUPPORT_TEXCOORD_1)
};

uniform Material u_material;

vec2 select_uv(int id) {
#if defined(SUPPORT_TEXCOORD_0) && defined(SUPPORT_TEXCOORD_1)
	return (1 & (u_material.uv_usage_mask >> id)) == 0 ? f_uv0 : f_uv1;
#elif defined(SUPPORT_TEXCOORD_0)
	return f_uv0;
#elif defined(SUPPORT_TEXCOORD_1)
	return f_uv1;
#else
	return vec2(0.0);
#endif
}

vec4 make_albedo(in Material mat) {
	return mat.base_color_factor
#if defined(${SHADER_DEFINITIONS.TEXTURE_ALBEDO})
		* texture(mat.albedo, select_uv(ALBEDO_ID))
#endif
	;
}

vec3 make_normal(in Material mat) {
#if defined(${SHADER_DEFINITIONS.TEXTURE_NORMAL})
	vec3 surface_normal = texture(mat.normal, select_uv(NORMAL_ID)).xyz * 2.0 - 1.0;
	return normalize(
#if defined(SUPPORT_TANGENT) && defined(SUPPORT_NORMAL)
		f_TBN * surface_normal
#elif defined(SUPPORT_NORMAL)
		// surface_normal
		// f_normal
		mix(f_normal, surface_normal, 0.5)
#else
		surface_normal
#endif //  defined(SUPPORT_TANGENT) && defined(SUPPORT_NORMAL)
	);

#else // No normal texture

	return
#if defined(SUPPORT_TANGENT) && defined(SUPPORT_NORMAL)
		f_TBN[2]
#elif defined(SUPPORT_NORMAL)
		f_normal
#else
		vec3(0.0)
#endif //  defined(SUPPORT_TANGENT) && defined(SUPPORT_NORMAL)
	;

#endif // defined(SHADER_DEFINITIONS.TEXTURE_NORMAL)
}

vec4 make_emissive(in Material mat) {
	return vec4(mat.emissive_factor, 1.0) /// @todo I'm not sure we should multiply it
#if defined(${SHADER_DEFINITIONS.TEXTURE_EMISSIVE})
		* texture(mat.emissive, select_uv(EMISSIVE_ID))
#endif
	;
}

vec3 make_occlusion_roughness_metallic(in Material mat) {
#if !defined(${SHADER_DEFINITIONS.TEXTURE_AMBIENT_METALLIC_ROUGHNESS})

#if defined(${SHADER_DEFINITIONS.TEXTURE_AMBIENT_OCCLUSION})
	float occlusion = texture(mat.ambient_occlusion, select_uv(AMBIENT_OCCLUSION_ID)).r;
#else
	const float occlusion = 1.0;
#endif

#if defined(${SHADER_DEFINITIONS.TEXTURE_METALLIC_ROUGHNESS})
	vec2 metallic_roughness = texture(mat.metallic_roughness, select_uv(METALLIC_ROUGHNESS_ID)).gb;
#else
	vec2 metallic_roughness = vec2(mat.metallic_factor, mat.roughness_factor);
#endif

#else // ambient and metallic_roughness are same texture
	float occlusion = texture(mat.occlusion_roughness_metallic, select_uv(AMBIENT_OCCLUSION_ID)).r;
	vec2 metallic_roughness = texture(mat.occlusion_roughness_metallic, select_uv(METALLIC_ROUGHNESS_ID)).gb;
#endif // SHADER_DEFINITIONS.TEXTURE_AMBIENT_METALLIC_ROUGHNESS

	return vec3(occlusion, metallic_roughness);
}

void main() {
	vec4 albedo = make_albedo(u_material);
	if (albedo.a < u_material.alpha_cutoff) discard;

	frag_albedo = albedo;
	frag_position = f_position;
	frag_normal = make_normal(u_material);
	frag_emissive = make_emissive(u_material);
	frag_occlusion_roughness_metallic = make_occlusion_roughness_metallic(u_material);
}
`;
	}
};