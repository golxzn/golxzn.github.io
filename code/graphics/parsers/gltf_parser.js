
class gltf_loader {

	/** @param {String} path  */
	constructor(path, gltf = null) {
		this.path = path;
		this.directory = path.substring(0, path.lastIndexOf('/') + 1);
		this.gltf = gltf;
		this._buffers = [];
		this._textures = [];
	}

	invalid() {
		return this.gltf == null && !this.gltf_loading;
	}

	async load() {
		if (this.gltf == null) {
			this.gltf = await get_service("resource").load_config(this.path);
		}

		await this._preload_textures();
		await this._preload_buffers();

		return "scene" in this.gltf ? this.parse_scene(this.gltf["scene"]) : null;
	}

	parse_material(material_id) {
		const gltf = this.gltf;

		if (!golxzn.within_range(gltf.materials, material_id)) {
			return null;
		}

		const take_texture = (info) => {
			if (info == null) {
				return null;
			}
			if (!golxzn.within_range(gltf.textures, info.index)) {
				return null;
			}
			const texture = gltf.textures[info.index];
			return this._get_texture(texture.source);
		};
		const convert_mode = (mode_name) => {
			switch (mode_name) {
				case "OPAQUE": return ALPHA_MODE.OPAQUE;
				case "MASK":   return ALPHA_MODE.MASK;
				case "BLEND":  return ALPHA_MODE.BLEND;
			}
			return ALPHA_MODE.OPAQUE;
		};
		const get_emissive_factor = (info) => {
			if (info.extensions && info.extensions.KHR_materials_emissive_strength) {
				return golxzn.math.scale(info.emissiveFactor,
					info.extensions.KHR_materials_emissive_strength.emissiveStrength
				);
			}
			return info.emissiveFactor;
		};

		const load_textures = (info, pbr) => {
			var textures = new Map([
				[ALBEDO_NAME  , take_texture(pbr.baseColorTexture)],
				[NORMAL_NAME  , take_texture(info.normalTexture)],
				[EMISSIVE_NAME, take_texture(info.emissiveTexture)],
			]);
			if (info.occlusionTexture && pbr.metallicRoughnessTexture &&
				info.occlusionTexture.index == pbr.metallicRoughnessTexture.index
			) {
				textures.set(OCCLUSION_METALLIC_ROUGHNESS_NAME, take_texture(info.occlusionTexture));
			} else {
				textures.set(METALLIC_ROUGHNESS_NAME, take_texture(pbr.metallicRoughnessTexture));
				textures.set(AMBIENT_OCCLUSION_NAME, take_texture(info.occlusionTexture));
			}

			for (const [name, texture] of textures) {
				if (texture == null) textures.delete(name);
			}

			return textures;
		};

		/// @todo generate uv usage bitset

		const material_info = gltf.materials[material_id];
		const pbr = material_info.pbrMetallicRoughness;
		return new material({
			textures: load_textures(material_info, pbr),
			metallic_factor   : pbr.metallicFactor,
			emissive_factor   : get_emissive_factor(material_info),
			roughness_factor  : pbr.roughnessFactor,
			base_color_factor : pbr.baseColorFactor,
			alpha_cutoff      : material_info.alphaCutoff,
			alpha_mode        : convert_mode(material_info.alphaMode)
		});
	}

	parse_mesh(mesh_id = 0) {
		const gltf = this.gltf;

		if (!golxzn.within_range(gltf.meshes, mesh_id)) {
			return null;
		}

		const pipelines = get_service("pipeline");
		const mesh_info = gltf.meshes[mesh_id];
		var created_mesh = new mesh({
			name: mesh_info.name,
			primitives: mesh_info.primitives.map((info, id) => {
				const prim = new primitive(id, info);
				prim.material = this.parse_material(info.material);

				const builder = new pbr_pipeline_builder(info, gltf.accessors, gltf.materials);
				const hash = builder.make_hash();
				if (!pipelines.has_pipeline(hash)) {
					/// @todo it could be async
					pipelines.emplace(hash, builder.generate());
				}
				prim.pipeline_id = hash;

				prim.setup(info.attributes, gltf.accessors, gltf.bufferViews, this._buffers);
				return prim;
			})
		});

		return created_mesh;
	}

	parse_node(node_id = 0) {
		return this._parse_(node_id, "nodes", "children", (child, info) => {
			console.error("[gltf_loader] Cannot parse child node '",
				child.name, "' of node '", info
			);
		});
	}

	parse_scene(scene_id = 0) {
		const gltf = this.gltf;
		if ("scenes" in gltf && golxzn.within_range(gltf.scenes, scene_id)) {
			const scene = gltf.scenes[scene_id];
			if (scene.nodes.length == 1) {
				return this.parse_node(scene.nodes[0]);
			}
		}

		return this._parse_(scene_id, "scenes", "nodes", (child, info) => {
			console.error("[gltf_loader] Cannot parse node '",
				child.name, "' of scene '", info.name, "'"
			);
		});
	}

	_parse_(id, field_name, children_field_name, on_child_load_error = (child, info) => {}) {
		const gltf = this.gltf;
		if (!(field_name in gltf)) {
			return null;
		}

		if (!golxzn.within_range(gltf[field_name], id)) {
			return null;
		}

		const info = gltf[field_name][id];

		var target = new node({
			name: info.name,
			trans: new transform({
				matrix: info.matrix || null,
				position: info.translation || null,
				rotation: info.rotation || null,
				scale: info.scale || null
			}),
			mesh: info.mesh != null ? this.parse_mesh(info.mesh) : null,
		});
		if (!(children_field_name in info)) return target;

		for (const child of info[children_field_name]) {
			const node = this.parse_node(child);
			if (node == null) {
				on_child_load_error(child, info);
				continue;
			}
			node.parent = target; // Will push to children
		}

		return target;
	}

	_get_buffer(index) {
		return this._get_preload(this._buffers, index);
	}
	_get_texture(index) {
		return this._get_preload(this._textures, index);
	}

	async _preload_buffers() {
		const resources = get_service("resource");
		const paths = this.gltf.buffers.map((buffer) => this.directory + buffer.uri);
		this._buffers = await resources.preload_buffers(paths);
	}

	async _preload_textures() {
		const gltf = this.gltf;
		if (gltf.textures == null) return;

		const paths = [];
		for (var i = 0; i < gltf.textures.length; ++i) {
			const texture_info = gltf.textures[i];
			const image = gltf.images[texture_info.source];
			paths.push({
				path: this.directory + image.uri,
				sampler: texture_info.sampler ? gltf.samplers[texture_info.sampler] : null
			});
		}

		const resources = get_service("resource");
		this._textures = await resources.preload_textures(paths);
	}

	_get_preload(buffer, index) {
		if (golxzn.within_range(buffer, index)) {
			return buffer[index];
		}
		return null;
	}

};
