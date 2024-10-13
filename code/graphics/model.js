
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
		for (const mesh of meshes) {
			const pipeline = pipelines.load(mesh.pipeline_name[0], mesh.pipeline_name[1]);
			if (pipeline == null) {
				throw new Error(`Pipeline "${mesh.pipeline_name}" of mesh "${mesh.name}" is null`);
			}
			const found = this.groups.find((element) => {
				element.pipeline_name == mesh.pipeline_name
			});
			if (found == undefined) {
				this.groups.push(new group(pipeline, [mesh]))
			} else {
				found.meshes.push(mesh);
			}
		}
	}

	draw(graphics) {
		const resources = get_service("resource");

		for (const group of this.groups) {
			graphics.push_pipeline(group.pipeline);
			graphics.set_engine_uniforms();

			for (const mesh of group.meshes) {
				if (mesh.material != null) {
					graphics.apply_material(resources.get_material(mesh.material));
				}
				for (const [name, texture_id] of Object.entries(mesh.textures)) {
					graphics.apply_texture(resources.get_texture(texture_id), name);
				}

				mesh.draw(graphics);
			}

			graphics.pop_pipeline();
		}
	}
}