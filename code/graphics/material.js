const MATERIAL_UNIFORM = 'u_material';

const ALBEDO_NAME                       = `${MATERIAL_UNIFORM}.albedo`
const NORMAL_NAME                       = `${MATERIAL_UNIFORM}.normal`
const OCCLUSION_METALLIC_ROUGHNESS_NAME = `${MATERIAL_UNIFORM}.occlusion_metallic_roughness`
const METALLIC_ROUGHNESS_NAME           = `${MATERIAL_UNIFORM}.metallic_roughness`
const AMBIENT_OCCLUSION_NAME            = `${MATERIAL_UNIFORM}.ambient_occlusion`
const EMISSIVE_NAME                     = `${MATERIAL_UNIFORM}.emissive`
const BASE_COLOR_FACTOR                 = `${MATERIAL_UNIFORM}.base_color_factor`
const EMISSIVE_FACTOR                   = `${MATERIAL_UNIFORM}.emissive_factor`
const METALLIC_FACTOR                   = `${MATERIAL_UNIFORM}.metallic_factor`
const ROUGHNESS_FACTOR                  = `${MATERIAL_UNIFORM}.roughness_factor`
const ALPHA_CUTOFF                      = `${MATERIAL_UNIFORM}.alpha_cutoff`

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

class material {
	constructor(info = DEFAULT_MATERIAL_INFO) {
		this.textures = info.textures;

		this.base_color_factor = info.base_color_factor || DEFAULT_MATERIAL_INFO.base_color_factor;
		this.emissive_factor = info.emissive_factor || DEFAULT_MATERIAL_INFO.emissive_factor;
		this.metallic_factor = +(info.metallic_factor != null ? info.metallic_factor : DEFAULT_MATERIAL_INFO.metallic_factor);
		this.roughness_factor = +(info.roughness_factor != null ? info.roughness_factor : DEFAULT_MATERIAL_INFO.roughness_factor);
		this.alpha_cutoff = info.alpha_cutoff != null ? info.alpha_cutoff : DEFAULT_MATERIAL_INFO.alpha_cutoff;
		this.alpha_mode = info.alpha_mode != null ? info.alpha_mode : DEFAULT_MATERIAL_INFO.alpha_mode;

		this._applied_textures = 0;
	}

	/** @param {graphics} g  */
	activate(g) {
		const pipeline = g.current_pipeline();
		if (!pipeline.support(PIPELINE_FLAGS.material_support)) return;

		pipeline.try_set_uniform(METALLIC_FACTOR, () => this.metallic_factor);
		pipeline.try_set_uniform(EMISSIVE_FACTOR, () => this.emissive_factor);
		pipeline.try_set_uniform(ROUGHNESS_FACTOR, () => this.roughness_factor);
		pipeline.try_set_uniform(BASE_COLOR_FACTOR, () => this.base_color_factor);
		pipeline.try_set_uniform(ALPHA_CUTOFF, () => {
			return this.alpha_mode == ALPHA_MODE.MASK ? this.alpha_cutoff : 0.0;
		});
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

		var applied = 0;
		for (const [name, texture] of this.textures) {
			if (texture) applied += +g.apply_texture(texture, name);
		}

		this._applied_textures = applied;
	}

	/** @param {graphics} g  */
	deactivate(g) {
		const pipeline = g.current_pipeline();
		if (!pipeline.support(PIPELINE_FLAGS.material_support)) return;
		g.remove_textures(this._applied_textures);
	}

};
