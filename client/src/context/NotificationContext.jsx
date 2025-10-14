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

	useEffect(() => {
		if (!user?._id) return;

		console.log("🔌 Connecting to Socket.IO...");
		const newSocket = io(SOCKET_URL, {
			withCredentials: true,
			transports: ["websocket", "polling"],
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
		});

		newSocket.on("connect", () => {
			console.log("✅ Socket connected:", newSocket.id);
			newSocket.emit("join", user._id);
			// REMOVED THE TOAST - No need to show "Connected to notifications"
		});

		newSocket.on("notification", (payload) => {
			console.log("📬 Notification:", payload);

			// Add to notifications - handle different payload structures
			const notification = {
				_id: payload._id || Date.now().toString(),
				title: payload.title || "Notification",
				message: payload.message || "",
				type: payload.type || "info",
				read: false,
				createdAt: payload.createdAt || new Date(),
				data: payload.data || {},
			};

			setNotifications((prev) => [notification, ...prev]);
			setUnreadCount((c) => c + 1);

			// Show toast with 2 second duration
			const icon =
				payload.type === "payment_received"
					? "💰"
					: payload.type === "bid_placed"
					? "📋"
					: payload.type === "new_requirement"
					? "🚜"
					: payload.type === "work_completed"
					? "✅"
					: "🔔";

			toast.success(notification.message, {
				duration: 1000, // 2 seconds!
				icon: icon,
				id: `notif-${notification._id}`, // Prevent duplicates
			});
		});

		newSocket.on("connect_error", (error) => {
			console.error("Socket connection error:", error);
			toast.error("Notification service unavailable", {
				duration: 2000,
				id: "socket-error",
			});
		});

		newSocket.on("disconnect", () => {
			console.log("🔌 Socket disconnected");
		});

		setSocket(newSocket);

		return () => {
			console.log("🔌 Cleaning up socket");
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
