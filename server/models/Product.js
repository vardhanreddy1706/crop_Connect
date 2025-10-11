const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Please provide product name"],
			trim: true,
		},
		category: {
			type: String,
			required: true,
			enum: [
				"Fertilizers",
				"Pesticides",
				"Seeds",
				"Tools",
				"Equipment",
				"Other",
			],
		},
		price: {
			type: Number,
			required: [true, "Please provide price"],
			min: 0,
		},
		description: {
			type: String,
			maxlength: 1000,
		},
		image: {
			type: String,
			default: "",
		},
		stock: {
			type: Number,
			default: 0,
			min: 0,
		},
		brand: {
			type: String,
			trim: true,
		},
		ratings: {
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
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("Product", productSchema);
