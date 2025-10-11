const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
	{
		buyer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		orderType: {
			type: String,
			enum: ["crop", "product"],
			required: true,
		},
		items: [
			{
				itemId: {
					type: mongoose.Schema.Types.ObjectId,
					required: true,
					refPath: "orderType",
				},
				name: String,
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
			},
		],
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},
		deliveryAddress: {
			village: String,
			district: String,
			state: String,
			pincode: String,
			contactNumber: String,
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
		paymentMethod: {
			type: String,
			enum: ["cash", "upi", "card", "net_banking"],
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("Order", orderSchema);
