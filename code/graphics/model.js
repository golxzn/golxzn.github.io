
class group {
	constructor(pipeline, meshes) {
		this.pipeline = pipeline;
		this.meshes = meshes;
	}
}

class model {
	constructor(meshes) {
		this.groups = [];

		const pipelines = get_service("pipeline");

		const if_has_same_pipeline = (element) => {
			return element.pipeline_name == mesh.pipeline_name;
		}

		for (const mesh of meshes) {
			const pipeline = this._try_load_pipeline(pipelines, mesh.pipeline_name);

			const found = this.groups.find(if_has_same_pipeline);
			if (found != undefined) {
				found.meshes.push(mesh);
			} else {
				this.groups.push(new group(pipeline, [mesh]))
			}
		}
	}

	begin_draw_group(graphics) {}
	end_draw_group(graphics) {}

	draw(graphics) {
		const resources = get_service("resource");

		for (const group of this.groups) {
			graphics.push_pipeline(group.pipeline);
			graphics.set_engine_uniforms();
			this.begin_draw_group(graphics);

			for (const mesh of group.meshes) {
				if (mesh.material != null) {
					graphics.apply_material(resources.get_material(mesh.material));
				}
				var applied_textures_count = 0;
				for (const [name, texture_id] of Object.entries(mesh.textures)) {
					applied_textures_count += +graphics.apply_texture(
						resources.get_texture(texture_id), name
					);
				}

				mesh.draw(graphics);

				graphics.remove_textures(applied_textures_count);
			}
			this.end_draw_group(graphics);
			graphics.reset_engine_uniforms();
			graphics.pop_pipeline();
		}
	}

	_try_load_pipeline(pipelines, name) {
		if (name == null) {
			return null;
		}

		const pipeline = pipelines.load(name[0], name[1]);
		if (pipeline == null) {
			console.error(`Pipeline "${name}" is null`);
		}
		return pipeline;
	}
}