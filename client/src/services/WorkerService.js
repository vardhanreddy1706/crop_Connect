import api from "../config/api";

// ==========================================
// WORKER SERVICES
// ==========================================

// Post worker availability
export const postWorkerAvailability = async (serviceData) => {
	const response = await api.post("/workers/post-availability", serviceData);
	return response.data;
};

// Get worker's own posts
export const getMyWorkerPosts = async () => {
	const response = await api.get("/workers/my-posts");
	return response.data;
};

// Get all available workers (For farmers browsing)
export const getAvailableWorkers = async (filters) => {
	const response = await api.get("/workers/available", { params: filters });
	return response.data;
};

// Update worker availability
export const updateWorkerAvailability = async (serviceId, updateData) => {
	const response = await api.put(
		`/workers/availability/${serviceId}`,
		updateData
	);
	return response.data;
};

// Delete worker availability
export const deleteWorkerAvailability = async (serviceId) => {
	const response = await api.delete(`/workers/availability/${serviceId}`);
	return response.data;
};

// ==========================================
// WORKER REQUIREMENTS
// ==========================================

// Create worker requirement (Farmer posts work requirement)
export const createWorkerRequirement = async (requirementData) => {
	const response = await api.post("/worker-requirements", requirementData);
	return response.data;
};

// Get all worker requirements (Workers browse available work)
export const getAllWorkerRequirements = async (filters) => {
	const response = await api.get("/worker-requirements", { params: filters });
	return response.data;
};

// Get farmer's own requirements
export const getMyRequirements = async () => {
	const response = await api.get("/worker-requirements/my-requirements");
	return response.data;
};

// Worker applies to a requirement
export const applyForRequirement = async (requirementId) => {
	const response = await api.post(
		`/worker-requirements/${requirementId}/apply`
	);
	return response.data;
};

// Update worker requirement
export const updateWorkerRequirement = async (requirementId, updateData) => {
	const response = await api.put(
		`/worker-requirements/${requirementId}`,
		updateData
	);
	return response.data;
};

// Delete worker requirement
export const deleteWorkerRequirement = async (requirementId) => {
	const response = await api.delete(`/worker-requirements/${requirementId}`);
	return response.data;
};

// ==========================================
// BOOKINGS
// ==========================================

// Get worker's bookings (accepted work assignments)
export const getWorkerBookings = async () => {
	const response = await api.get("/bookings/worker");
	return response.data;
};

// Mark booking as complete
export const markBookingComplete = async (bookingId) => {
	const response = await api.post(`/bookings/${bookingId}/complete`);
	return response.data;
};

// ==========================================
// TRANSACTIONS
// ==========================================

// Get worker's transaction history
export const getWorkerTransactions = async () => {
	const response = await api.get("/transactions/worker");
	return response.data;
};

// ==========================================
// NOTIFICATIONS
// ==========================================

// Get user's notifications
export const getNotifications = async () => {
	const response = await api.get("/notifications");
	return response.data;
};

// Mark notification as read
export const markNotificationRead = async (notificationId) => {
	const response = await api.put(`/notifications/${notificationId}/read`);
	return response.data;
};

export default {
	// Worker Services
	postWorkerAvailability,
	getMyWorkerPosts,
	getAvailableWorkers,
	updateWorkerAvailability,
	deleteWorkerAvailability,
	// Worker Requirements
	createWorkerRequirement,
	getAllWorkerRequirements,
	getMyRequirements,
	applyForRequirement,
	updateWorkerRequirement,
	deleteWorkerRequirement,
	// Bookings
	getWorkerBookings,
	markBookingComplete,
	// Transactions
	getWorkerTransactions,
	// Notifications
	getNotifications,
	markNotificationRead,
};
