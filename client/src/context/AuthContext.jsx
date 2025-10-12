/* eslint-disable react-refresh/only-export-components */
import React, {
	createContext,
	useState,
	useEffect,
	useContext,
	useCallback,
} from "react";
import api from "../config/api";

export const AuthContext = createContext();

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
};

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(null);
	const [loading, setLoading] = useState(true);

	// Initialize on mount - restore from localStorage if valid
	useEffect(() => {
		const initializeAuth = () => {
			try {
				const storedToken = localStorage.getItem("token");
				const storedUser = localStorage.getItem("user");

				// Validate token exists and is not empty
				if (storedToken && storedToken.trim() && storedUser) {
					try {
						const parsedUser = JSON.parse(storedUser);
						setToken(storedToken);
						setUser(parsedUser);
					} catch (err) {
						// Invalid JSON, clear storage
						console.error("Failed to parse user from storage:", err);
						localStorage.removeItem("user");
						localStorage.removeItem("token");
					}
				}
			} catch (error) {
				console.error("Auth initialization error:", error);
			} finally {
				setLoading(false);
			}
		};

		initializeAuth();
	}, []);

	// Verify token is still valid with backend on mount
	useEffect(() => {
		if (token && user) {
			const verifyToken = async () => {
				try {
					// Add token to headers for verification
					api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

					// Call a verify endpoint or just trust the token
					// If your backend has a /verify endpoint, call it here
					// Otherwise, the token will be validated on first API call
				} catch (error) {
					// Token invalid, clear auth
					console.error("Token verification failed:", error);
					logout();
				}
			};
			verifyToken();
		}
	}, []); // Only on mount

	// Listen for storage changes from other tabs
	useEffect(() => {
		const handleStorageChange = (e) => {
			if (e.key === "token" || e.key === "user") {
				if (e.newValue === null) {
					// User logged out in another tab
					setToken(null);
					setUser(null);
				} else if (e.key === "token" && e.newValue) {
					// Token updated in another tab
					setToken(e.newValue);
				} else if (e.key === "user" && e.newValue) {
					try {
						setUser(JSON.parse(e.newValue));
					} catch (err) {
						console.error(err||"Failed to parse user from storage event");
					}
				}
			}
		};

		window.addEventListener("storage", handleStorageChange);
		return () => window.removeEventListener("storage", handleStorageChange);
	}, []);

	const login = useCallback(async (email, password) => {
		try {
			const response = await api.post("/auth/login", { email, password });
			if (response.data.success) {
				const { user, token } = response.data;

				// Store in localStorage for persistence across tabs/refreshes
				localStorage.setItem("token", token);
				localStorage.setItem("user", JSON.stringify(user));

				// Set in API headers
				api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

				setUser(user);
				setToken(token);

				return { success: true, user };
			}
		} catch (error) {
			return {
				success: false,
				message: error.response?.data?.message || "Login failed",
			};
		}
	}, []);

	const register = useCallback(async (userData) => {
		try {
			const response = await api.post("/auth/register", userData);
			if (response.data.success) {
				const { user, token } = response.data;

				// Store in localStorage
				localStorage.setItem("token", token);
				localStorage.setItem("user", JSON.stringify(user));

				// Set in API headers
				api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

				setUser(user);
				setToken(token);

				return { success: true, user };
			}
		} catch (error) {
			return {
				success: false,
				message: error.response?.data?.message || "Registration failed",
			};
		}
	}, []);

	const logout = useCallback(() => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		delete api.defaults.headers.common["Authorization"];
		setUser(null);
		setToken(null);
	}, []);

	// Set token in API headers when it changes
	useEffect(() => {
		if (token) {
			api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
		} else {
			delete api.defaults.headers.common["Authorization"];
		}
	}, [token]);

	const value = {
		user,
		token,
		login,
		register,
		logout,
		loading,
		isAuthenticated: !!user && !!token,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
