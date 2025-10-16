const mongoose = require("mongoose");

const workerRequirementSchema = new mongoose.Schema(
	{
		farmer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		workType: {
			type: String,
			required: true,
		},
		workDescription: {
			type: String,
		},
		location: {
			village: String,
			district: String,
			state: String,
			pincode: String,
		},
		startDate: {
			type: Date,
			required: true,
		},
		duration: {
			type: String, // e.g., "3 days", "1 week"
			required: false, // ✅ CHANGED TO FALSE
			default: "1 day", // ✅ ADD DEFAULT VALUE
		},
		wagesOffered: {
			type: Number,
			required: true,
		},
		numberOfWorkers: {
			type: Number,
			default: 1,
		},
		skillsRequired: [String],
		status: {
			type: String,
			enum: ["open", "in_progress", "completed", "cancelled", "accepted"],
			default: "open",
		},
		// Track who applied
		applicants: [
			{
				worker: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
				status: {
					type: String,
					enum: ["pending", "accepted", "rejected"],
					default: "pending",
				},
				appliedAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
		acceptedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		acceptedAt: Date,
		completedAt: Date,
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("WorkerRequirement", workerRequirementSchema);
