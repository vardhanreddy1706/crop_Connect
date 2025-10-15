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
			required: true,
			enum: [
				"Farm Labor",
				"Harvester",
				"Irrigator",
				"Sprayer",
				"General Helper",
				"Ploughing",
				"Seeding",
				"Pesticide Application",
				"Other",
			],
		},
		experience: {
			type: Number,
			required: true,
			min: 0,
		},
		chargePerDay: {
			type: Number,
			required: true,
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
			coordinates: {
				type: {
					type: String,
					enum: ["Point"],
				},
				coordinates: [Number], // [longitude, latitude]
			},
		},
		availability: {
			type: Boolean,
			default: true,
		},
		// ✅ NEW: Track booking status
		bookingStatus: {
			type: String,
			enum: ["available", "booked", "completed"],
			default: "available",
		},
		// ✅ NEW: Current booking reference
		currentBookingId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Booking",
		},
		availableDates: [
			{
				startDate: Date,
				endDate: Date,
			},
		],
		skills: [String],
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
		reviews: [
			{
				farmer: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
				rating: Number,
				comment: String,
				createdAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
	},
	{
		timestamps: true,
	}
);

// ✅ Indexes
workerServiceSchema.index({ location: "2dsphere" });
workerServiceSchema.index({ worker: 1, availability: 1 });
workerServiceSchema.index({ workerType: 1, availability: 1 });
workerServiceSchema.index({ bookingStatus: 1 });

module.exports = mongoose.model("WorkerService", workerServiceSchema);
