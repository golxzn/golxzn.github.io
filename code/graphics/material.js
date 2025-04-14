const MATERIAL_UNIFORM = 'u_material_textures';

const ALBEDO_NAME                       = `${MATERIAL_UNIFORM}.albedo`
const NORMAL_NAME                       = `${MATERIAL_UNIFORM}.normal`
const OCCLUSION_METALLIC_ROUGHNESS_NAME = `${MATERIAL_UNIFORM}.occlusion_metallic_roughness`
const METALLIC_ROUGHNESS_NAME           = `${MATERIAL_UNIFORM}.metallic_roughness`
const AMBIENT_OCCLUSION_NAME            = `${MATERIAL_UNIFORM}.ambient_occlusion`
const EMISSIVE_NAME                     = `${MATERIAL_UNIFORM}.emissive`

const ALPHA_MODE = {
	OPAQUE: 0,
	MASK: 1,
	BLEND: 2,
};
Object.freeze(ALPHA_MODE);

const DEFAULT_MATERIAL_INFO = {
	textures: {},
	base_color_factor: [1.0, 1.0, 1.0, 1.0],
	emissive_factor: [0.0, 0.0, 0.0],
	metallic_factor: 1,
	roughness_factor: 1,
	alpha_cutoff: 0.5,
	alpha_mode: ALPHA_MODE.OPAQUE
};
Object.freeze(DEFAULT_MATERIAL_INFO);

const MATERIAL_CONSTANTS_OFFSETS = {
	base_color_factor_offset: 0,
	emissive_factor_offset  : 16,
	metallic_factor_offset  : 28,
	roughness_factor_offset : 32,
	alpha_cutoff_offset     : 36
};
Object.freeze(MATERIAL_CONSTANTS_OFFSETS);

class material {
	constructor(info = DEFAULT_MATERIAL_INFO) {
		this.textures = info.textures;
		this.data_block = new uniform_block(
			SHADERS_COMMON.UNIFORM_BLOCKS.MATERIAL_CONSTANTS,
			material.pack(info)
		);

		this.alpha_mode = info.alpha_mode != null ? info.alpha_mode : DEFAULT_MATERIAL_INFO.alpha_mode;
		this._applied_textures = 0;
	}

	/** @param {graphics} g  */
	activate(g) {
		const pipeline = g.current_pipeline();
		if (pipeline.support(PIPELINE_FLAGS.material_support)) {
			this.data_block.bind();
			switch (this.alpha_mode) {
				case ALPHA_MODE.BLEND:
					gl.enable(gl.BLEND);
					gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
					break;
				case ALPHA_MODE.MASK:
				case ALPHA_MODE.OPAQUE:
					gl.disable(gl.BLEND);
					break;
			}
		}

		if (pipeline.support(PIPELINE_FLAGS.material_textures_support)) {
			var applied = 0;
			for (const [name, texture] of this.textures) {
				if (texture) applied += +g.apply_texture(texture, name);
			}

			this._applied_textures = applied;
		}
	}

	/** @param {graphics} g  */
	deactivate(g) {
		const pipeline = g.current_pipeline();
		if (pipeline.support(PIPELINE_FLAGS.material_textures_support)) {
			g.remove_textures(this._applied_textures);
		}
		if (pipeline.support(PIPELINE_FLAGS.material_support)) {
			this.data_block.unbind();
		}
	}

	/** @param {number[4]} value */
	set base_color_factor(value) {
		if (value.length != 4) return;
		this.data_block.update(new Float32Array(value), MATERIAL_CONSTANTS_OFFSETS.base_color_factor_offset);
	}

	/** @param {number[3]} value */
	set emissive_factor(value) {
		if (value.length != 3) return;
		this.data_block.update(new Float32Array(value), MATERIAL_CONSTANTS_OFFSETS.emissive_factor_offset);
	}

	/** @param {number} value */
	set metallic_factor(value) {
		this.data_block.update(new Float32Array([value]), MATERIAL_CONSTANTS_OFFSETS.metallic_factor_offset);
	}

	/** @param {number} value */
	set roughness_factor(value) {
		this.data_block.update(new Float32Array([value]), MATERIAL_CONSTANTS_OFFSETS.roughness_factor_offset);
	}

	/** @param {number} value */
	set alpha_cutoff(value) {
		this.data_block.update(new Float32Array([value]), MATERIAL_CONSTANTS_OFFSETS.alpha_cutoff_offset);
	}

	static pack(params) {
		const vec4_length = 4;
		const vec3_length = 3;
		const extract = (property) => {
			if (property in params && params[property] != null) {
				return params[property];
			}
			return DEFAULT_MATERIAL_INFO[property];
		};
		const emplace = (buffer, value, offset) => {
			buffer.set(value, offset);
			return value.length;
		};

		const buffer = new Float32Array(vec4_length + vec3_length * 2);

		var offset = emplace(buffer, extract("base_color_factor"), 0);
		offset += emplace(buffer, extract("emissive_factor"), offset);
		offset += emplace(buffer, [+extract("metallic_factor")], offset);
		offset += emplace(buffer, [+extract("roughness_factor")], offset);
		offset += emplace(buffer, [extract("alpha_cutoff")], offset);
		return buffer;
	}
};
