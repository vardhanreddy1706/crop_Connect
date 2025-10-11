import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../config/api";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

 const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
};

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		const token = localStorage.getItem("token");

		if (storedUser && token) {
			setUser(JSON.parse(storedUser));
		}
		setLoading(false);
	}, []);

	const login = async (email, password) => {
		try {
			const response = await api.post("/auth/login", { email, password });

			if (response.data.success) {
				const { user, token } = response.data;
				localStorage.setItem("token", token);
				localStorage.setItem("user", JSON.stringify(user));
				setUser(user);
				return { success: true, user };
			}
		} catch (error) {
			return {
				success: false,
				message: error.response?.data?.message || "Login failed",
			};
		}
	};

	const register = async (userData) => {
		try {
			const response = await api.post("/auth/register", userData);

			if (response.data.success) {
				const { user, token } = response.data;
				localStorage.setItem("token", token);
				localStorage.setItem("user", JSON.stringify(user));
				setUser(user);
				return { success: true, user };
			}
		} catch (error) {
			return {
				success: false,
				message: error.response?.data?.message || "Registration failed",
			};
		}
	};

	const logout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		setUser(null);
	};

	const value = {
		user,
		login,
		register,
		logout,
		loading,
		isAuthenticated: !!user,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
// eslint-disable-next-line react-refresh/only-export-components
export { useAuth };
