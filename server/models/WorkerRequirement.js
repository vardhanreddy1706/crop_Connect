const mongoose = require("mongoose");

const workerRequirementSchema = new mongoose.Schema(
	{
		farmer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		requiredAge: {
			min: { type: Number, default: 18 },
			max: { type: Number, default: 65 },
		},
		preferredGender: {
			type: String,
			enum: ["any", "male", "female", "other"],
			default: "any",
		},
		minExperience: {
			type: Number,
			required: true,
			min: 0,
		},
		wagesOffered: {
			type: Number,
			required: true,
			min: 0,
		},
		location: {
			village: String,
			district: String,
			state: String,
			fullAddress: String,
		},
		workDuration: {
			type: String,
			required: true,
		},
		workType: {
			type: String,
			enum: [
				"Farm Labor",
				"Harvester",
				"Irrigator",
				"Sprayer",
				"General Helper",
				"Other",
			],
			default: "Farm Labor",
		},
		foodProvided: {
			type: Boolean,
			default: false,
		},
		transportationProvided: {
			type: Boolean,
			default: false,
		},
		startDate: {
			type: Date,
			required: true,
		},
		endDate: {
			type: Date,
		},
		status: {
			type: String,
			enum: ["open", "filled", "closed", "cancelled"],
			default: "open",
		},
		applicants: [
			{
				worker: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
				appliedAt: {
					type: Date,
					default: Date.now,
				},
				status: {
					type: String,
					enum: ["pending", "accepted", "rejected"],
					default: "pending",
				},
			},
		],
		notes: String,
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("WorkerRequirement", workerRequirementSchema);
