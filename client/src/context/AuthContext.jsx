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
						// Set in API headers immediately
						api.defaults.headers.common[
							"Authorization"
						] = `Bearer ${storedToken}`;
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

	// Listen for storage changes from other tabs
	useEffect(() => {
		const handleStorageChange = (e) => {
			if (e.key === "token" || e.key === "user") {
				if (e.newValue === null) {
					// User logged out in another tab
					setToken(null);
					setUser(null);
					delete api.defaults.headers.common["Authorization"];
				} else if (e.key === "token" && e.newValue) {
					// Token updated in another tab
					setToken(e.newValue);
					api.defaults.headers.common["Authorization"] = `Bearer ${e.newValue}`;
				} else if (e.key === "user" && e.newValue) {
					try {
						setUser(JSON.parse(e.newValue));
					} catch (err) {
						console.error("Failed to parse user from storage event:", err);
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
