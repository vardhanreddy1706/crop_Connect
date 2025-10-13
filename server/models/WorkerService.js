const mongoose = require("mongoose");

const workerServiceSchema = new mongoose.Schema(
	{
		worker: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		workerType: {
			type: String,
			enum: [
				"Farm Labor",
				"Harvester",
				"Irrigator",
				"Sprayer",
				"General Helper",
			],
			required: true,
		},
		experience: {
			type: Number,
			required: true,
			min: 0,
		},
		chargePerDay: {
			type: Number,
			required: [true, "Please provide charge per day"],
			min: 0,
		},
		workingHours: {
			type: Number,
			required: true,
			min: 1,
			max: 24,
		},
		location: {
			village: String,
			district: String,
			state: String,
			pincode: String,
		},
		availability: {
			type: Boolean,
			default: true,
		},
		availableDates: [
			{
				type: Date,
			},
		],
		skills: [
			{
				type: String,
			},
		],
		contactNumber: {
			type: String,
			required: true,
		},
		rating: {
			average: {
				type: Number,
				default: 0,
				min: 0,
				max: 5,
			},
			count: {
				type: Number,
				default: 0,
			},
		},
	},
	{
		timestamps: true,
	}
);

// ✅ FIX: Check if model exists before creating
module.exports =
	mongoose.models.WorkerService ||
	mongoose.model("WorkerService", workerServiceSchema);
