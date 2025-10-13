import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const isDevelopment = import.meta.env.MODE === "development";

const api = axios.create({
	baseURL: API_BASE_URL,
	timeout: 15000, // Reduced from 30s to 15s
	headers: { "Content-Type": "application/json" },
	withCredentials: true,
});

let retryCount = 0;
const MAX_RETRIES = 2; // Reduced retries
const RETRY_DELAY = 800;

// REQUEST INTERCEPTOR
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		config.metadata = { startTime: new Date() };

		if (isDevelopment) {
			console.log(`🔵 ${config.method.toUpperCase()} ${config.url}`);
		}
		return config;
	},
	(error) => {
		console.error("Request Error:", error);
		return Promise.reject(error);
	}
);

// RESPONSE INTERCEPTOR - Fixed!
api.interceptors.response.use(
	(response) => {
		const duration = new Date() - response.config.metadata.startTime;
		if (isDevelopment) {
			console.log(
				`✅ ${response.config.method.toUpperCase()} ${
					response.config.url
				} (${duration}ms)`
			);
		}
		retryCount = 0;
		return response;
	},
	async (error) => {
		const originalRequest = error.config;

		// NETWORK ERROR - Fixed retry logic
		if (
			error.code === "ECONNABORTED" ||
			error.message === "Network Error" ||
			!error.response
		) {
			if (retryCount < MAX_RETRIES && !originalRequest._retry) {
				retryCount++;
				originalRequest._retry = true;

				console.log(`🔄 Retry ${retryCount}/${MAX_RETRIES}...`);
				await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));

				return api(originalRequest);
			}

			// After retries failed - show user-friendly message
			const errorMsg =
				"Connection error. Please check your internet and try again.";
			toast.error(errorMsg, { id: "network-error", duration: 4000 }); // Auto-dismiss after 4s

			return Promise.reject({
				message: errorMsg,
				type: "NETWORK_ERROR",
				originalError: error,
			});
		}

		const status = error.response?.status;
		const errorMessage = error.response?.data?.message || error.message;

		// Log detailed error in development
		if (isDevelopment) {
			console.error(`❌ ${status}: ${errorMessage}`);
		}

		// Handle different status codes
		switch (status) {
			case 400:
				toast.error(errorMessage || "Invalid request", {
					id: "bad-request",
					duration: 3000,
				});
				break;

			case 401:
				localStorage.removeItem("token");
				localStorage.removeItem("user");

				if (!["/login", "/", "/register"].includes(window.location.pathname)) {
					toast.error("Session expired. Please login again.", {
						id: "auth-error",
						duration: 4000,
					});
					setTimeout(() => (window.location.href = "/login"), 1500);
				}
				break;

			case 403:
				toast.error("Access denied. You don't have permission.", {
					id: "forbidden",
					duration: 3000,
				});
				break;

			case 404:
				toast.error("Resource not found", { id: "not-found", duration: 3000 });
				break;

			case 409:
				toast.error(errorMessage || "Conflict: Resource already exists", {
					id: "conflict",
					duration: 3000,
				});
				break;

			case 422:
				toast.error(errorMessage || "Validation error", {
					id: "validation",
					duration: 3000,
				});
				break;

			case 429:
				toast.error("Too many requests. Please wait a moment.", {
					id: "rate-limit",
					duration: 4000,
				});
				break;

			case 500:
			case 502:
			case 503:
				toast.error("Server error. Please try again later.", {
					id: "server-error",
					duration: 4000,
				});
				break;

			default:
				if (errorMessage) {
					toast.error(errorMessage, { id: `error-${status}`, duration: 3000 });
				}
		}

		return Promise.reject({
			status,
			message: errorMessage,
			data: error.response?.data,
			originalError: error,
		});
	}
);

// Helper functions
export const checkBackendHealth = async () => {
	try {
		const response = await axios.get(
			`${API_BASE_URL.replace("/api", "")}/api/health`,
			{ timeout: 5000 }
		);
		return { isHealthy: true, data: response.data };
	} catch (error) {
		return { isHealthy: false, error: error.message };
	}
};

export const getApiBaseUrl = () => API_BASE_URL;
export const isAuthenticated = () => !!localStorage.getItem("token");
export const getCurrentUser = () => {
	try {
		const user = localStorage.getItem("user");
		return user ? JSON.parse(user) : null;
	} catch {
		return null;
	}
};
export const logout = () => {
	localStorage.removeItem("token");
	localStorage.removeItem("user");
	window.location.href = "/login";
};

// Network status monitoring
if (typeof window !== "undefined") {
	window.addEventListener("online", () => {
		toast.success("Connection restored", { id: "online", duration: 2000 });
		retryCount = 0;
	});

	window.addEventListener("offline", () => {
		toast.error("No internet connection", { id: "offline", duration: 4000 });
	});
}

export default api;
