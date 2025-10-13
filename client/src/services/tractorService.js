import api from "../config/api";

export const tractorService = {
	// Tractor services
	getAllTractorServices: async (filters) =>
		(await api.get("/tractors", { params: filters })).data,
	getTractorServiceById: async (id) => (await api.get(`/tractors/${id}`)).data,
	createTractorService: async (data) =>
		(await api.post("/tractors", data)).data,
	getMyTractorServices: async () =>
		(await api.get("/tractors/my-services")).data,
	updateTractorService: async (id, data) =>
		(await api.put(`/tractors/${id}`, data)).data,
	deleteTractorService: async (id) =>
		(await api.delete(`/tractors/${id}`)).data,
	cancelTractorService: async (id) =>
		(await api.post(`/tractors/${id}/cancel`)).data,

	// Tractor requirements
	getAllTractorRequirements: async (filters) =>
		(await api.get("/tractor-requirements", { params: filters })).data,
	createTractorRequirement: async (data) =>
		(await api.post("/tractor-requirements", data)).data,
	getMyTractorRequirements: async () =>
		(await api.get("/tractor-requirements/my-requirements")).data,
	getTractorRequirementById: async (id) =>
		(await api.get(`/tractor-requirements/${id}`)).data,
	updateTractorRequirement: async (id, data) =>
		(await api.put(`/tractor-requirements/${id}`, data)).data,
	deleteTractorRequirement: async (id) =>
		(await api.delete(`/tractor-requirements/${id}`)).data,
	respondToRequirement: async (id, data) =>
		(await api.post(`/tractor-requirements/${id}/respond`, data)).data,
	acceptRequirement: async (id) =>
		(await api.post(`/tractor-requirements/${id}/accept`)).data,
	completeWork: async (id) =>
		(await api.post(`/tractor-requirements/${id}/complete`)).data,
};
