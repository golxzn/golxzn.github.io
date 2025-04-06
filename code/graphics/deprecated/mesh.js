
const draw_method_type = {
	array                             : "array",
	elements                          : "elements",
	instanced_array                   : "instanced_array",
	instanced_elements                : "instanced_elements",
};

class draw_method {
	constructor(data = {
		type: draw_method_type.array,
		mode: gl.TRIANGLES,
		target_buffer: null,
		instances_count: null,
	}) {
		this.mode = data.mode != null ? data.mode : gl.TRIANGLES;
		this.draw_method = draw_method.select(data.type);
		this.target_buffer = data.target_buffer;
		this.instances_count = data.instances_count;
	}

	draw(graphics, mesh_instance) {
		this.draw_method(graphics, this, mesh_instance);
	}

	static select(type) {
		switch (type) {
			case draw_method_type.array:
				return (graphics, self, mesh) => { graphics.draw_array(self, mesh); };
			case draw_method_type.elements:
				return (graphics, self, mesh) => { graphics.draw_elements(self, mesh); };
			case draw_method_type.instanced_array:
				return (graphics, self, mesh) => { graphics.draw_instanced_array(self, mesh); };
			case draw_method_type.instanced_elements:
				return (graphics, self, mesh) => { graphics.draw_instanced_elements(self, mesh); };
		}
		return null;
	}
};

class mesh {
	constructor(textures, material, details = { pipeline: null, buffer_infos: [], draw_method: null, settings: null }) {
		this.vao = new render_object({ type: render_object_type.vertex_array }, details.buffer_infos);
		this.draw_method = details.draw_method;
		this.pipeline_name = details.pipeline;

		this.textures = textures;
		this.material = material;

		this.draw = (graphics) => { this._draw(graphics); }
		if (details.settings != null) {
			this.enable_settings = details.settings.enable == null ? [] : details.settings.enable;
			this.disable_settings = details.settings.disable == null ? [] : details.settings.disable;
			if (this.enable_settings.length + this.disable_settings.length > 0) {
				this.draw = (graphics) => { this._draw_with_settings(graphics); }
			}
		}
	}

	_draw(graphics) {
		this.draw_method.draw(graphics, this);
	}

	_draw_with_settings(graphics) {
		var previous_disabled = []
		for (var i = 0; i < this.enable_settings.length; ++i) {
			const param = this.enable_settings[i];
			if (!gl.isEnabled(param)) previous_disabled.push(param);
			gl.enable(param);
		}
		var previous_enabled = []
		for (var i = 0; i < this.disable_settings.length; ++i) {
			const param = this.disable_settings[i];
			if (gl.isEnabled(param)) previous_enabled.push(param);
			gl.disable(param);
		}

		this.draw_method.draw(graphics, this);

		previous_disabled.forEach(value => gl.disable(value));
		previous_enabled.forEach(value => gl.enable(value));
	}

	update_buffer_data(name, data, offset = 0) {
		const buffer = this.vao.get_buffer(name);
		if (buffer == null) return;

		this.vao.bind();
		buffer.sub_data(data, offset);
		this.vao.unbind();
	}
};
