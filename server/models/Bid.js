const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
	{
		requirementId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "TractorRequirement",
			required: true,
		},
		tractorOwnerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		proposedAmount: {
			type: Number,
			required: true,
			min: 0,
		},
		proposedDuration: {
			type: String,
			required: true,
		},
		proposedDate: {
			type: Date,
			required: true,
		},
		message: {
			type: String,
			maxlength: 500,
		},
		status: {
			type: String,
			enum: ["pending", "accepted", "rejected", "cancelled"],
			default: "pending",
		},
	},
	{
		timestamps: true,
	}
);

// Indexes
bidSchema.index({ requirementId: 1, status: 1 });
bidSchema.index({ tractorOwnerId: 1, status: 1 });

module.exports = mongoose.models.Bid || mongoose.model("Bid", bidSchema);
