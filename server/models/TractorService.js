const mongoose = require("mongoose");

const tractorServiceSchema = new mongoose.Schema(
	{
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		vehicleNumber: {
			type: String,
			required: [true, "Please provide vehicle number"],
			unique: true,
			uppercase: true,
		},
		model: {
			type: String,
			required: [true, "Please provide tractor model"],
		},
		brand: {
			type: String,
			required: true,
		},
		typeOfPlowing: {
			type: String,
			enum: [
				"Plowing",
				"Harvesting",
				"Spraying",
				"Hauling",
				"Land Preparation",
			],
			required: true,
		},
		landType: {
			type: String,
			enum: ["Dry", "Wet", "Hilly", "Plain"],
			required: true,
		},
		chargePerAcre: {
			type: Number,
			required: [true, "Please provide charge per acre"],
			min: 0,
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
		images: [
			{
				type: String,
			},
		],
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("TractorService", tractorServiceSchema);
