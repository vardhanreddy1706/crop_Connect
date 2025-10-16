const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema(
	{
		seller: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		cropName: {
			type: String,
			required: [true, "Please provide crop name"],
			trim: true,
		},
		variety: {
			type: String,
			trim: true,
		},
		quantity: {
			type: Number,
			required: [true, "Please provide quantity"],
			min: 0,
		},
		pricePerUnit: {
			type: Number,
			required: [true, "Please provide price per unit"],
			min: 0,
		},
		unit: {
			type: String,
			enum: ["kg", "quintal", "ton"],
			default: "quintal",
		},
		farmer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true, // ✅ This is the seller
		},
		pricePerUnit: {
			type: Number,
			required: [true, "Please provide price per unit"],
			min: 0,
		},
		location: {
			village: String,
			district: String,
			state: String,
			pincode: String,
		},
		harvestDate: {
			type: Date,
		},

		description: {
			type: String,
			maxlength: 500,
		},
		images: [
			{
				type: String,
			},
		],
		status: {
			type: String,
			enum: ["available", "sold", "pending"],
			default: "available",
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("Crop", cropSchema);
