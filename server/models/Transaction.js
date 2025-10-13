const mongoose = require("mongoose");



const transactionSchema = new mongoose.Schema(
	{
		bookingId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Booking",
			required: true,
		},
		farmerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		tractorOwnerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		amount: {
			type: Number,
			required: true,
			min: 0,
		},
		method: {
			type: String,
			enum: ["cash", "razorpay", "upi", "card"],
			required: true,
		},
		status: {
			type: String,
			enum: ["pending", "completed", "failed", "refunded"],
			default: "pending",
		},
		razorpayOrderId: String,
		razorpayPaymentId: String,
		razorpaySignature: String,
		notes: String,
	},
	{
		timestamps: true,
	}
);

transactionSchema.index({ farmerId: 1, status: 1 });
transactionSchema.index({ tractorOwnerId: 1, status: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
