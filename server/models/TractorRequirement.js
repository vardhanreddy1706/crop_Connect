const mongoose = require("mongoose");

const tractorRequirementSchema = new mongoose.Schema(
	{
		farmer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		workType: {
			type: String,
			enum: [
				"Plowing",
				"Harvesting",
				"Spraying",
				"Hauling",
				"Land Preparation",
			],
			required: [true, "Please specify work type"],
		},
		landType: {
			type: String,
			enum: ["Dry", "Wet", "Hilly", "Plain"],
			required: [true, "Please specify land type"],
		},
		landSize: {
			type: Number,
			required: [true, "Please provide land size"],
			min: [0.1, "Land size must be at least 0.1 acres"],
		},
		expectedDate: {
			type: Date,
			required: [true, "Please provide expected date"],
		},
		duration: {
			type: String,
			required: [true, "Please provide work duration"],
		},
		location: {
			village: {
				type: String,
			},
			district: {
				type: String,
				required: [true, "Please provide district"],
			},
			state: {
				type: String,
				required: [true, "Please provide state"],
			},
		},
		maxBudget: {
			type: Number,
			required: [true, "Please provide maximum budget"],
			min: [0, "Budget must be a positive number"],
		},
		urgency: {
			type: String,
			enum: ["normal", "urgent", "very_urgent"],
			default: "normal",
		},
		additionalNotes: {
			type: String,
			maxlength: [500, "Notes cannot exceed 500 characters"],
		},
		status: {
			type: String,
			enum: ["open", "in_progress", "completed", "cancelled"],
			default: "open",
		},
		responses: [
			{
				tractorOwner: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
				message: String,
				quotedPrice: Number,
				contactNumber: String,
				respondedAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
		// Add this inside your schema definition:
		acceptedResponse: {
			tractorOwner: {
				type: require("mongoose").Schema.Types.ObjectId,
				ref: "User",
			},
			quotedPrice: Number,
			acceptedAt: Date,
		},
	},
	{
		timestamps: true,
	}
);

// Index for faster queries
tractorRequirementSchema.index({ farmer: 1, status: 1 });
tractorRequirementSchema.index({ "location.district": 1, "location.state": 1 });
tractorRequirementSchema.index({ expectedDate: 1 });

module.exports = mongoose.model("TractorRequirement", tractorRequirementSchema);
