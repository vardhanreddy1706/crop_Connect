import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { Toaster } from "react-hot-toast";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		
			<AuthProvider>
				<NotificationProvider>
					<App />
					<Toaster
						position="top-right"
						toastOptions={{
							duration: 3000,
							style: {
								background: "#363636",
								color: "#fff",
							},
							success: {
								iconTheme: {
									primary: "#10B981",
									secondary: "#fff",
								},
							},
							error: {
								iconTheme: {
									primary: "#EF4444",
									secondary: "#fff",
								},
							},
						}}
					/>
				</NotificationProvider>
			</AuthProvider>
		
	</React.StrictMode>
);
