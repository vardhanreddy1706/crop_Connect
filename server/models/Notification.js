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
				// Authentication
				"login",
				"registration",
				// Requirements
				"new_requirement",
				"requirement_posted",
				// Bids
				"bid_placed",
				"bid_accepted",
				"bid_rejected",
				// Bookings
				"booking_confirmed",
				"booking_created",
				"booking_cancelled",
				"booking_completed",
				"work_completed", // ✅ ADD THIS LINE
				// Payments
				"payment_received",
				"payment_sent",
				"payment_failed",
				// Services
				"service_posted",
				"service_cancelled",
				// Workers
				"worker_hired",
				"application_received",
				// General
				"general",
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
