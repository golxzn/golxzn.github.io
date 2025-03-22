
class service_provider_singleton {
	static _instance = null;

	constructor(services = new Map()) {
		if (service_provider_singleton._instance != null) {
			throw new Error("The service_provider singleton is already instantiated!");
		}
		this.services = services;

		service_provider_singleton._instance = this;
	}

	get(service_name) {
		return this.services[service_name];
	}

	set(service_name, service) {
		if (service_name in this.services) {
			console.warn(`[service_provider] The service "${service_name}" is already exists`);
		}

		this.services[service_name] = service
		return service;
	}

	static instance() {
		return service_provider_singleton._instance;
	}
}

function service_provider() {
	return service_provider_singleton.instance();
}

function get_service(name) {
	return service_provider().get(name);
}
