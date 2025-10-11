const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
	{
		farmer: {
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
			required: true,
			refPath: "serviceModel",
		},
		serviceModel: {
			type: String,
			required: true,
			enum: ["TractorService", "WorkerService"],
		},
		bookingDate: {
			type: Date,
			required: true,
		},
		duration: {
			type: Number,
			required: true,
			min: 1,
		},
		totalCost: {
			type: Number,
			required: true,
			min: 0,
		},
		location: {
			village: String,
			district: String,
			state: String,
			pincode: String,
		},
		workType: {
			type: String,
		},
		landSize: {
			type: Number,
			min: 0,
		},
		status: {
			type: String,
			enum: ["pending", "confirmed", "completed", "cancelled"],
			default: "pending",
		},
		paymentStatus: {
			type: String,
			enum: ["pending", "paid", "refunded"],
			default: "pending",
		},
		notes: {
			type: String,
			maxlength: 500,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("Booking", bookingSchema);
