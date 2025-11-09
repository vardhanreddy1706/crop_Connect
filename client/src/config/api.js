import axios from "axios";
import toast from "react-hot-toast";

// Dynamically determine the API base URL
const envUrl = import.meta.env.VITE_API_BASE_URL;

const defaultApiUrl = (() => {
	if (typeof window === "undefined") return "http://localhost:8000/api";

	// Use the same protocol, hostname, and port as the frontend
	const protocol = window.location.protocol; // 'https:' or 'http:'
	const host = window.location.hostname;
	const port = 8000; // Backend port
	return `${protocol}//${host}:${port}/api`;
})();

const API_BASE_URL = envUrl || defaultApiUrl;
const isDevelopment = import.meta.env.MODE === "development";

const api = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
	headers: { "Content-Type": "application/json" },
	withCredentials: true,
});

let retryQueue = new Map();

// REQUEST INTERCEPTOR
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		config.metadata = { startTime: new Date() };

		if (isDevelopment) {
			const fullUrl = `${config.baseURL || API_BASE_URL}${config.url}`;
			console.log(`🔵 ${config.method?.toUpperCase()} ${fullUrl}`);
		}
		return config;
	},
	(error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
	(response) => {
		const duration = new Date() - response.config.metadata.startTime;
		if (isDevelopment) {
			console.log(
				`✅ ${response.config.method?.toUpperCase()} ${
					response.config.url
				} (${duration}ms)`
			);
		}
		const requestKey = `${response.config.method}-${response.config.url}`;
		retryQueue.delete(requestKey);
		return response;
	},
	async (error) => {
		const originalRequest = error.config;
		const requestKey = `${originalRequest?.method}-${originalRequest?.url}`;

		// NETWORK ERROR HANDLING
		if (
			error.code === "ECONNABORTED" ||
			error.message === "Network Error" ||
			!error.response
		) {
			if (!retryQueue.has(requestKey)) {
				retryQueue.set(requestKey, 1);
				console.log(`🔄 Retrying ${originalRequest.url}...`);
				await new Promise((resolve) => setTimeout(resolve, 500));

				try {
					return await api(originalRequest);
				} catch (retryError) {
					retryQueue.delete(requestKey);
					if (
						!originalRequest.url.includes("/notifications") &&
						!originalRequest.url.includes("/health")
					) {
						toast.error("Request failed. Please try again.", {
							duration: 2000,
							id: "network-error",
						});
					}
					return Promise.reject(retryError);
				}
			}

			retryQueue.delete(requestKey);
			return Promise.reject(error);
		}

		const status = error.response?.status;
		const errorMessage = error.response?.data?.message || error.message;

		if (isDevelopment) {
			console.error(`❌ ${status}: ${errorMessage}`);
		}

		switch (status) {
			case 400:
				toast.error(errorMessage || "Invalid request", {
					duration: 2000,
					id: "bad-request",
				});
				break;
			case 401:
				localStorage.removeItem("token");
				localStorage.removeItem("user");
				if (!["/login", "/", "/register"].includes(window.location.pathname)) {
					toast.error("Session expired. Please login again.", {
						duration: 3000,
						id: "auth-error",
					});
					setTimeout(() => (window.location.href = "/login"), 1000);
				}
				break;
			case 403:
				toast.error("Access denied", { duration: 2000, id: "forbidden" });
				break;
			case 404:
				if (!originalRequest.url.includes("/notifications")) {
					toast.error("Resource not found", {
						duration: 2000,
						id: "not-found",
					});
				}
				break;
			case 500:
			case 502:
			case 503:
				toast.error("Server error. Try again later.", {
					duration: 1000,
					id: "server-error",
				});
				break;
			default:
				if (errorMessage && !originalRequest.url.includes("/notifications")) {
					toast.error(errorMessage, { duration: 2000, id: `error-${status}` });
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

// Utilities
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

// Online/offline toasts
if (typeof window !== "undefined") {
	window.addEventListener("online", () =>
		toast.success("Internet restored", { duration: 2000, id: "online" })
	);

	window.addEventListener("offline", () =>
		toast.error("No internet", { duration: 2000, id: "offline" })
	);
}

export default api;
