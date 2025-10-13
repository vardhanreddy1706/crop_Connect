const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
	try {
		const notifications = await Notification.find({
			recipientId: req.user._id,
		})
			.populate("relatedUserId", "name phone address profileImage")
			.populate("relatedRequirementId")
			.populate("relatedBookingId")
			.populate("relatedServiceId")
			.sort({ createdAt: -1 })
			.limit(50);

		res.status(200).json({
			success: true,
			count: notifications.length,
			notifications,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

exports.getUnreadCount = async (req, res) => {
	try {
		const count = await Notification.countDocuments({
			recipientId: req.user._id,
			read: false,
		});

		res.status(200).json({
			success: true,
			unreadCount: count,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

exports.markAsRead = async (req, res) => {
	try {
		await Notification.findByIdAndUpdate(
			req.params.id,
			{ read: true },
			{ new: true }
		);

		res.status(200).json({
			success: true,
			message: "Notification marked as read",
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

exports.markAllAsRead = async (req, res) => {
	try {
		await Notification.updateMany(
			{ recipientId: req.user._id, read: false },
			{ read: true }
		);

		res.status(200).json({
			success: true,
			message: "All notifications marked as read",
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

exports.deleteNotification = async (req, res) => {
	try {
		await Notification.findByIdAndDelete(req.params.id);

		res.status(200).json({
			success: true,
			message: "Notification deleted",
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
