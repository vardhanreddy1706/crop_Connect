import { createContext, useState } from "react";

const AuthContext = createContext(null);
export { AuthContext };

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);

	const logout = async () => {
		setUser(null);
		// Call backend /api/logout when ready
		
	};

	return (
		<AuthContext.Provider value={{ user, logout }}>
			{children}
		</AuthContext.Provider>
	);
}
