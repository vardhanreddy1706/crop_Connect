const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
	{
		recipientId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		type: {
			type: String,
			enum: [
				"new_requirement",
				"bid_placed",
				"bid_accepted",
				"bid_rejected",
				"booking_confirmed",
				"payment_received",
				"payment_sent",
				"service_posted",
				"service_cancelled",
			],
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		message: {
			type: String,
			required: true,
		},
		relatedUserId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		relatedRequirementId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "TractorRequirement",
		},
		relatedBookingId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Booking",
		},
		relatedServiceId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "TractorService",
		},
		read: {
			type: Boolean,
			default: false,
		},
		data: {
			// Store additional data like tractor owner details, quoted price, etc.
			type: mongoose.Schema.Types.Mixed,
		},
	},
	{
		timestamps: true,
	}
);

// Index for faster queries
notificationSchema.index({ recipientId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
