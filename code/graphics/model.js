
/*
+ pipeline0 [says vertex format & count of textures]
+--+ mesh0 [follow vertex format]
   +-- texture0 [follow texture count]
   +-- texture1 [follow texture count]
+--+ mesh1 [follow vertex format]
   +-- texture2 [follow texture count]
   +-- texture1 [follow texture count]

*/


class model_meshes {
	constructor(pipeline, meshes) {
		this.pipeline = pipeline;
		this.meshes = meshes;
	}

	draw(graphics) {
		graphics.push_pipeline(this.pipeline);
		for (const mesh of this.meshes) {
			mesh.draw(graphics);
		}
		graphics.pop_pipeline();
	}
}

class model {
	constructor(meshes) {
		const pipelines = get_service("pipeline");
		this.meshes = new Array();
		for (const mesh of meshes) {
			const pipeline = pipelines.load(mesh.pipeline_name);
			if (pipeline == null) {
				throw new Error(`Pipeline "${mesh.pipeline_name}" of mesh "${mesh.name}" is null`);
			}
			const found = this.meshes.find((element) => {
				element.pipeline_name == mesh.pipeline_name
			});
			if (found == undefined) {
				this.meshes.push({
					pipeline_name: mesh.pipeline_name,
					pipeline: pipeline,
					meshes: [mesh]
				});
			} else {
				found.meshes.push(mesh);
			}
		}
	}

	draw(graphics) {
		for (const element of this.meshes) {
			graphics.push_pipeline(element.pipeline);
			graphics.set_engine_uniforms();
			for (const mesh of element.meshes) {
				mesh.draw(graphics);
			}
			graphics.pop_pipeline();
		}
	}
}