/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const NotificationContext = createContext(null);
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

export const NotificationProvider = ({ children }) => {
	const { user } = useAuth();
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [socket, setSocket] = useState(null);

	// Initialize Socket.IO connection
	useEffect(() => {
		if (!user?._id) return;

		console.log("🔌 Connecting to Socket.IO...");
		const newSocket = io(SOCKET_URL, {
			withCredentials: true,
			transports: ["websocket", "polling"],
		});

		newSocket.on("connect", () => {
			console.log("✅ Socket.IO connected:", newSocket.id);
			// Join user's personal room
			newSocket.emit("join", user._id);
		});

		newSocket.on("notification", (payload) => {
			console.log("📬 New notification received:", payload);

			// Add to notifications list
			setNotifications((prev) => [
				{
					...payload,
					_id: payload._id || Math.random().toString(36),
					read: false,
					createdAt: new Date(),
				},
				...prev,
			]);

			setUnreadCount((c) => c + 1);

			// Show toast notification
			toast.success(payload.message || "New notification", {
				duration: 4000,
				icon: payload.type === "payment_received" ? "💰" : "🔔",
			});
		});

		newSocket.on("disconnect", () => {
			console.log("🔌 Socket.IO disconnected");
		});

		setSocket(newSocket);

		return () => {
			console.log("🔌 Cleaning up Socket.IO connection");
			newSocket.disconnect();
		};
	}, [user?._id]);

	const markAsRead = (id) => {
		setNotifications((prev) =>
			prev.map((n) => (n._id === id ? { ...n, read: true } : n))
		);
		setUnreadCount((c) => Math.max(0, c - 1));
	};

	const clearAll = () => {
		setNotifications([]);
		setUnreadCount(0);
	};

	return (
		<NotificationContext.Provider
			value={{
				notifications,
				unreadCount,
				markAsRead,
				clearAll,
				socket,
			}}
		>
			{children}
		</NotificationContext.Provider>
	);
};

export const useNotificationContext = () => {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error(
			"useNotificationContext must be used within NotificationProvider"
		);
	}
	return context;
};
