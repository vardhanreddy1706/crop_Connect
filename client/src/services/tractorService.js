import api from "../config/api";

export const tractorService = {
	// Get all tractor services
	getAllTractorServices: async (filters = {}) => {
		const response = await api.get("/tractors", { params: filters });
		return response.data;
	},

	// Get single tractor service
	getTractorServiceById: async (id) => {
		const response = await api.get(`/tractors/${id}`);
		return response.data;
	},

	// Create tractor service
	createTractorService: async (serviceData) => {
		const response = await api.post("/tractors", serviceData);
		return response.data;
	},

	// Get my services
	getMyTractorServices: async () => {
		const response = await api.get("/tractors/my-services");
		return response.data;
	},

	// Update service
	updateTractorService: async (id, serviceData) => {
		const response = await api.put(`/tractors/${id}`, serviceData);
		return response.data;
	},

	// Delete service
	deleteTractorService: async (id) => {
		const response = await api.delete(`/tractors/${id}`);
		return response.data;
	},
};
