const ALBEDO_NAME = 'u_material.albedo'
const NORMAL_NAME = 'u_material.normal'
const METALLIC_ROUGHNESS_NAME = 'u_material.metallic_roughness'
const AMBIENT_OCCLUSION_NAME = 'u_material.ambient_occlusion'
const METALLIC_FACTOR = 'u_material.metallic_factor'
const ROUGHNESS_FACTOR = 'u_material.roughness_factor'

class material {
	constructor(info = {
		albedo: null,
		normal: null,
		metallic_roughness: null,
		ambient_occlusion: null,
		metallic_factor: 1,
		roughness_factor: 1,
	}) {
		this.albedo = info.albedo;
		this.normal = info.normal;
		this.metallic_roughness = info.metallic_roughness;
		this.ambient_occlusion = info.ambient_occlusion;

		this.metallic_factor = 0.0 + (info.metallic_factor != null ? info.metallic_factor : 1.0);
		this.roughness_factor = 0.0 + (info.roughness_factor != null ? info.roughness_factor : 1.0);
	}

	/** @param {graphics} g  */
	apply(g) {
		const pipeline = g.current_pipeline();
		this._set_if_exists(pipeline, METALLIC_FACTOR, this.metallic_factor);
		this._set_if_exists(pipeline, ROUGHNESS_FACTOR, this.roughness_factor);

		var applied = 0;
		if (this.albedo) applied += +g.apply_texture(this.albedo, ALBEDO_NAME);
		if (this.normal) applied += +g.apply_texture(this.normal, NORMAL_NAME);
		if (this.metallic_roughness) applied += +g.apply_texture(this.metallic_roughness, METALLIC_ROUGHNESS_NAME);
		if (this.ambient_occlusion) applied += +g.apply_texture(this.ambient_occlusion, AMBIENT_OCCLUSION_NAME);

		return applied;
	}

	_set_if_exists(pipeline, name, variable) {
		const location = pipeline.uniform_location(name)
		if (location != null) {
			pipeline.set_uniform(location, variable);
		}
	}
}