// server/models/Cart.js
const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
	itemId: {
		type: mongoose.Schema.Types.Mixed,
	},
	name: {
		type: String,
		required: true,
	},
	quantity: {
		type: Number,
		required: true,
		min: 1,
		default: 1,
	},
	price: {
		type: Number,
		required: true,
	},
	unit: {
		type: String,
		required: true,
	},
	image: String,
});

const cartSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			unique: true,
		},
		items: [cartItemSchema],
	},
	{
		timestamps: true,
	}
);

cartSchema.index({ user: 1 });
module.exports = mongoose.model("Cart", cartSchema);
