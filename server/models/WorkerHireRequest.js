const mongoose = require("mongoose");

const workerHireRequestSchema = new mongoose.Schema(
	{
		farmer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		worker: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		workerService: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "WorkerService",
			required: true,
		},
		requestType: {
			type: String,
			enum: ["farmer_to_worker", "worker_to_farmer"], // ✅ Track who initiated
			required: true,
		},
		status: {
			type: String,
			enum: ["pending", "accepted", "rejected", "cancelled"],
			default: "pending",
		},
		workDetails: {
			startDate: Date,
			duration: Number,
			workDescription: String,
			location: {
				village: String,
				district: String,
				state: String,
				pincode: String,
			},
		},
		agreedAmount: {
			type: Number,
			required: true,
		},
		notes: String,
		rejectionReason: String,
		bookingId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Booking",
		},
	},
	{ timestamps: true }
);

// ✅ Index for faster queries
workerHireRequestSchema.index({ farmer: 1, status: 1 });
workerHireRequestSchema.index({ worker: 1, status: 1 });
workerHireRequestSchema.index({ workerService: 1 });

module.exports = mongoose.model("WorkerHireRequest", workerHireRequestSchema);
