// server/models/Order.js

const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
	{
		buyer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		seller: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		items: [
			{
				crop: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Crop",
					required: true,
				},
				quantity: {
					type: Number,
					required: true,
					min: 1,
				},
				pricePerUnit: {
					type: Number,
					required: true,
					min: 0,
				},
				total: {
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
		// ✅ FIXED: Add paymentMethod field with correct enum values
		paymentMethod: {
			type: String,
			enum: ["razorpay", "payAfterDelivery"], // ✅ Use camelCase, not snake_case
			default: "razorpay",
		},
		paymentStatus: {
			type: String,
			enum: ["pending", "completed", "failed", "refunded"],
			default: "pending",
		},
		vehicleDetails: {
			vehicleType: String,
			vehicleNumber: String,
			driverName: String,
			driverPhone: String,
		},
		pickupSchedule: {
			date: String,
			timeSlot: String,
		},
		deliveryAddress: {
			village: String,
			district: String,
			state: String,
			pincode: String,
			fullAddress: {
				type: String,
				required: true,
			},
		},
		status: {
			type: String,
			enum: ["pending", "confirmed", "picked", "completed", "cancelled"],
			default: "pending",
		},
		razorpayOrderId: String,
		razorpayPaymentId: String,
		razorpaySignature: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
