/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";
import { notificationService } from "../services/notificationService";

const NotificationContext = createContext(null);
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

export const NotificationProvider = ({ children }) => {
	const { user } = useAuth();
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [socket, setSocket] = useState(null);

	// Initial fetch from API when user logs in
	useEffect(() => {
		if (!user?._id) return;
		(async () => {
			try {
				const [listRes, countRes] = await Promise.all([
					notificationService.getNotifications(),
					notificationService.getUnreadCount(),
				]);
				setNotifications(listRes.notifications || []);
				setUnreadCount(countRes.unreadCount || 0);
			} catch (e) {
				console.error("Failed to load notifications:", e);
			}
		})();
	}, [user?._id]);

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
		});

		newSocket.on("notification", (payload) => {
			console.log("📬 Notification:", payload);

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
				duration: 1000,
				icon: icon,
				id: `notif-${notification._id}`,
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

	const markAsRead = useCallback(async (id) => {
		try {
			await notificationService.markAsRead(id);
			setNotifications((prev) =>
				prev.map((n) => (n._id === id ? { ...n, read: true } : n))
			);
			setUnreadCount((c) => Math.max(0, c - 1));
		} catch (e) {
			console.error("Mark as read failed:", e);
		}
	}, []);

	const markAllAsRead = useCallback(async () => {
		try {
			await notificationService.markAllAsRead();
			setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
			setUnreadCount(0);
		} catch (e) {
			console.error("Mark all as read failed:", e);
		}
	}, []);

	const deleteNotif = useCallback(async (id) => {
		try {
			await notificationService.deleteNotification(id);
			setNotifications((prev) => prev.filter((n) => n._id !== id));
		} catch (e) {
			console.error("Delete notification failed:", e);
		}
	}, []);

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
				markAllAsRead,
				deleteNotif,
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
