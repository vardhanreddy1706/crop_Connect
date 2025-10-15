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
			// ✅ REMOVE required: true (make it optional)
		},
		tractorOwnerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			// ✅ REMOVE required: true (make it optional)
		},
		workerId: {
			// ✅ ADD THIS FIELD
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		amount: {
			type: Number,
			required: true,
			min: 0,
		},
		method: {
			type: String,
			enum: ["razorpay", "cash", "upi", "bank_transfer"],
			default: "razorpay",
		},
		paymentId: {
			type: String,
		},
		razorpayOrderId: {
			type: String,
		},
		razorpaySignature: {
			type: String,
		},
		status: {
			type: String,
			enum: ["pending", "completed", "failed", "refunded"],
			default: "completed",
		},
		paidAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
	}
);

// Indexes
transactionSchema.index({ farmerId: 1, status: 1 });
transactionSchema.index({ tractorOwnerId: 1, status: 1 });
transactionSchema.index({ workerId: 1, status: 1 }); // ✅ ADD THIS
transactionSchema.index({ bookingId: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
