const Notification = require("../models/Notification");

const createNotification = async (data) => {
	try {
		// ✅ UPDATED: Map to correct field names based on your Notification model
		const notification = await Notification.create({
			recipientId: data.userId || data.recipientId, // ✅ Support both
			type: data.type,
			title: data.title,
			message: data.message,
			relatedUserId: data.relatedUserId || null,
			relatedRequirementId: data.relatedRequirementId || data.relatedId || null,
			relatedBookingId:
				data.relatedBookingId ||
				(data.relatedModel === "Booking" ? data.relatedId : null),
			relatedServiceId:
				data.relatedServiceId ||
				(data.relatedModel === "WorkerService" ? data.relatedId : null),
			data: data.data || {},
		});

		return notification;
	} catch (error) {
		console.error("Error creating notification:", error);
		return null;
	}
};

module.exports = { createNotification };
