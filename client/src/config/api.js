import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
});

// Request interceptor - Add token to every request
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		console.log(`🔵 API Request: ${config.method.toUpperCase()} ${config.url}`);
		return config;
	},
	(error) => {
		console.error("❌ Request Error:", error);
		return Promise.reject(error);
	}
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
	(response) => {
		console.log(
			`✅ API Response: ${response.config.method.toUpperCase()} ${
				response.config.url
			}`,
			response.data
		);
		return response;
	},
	(error) => {
		console.error("❌ API Error:", error.response?.data || error.message);

		// Handle 401 Unauthorized - Token expired or invalid
		if (error.response?.status === 401) {
			localStorage.removeItem("token");
			localStorage.removeItem("user");

			// Don't redirect if already on login page
			if (window.location.pathname !== "/login") {
				window.location.href = "/login";
			}
		}

		// Handle 403 Forbidden - User doesn't have permission
		if (error.response?.status === 403) {
			console.warn("Access denied: User lacks required permissions");
		}

		// Handle 500 Server Error
		if (error.response?.status === 500) {
			console.error("Server error: Please contact support");
		}

		return Promise.reject(error);
	}
);

export default api;
