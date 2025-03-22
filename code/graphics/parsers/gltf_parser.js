
function within_range(array, id) {
	return id >= 0 && id < array.length;
}

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

		if (!within_range(gltf.materials, material_id)) {
			return null;
		}

		const take_texture = (info) => {
			if (info == null) {
				return null;
			}
			if (!within_range(gltf.textures, info.index)) {
				return null;
			}
			const texture = gltf.textures[info.index];
			return this._get_texture(texture.source);
		};

		const material_info = gltf.materials[material_id];
		const pbr = material_info.pbrMetallicRoughness;
		return new material({
			metallic_factor: pbr.metallicFactor,
			roughness_factor: pbr.roughnessFactor,
			albedo: take_texture(pbr.baseColorTexture),
			normal: take_texture(material_info.normalTexture),
			metallic_roughness: take_texture(pbr.metallicRoughnessTexture),
			ambient_occlusion: take_texture(material_info.occlusionTexture)
		})
	}

	parse_mesh(mesh_id = 0) {
		const gltf = this.gltf;

		if (!within_range(gltf.meshes, mesh_id)) {
			return null;
		}
		const mesh_info = gltf.meshes[mesh_id];

		var created_mesh = new mesh({
			name: mesh_info.name,
			primitives: mesh_info.primitives.map((info, id) => new primitive(id, info))
		});
		created_mesh.bind();
		for (const prim of created_mesh.primitives) {
			const info = mesh_info.primitives[prim.id];
			prim.material = this.parse_material(info.material);

			// It seems like primitive could actually hold more than 1 buffer,
			// but docs said "no", so let's take the first valid buffer and pray
			// it works
			const attributes = info.attributes;
			for (const [_name, id] of Object.entries(attributes)) {
				prim.set_buffer_data(
					this._get_buffer(gltf.bufferViews[gltf.accessors[id].bufferView].buffer)
				);
			}

			prim.setup_attributes(attributes, gltf.accessors, gltf.bufferViews);
			created_mesh.unbind()
		}
		created_mesh.unbind();

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

		if (!within_range(gltf[field_name], id)) {
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
		const resources = get_service("resource");
		const paths = this.gltf.images.map((image) => this.directory + image.uri);
		this._textures = await resources.preload_textures(paths);
	}

	_get_preload(buffer, index) {
		if (within_range(buffer, index)) {
			return buffer[index];
		}
		return null;
	}

};
