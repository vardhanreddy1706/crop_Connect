import api from "../config/api";

export const cropService = {
	// Get all crops
	getAllCrops: async (filters = {}) => {
		const response = await api.get("/crops", { params: filters });
		return response.data;
	},

	// Get single crop
	getCropById: async (id) => {
		const response = await api.get(`/crops/${id}`);
		return response.data;
	},

	// Create crop (Farmer only)
	createCrop: async (cropData) => {
		const response = await api.post("/crops", cropData);
		return response.data;
	},

	// Get my crops
	getMyCrops: async () => {
		const response = await api.get("/crops/my-crops");
		return response.data;
	},

	// Update crop
	updateCrop: async (id, cropData) => {
		const response = await api.put(`/crops/${id}`, cropData);
		return response.data;
	},

	// Delete crop
	deleteCrop: async (id) => {
		const response = await api.delete(`/crops/${id}`);
		return response.data;
	},
};
