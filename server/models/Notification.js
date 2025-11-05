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
				"requirement_accepted", // added to support acceptance flow
				// Bids
				"bid_placed",
				"bid_accepted",
				"bid_rejected",
				// Bookings
				"booking_confirmed",
				"booking_created",
				"booking_received",
				"booking_cancelled",
				"booking_completed",
				"work_completed", // added alias used by some controllers
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
				"worker_application",
				"hire_accepted",
				"hire_rejected",
				"hire_request",
				// ✅ NEW: Orders
				"new_order",
				"order_placed",
				"order_confirmed",
				"order_picked",
				"order_completed",
				"order_status_update",
				"order_cancelled",
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
	relatedOrderId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Order",
	},
		read: {
			type: Boolean,
			default: false,
		},
		data: {
			type: mongoose.Schema.Types.Mixed,
		},
	},
	{
		timestamps: true,
	}
);

notificationSchema.index({ recipientId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
