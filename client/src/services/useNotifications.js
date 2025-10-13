import { useState, useEffect, useCallback } from "react";
import { notificationService } from "../services/notificationService";

export const useNotifications = () => {
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [loading, setLoading] = useState(true);

	// Fetch notifications
	const fetchNotifications = useCallback(async () => {
		try {
			const data = await notificationService.getNotifications();
			setNotifications(data.notifications);
		} catch (error) {
			console.error("Error fetching notifications:", error);
		}
	}, []);

	// Fetch unread count
	const fetchUnreadCount = useCallback(async () => {
		try {
			const data = await notificationService.getUnreadCount();
			setUnreadCount(data.unreadCount);
		} catch (error) {
			console.error("Error fetching unread count:", error);
		}
	}, []);

	// Mark as read
	const markAsRead = useCallback(async (id) => {
		try {
			await notificationService.markAsRead(id);
			setNotifications((prev) =>
				prev.map((n) => (n._id === id ? { ...n, read: true } : n))
			);
			setUnreadCount((prev) => Math.max(0, prev - 1));
		} catch (error) {
			console.error("Error marking as read:", error);
		}
	}, []);

	// Mark all as read
	const markAllAsRead = useCallback(async () => {
		try {
			await notificationService.markAllAsRead();
			setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
			setUnreadCount(0);
		} catch (error) {
			console.error("Error marking all as read:", error);
		}
	}, []);

	// Delete notification
	const deleteNotif = useCallback(async (id) => {
		try {
			await notificationService.deleteNotification(id);
			setNotifications((prev) => prev.filter((n) => n._id !== id));
		} catch (error) {
			console.error("Error deleting notification:", error);
		}
	}, []);

	// Initial fetch
	useEffect(() => {
		fetchNotifications();
		fetchUnreadCount();
		setLoading(false);

		// Poll for new notifications every 30 seconds
		const interval = setInterval(() => {
			fetchNotifications();
			fetchUnreadCount();
		}, 30000);

		return () => clearInterval(interval);
	}, [fetchNotifications, fetchUnreadCount]);

	return {
		notifications,
		unreadCount,
		loading,
		markAsRead,
		markAllAsRead,
		deleteNotif,
		refreshNotifications: fetchNotifications,
	};
};
