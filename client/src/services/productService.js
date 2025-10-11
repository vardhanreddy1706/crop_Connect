import api from "../config/api";

export const productService = {
	// Get all products
	getAllProducts: async (filters = {}) => {
		const response = await api.get("/products", { params: filters });
		return response.data;
	},

	// Get single product
	getProductById: async (id) => {
		const response = await api.get(`/products/${id}`);
		return response.data;
	},
};
