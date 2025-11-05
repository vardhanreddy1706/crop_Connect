const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
	{
		farmer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		tractorOwnerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		serviceType: {
			type: String,
			enum: ["tractor", "worker"],
			required: true,
		},
		serviceId: {
			type: mongoose.Schema.Types.ObjectId,
			refPath: "serviceModel",
			required: false, // ✅ CHANGED: Make optional for worker applications
		},
		serviceModel: {
			type: String,
			enum: ["TractorService", "WorkerService"],
			required: false, // ✅ CHANGED: Make optional
		},
		bookingDate: {
			type: Date,
			required: true,
		},
		duration: {
			type: Number,
			required: true,
		},
		totalCost: {
			type: Number,
			required: true,
		},
		location: {
			district: String,
			state: String,
			pincode: String,
			fullAddress: String,
		},
		workType: String,
		landSize: { type: Number, default: 1 },
		status: {
			type: String,
			enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
			default: "confirmed",
		},
		paymentStatus: {
			type: String,
			enum: ["pending", "paid", "refunded"],
			default: "pending",
		},
		paymentCompleted: {
			type: Boolean,
			default: false,
		},
		hireRequestId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "WorkerHireRequest",
		},
		requirementId: {
			// ✅ ADD THIS - Link to WorkerRequirement
			type: mongoose.Schema.Types.ObjectId,
			ref: "WorkerRequirement",
		},
		notes: String,
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("Booking", BookingSchema);
