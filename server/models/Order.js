// server/models/Order.js
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
	itemId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	quantity: {
		type: Number,
		required: true,
		min: 1,
	},
	price: {
		type: Number,
		required: true,
		min: 0,
	},
});

const orderSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		orderType: {
			type: String,
			enum: ["crop", "product"],
			required: true,
		},
		items: [orderItemSchema],
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},
		status: {
			type: String,
			enum: ["pending", "processing", "in_transit", "delivered", "cancelled"],
			default: "pending",
		},
		paymentStatus: {
			type: String,
			enum: ["pending", "completed", "failed"],
			default: "pending",
		},
		shippingAddress: {
			village: String,
			district: String,
			state: String,
			pincode: String,
			contactNumber: String,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("Order", orderSchema);
