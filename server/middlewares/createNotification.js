const Notification = require("../models/Notification");

const createNotification = async (data) => {
	try {
		const notification = await Notification.create({
			recipientId: data.recipientId,
			type: data.type,
			title: data.title,
			message: data.message,
			relatedUserId: data.relatedUserId || null,
			relatedRequirementId: data.relatedRequirementId || null,
			relatedBookingId: data.relatedBookingId || null,
			relatedServiceId: data.relatedServiceId || null,
			data: data.data || {},
		});
		return notification;
	} catch (error) {
		console.error("Error creating notification:", error);
	}
};

module.exports = createNotification;
