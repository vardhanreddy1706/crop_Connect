import api from "../config/api";

export const bookingService = {
	// Create booking
	createBooking: async (bookingData) => {
		const response = await api.post("/bookings", bookingData);
		return response.data;
	},

	// Get my bookings
	getMyBookings: async () => {
		const response = await api.get("/bookings/my-bookings");
		return response.data;
	},

	// Get service bookings (for tractor/worker owners)
	getServiceBookings: async () => {
		const response = await api.get("/bookings/service-bookings");
		return response.data;
	},

	// Update booking status
	updateBookingStatus: async (id, status) => {
		const response = await api.put(`/bookings/${id}/status`, { status });
		return response.data;
	},

	// Cancel booking
	cancelBooking: async (id) => {
		const response = await api.delete(`/bookings/${id}`);
		return response.data;
	},
};
