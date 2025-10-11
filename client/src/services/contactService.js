import api from "../config/api";

export const contactService = {
	// Submit contact form
	submitContact: async (contactData) => {
		const response = await api.post("/contact", contactData);
		return response.data;
	},
};
