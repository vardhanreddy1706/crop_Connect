const Transaction = require("../models/Transaction");
const Booking = require("../models/Booking");
const Notification = require("../models/Notification");
const User = require("../models/User");

// @desc Get transaction dashboard data
// @route GET /api/transactions/dashboard
// @access Private
exports.getTransactionDashboard = async (req, res) => {
	try {
		const userId = req.user._id;
		const userRole = req.user.role;

		let transactionQuery = {};
		if (userRole === "farmer") {
			transactionQuery.farmerId = userId;
		} else if (userRole === "tractor_owner") {
			transactionQuery.tractorOwnerId = userId;
		}

		// Use lean() for faster queries (returns plain JS objects instead of Mongoose documents)
		const transactions = await Transaction.find(transactionQuery)
			.populate("bookingId", "workType landSize bookingDate status")
			.populate("farmerId", "name phone")
			.populate("tractorOwnerId", "name phone")
			.sort({ createdAt: -1 })
			.limit(20) // Reduced from 50
			.lean(); // FASTER!

		// Calculate stats in a single aggregation
		const stats = await Transaction.aggregate([
			{ $match: transactionQuery },
			{
				$group: {
					_id: null,
					totalTransactions: { $sum: 1 },
					totalAmount: {
						$sum: { $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0] },
					},
					pendingAmount: {
						$sum: { $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0] },
					},
					completedTransactions: {
						$sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
					},
					pendingTransactions: {
						$sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
					},
					failedTransactions: {
						$sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
					},
				},
			},
		]);

		const finalStats = stats[0] || {
			totalTransactions: 0,
			totalAmount: 0,
			pendingAmount: 0,
			completedTransactions: 0,
			pendingTransactions: 0,
			failedTransactions: 0,
		};

		// Get pending bookings - optimized
		const pendingPaymentBookings = await Booking.find({
			[userRole === "farmer" ? "farmer" : "serviceId"]: userId,
			status: "completed",
			paymentStatus: "pending",
		})
			.populate("farmer", "name phone")
			.populate("serviceId", "name phone")
			.sort({ updatedAt: -1 })
			.limit(10)
			.lean();

		res.status(200).json({
			success: true,
			transactions,
			stats: finalStats,
			pendingPaymentBookings,
			userRole,
		});
	} catch (error) {
		console.error("Dashboard Error:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// @desc Record payment after work completion
// @route POST /api/transactions/pay-after-work
// @access Private (Farmer)
exports.payAfterWorkCompletion = async (req, res) => {
	try {
		const { bookingId, paymentMethod = "cash" } = req.body;
		const booking = await Booking.findById(bookingId)
			.populate("serviceId", "name phone")
			.populate("farmer", "name phone");

		if (!booking)
			return res
				.status(404)
				.json({ success: false, message: "Booking not found" });
		if (booking.farmer._id.toString() !== req.user._id.toString())
			return res
				.status(403)
				.json({
					success: false,
					message: "Not authorized to pay for this booking",
				});
		if (booking.status !== "completed")
			return res
				.status(400)
				.json({
					success: false,
					message: "Work must be completed before payment",
				});
		if (booking.paymentStatus === "paid")
			return res
				.status(400)
				.json({ success: false, message: "Payment already completed" });

		const transaction = await Transaction.create({
			bookingId,
			farmerId: booking.farmer._id,
			tractorOwnerId: booking.serviceId._id,
			amount: booking.totalCost,
			method: paymentMethod,
			status: "completed",
			notes: `Payment for ${booking.workType} work`,
		});

		booking.paymentStatus = "paid";
		await booking.save();

		await Notification.create({
			recipientId: booking.serviceId._id,
			type: "payment_received",
			title: "💰 Payment Received",
			message: `You received ₹${booking.totalCost} from ${booking.farmer.name} for ${booking.workType} work`,
			relatedBookingId: bookingId,
			data: {
				amount: booking.totalCost,
				paymentMethod,
				farmerName: booking.farmer.name,
				workType: booking.workType,
			},
		});

		await Notification.create({
			recipientId: booking.farmer._id,
			type: "payment_sent",
			title: "✅ Payment Completed",
			message: `Payment of ₹${booking.totalCost} sent successfully to ${booking.serviceId.name}`,
			relatedBookingId: bookingId,
			data: {
				amount: booking.totalCost,
				paymentMethod,
				tractorOwnerName: booking.serviceId.name,
				workType: booking.workType,
			},
		});

		if (req.io) {
			req.io.to(booking.serviceId._id.toString()).emit("notification", {
				type: "payment_received",
				title: "💰 Payment Received",
				message: `You received ₹${booking.totalCost} from ${booking.farmer.name}`,
				timestamp: new Date(),
			});
		}

		res
			.status(201)
			.json({
				success: true,
				message: "Payment recorded successfully",
				transaction,
				booking,
			});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// @desc Get payment options for completed work
// @route GET /api/transactions/payment-options/:bookingId
// @access Private
exports.getPaymentOptions = async (req, res) => {
	try {
		const booking = await Booking.findById(req.params.bookingId)
			.populate("farmer", "name phone")
			.populate("serviceId", "name phone");

		if (!booking)
			return res
				.status(404)
				.json({ success: false, message: "Booking not found" });

		const isAuthorized =
			booking.farmer._id.toString() === req.user._id.toString() ||
			booking.serviceId._id.toString() === req.user._id.toString();
		if (!isAuthorized)
			return res
				.status(403)
				.json({
					success: false,
					message: "Not authorized to view payment options",
				});

		const paymentOptions = {
			bookingId: booking._id,
			workType: booking.workType,
			totalCost: booking.totalCost,
			farmerName: booking.farmer.name,
			tractorOwnerName: booking.serviceId.name,
			workDate: booking.bookingDate,
			workCompleted: booking.status === "completed",
			paymentStatus: booking.paymentStatus,
			availablePaymentMethods: [
				{
					method: "cash",
					title: "Pay After Work Completion",
					description: "Mark payment as completed after work is done",
					available: booking.status === "completed",
				},
				{
					method: "razorpay",
					title: "Pay Online via Razorpay",
					description: "Secure online payment with UPI/Card/Wallet",
					available: true,
				},
			],
		};

		res.status(200).json({ success: true, paymentOptions });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// @desc Get transactions
// @route GET /api/transactions
// @access Private
exports.getTransactions = async (req, res) => {
	try {
		const transactions = await Transaction.find({
			$or: [{ farmerId: req.user._id }, { tractorOwnerId: req.user._id }],
		})
			.populate("bookingId", "workType landSize bookingDate status")
			.populate("farmerId", "name phone")
			.populate("tractorOwnerId", "name phone")
			.sort({ createdAt: -1 });

		const transactionsWithType = transactions.map((t) => ({
			...t.toObject(),
			transactionType:
				t.farmerId._id.toString() === req.user._id.toString()
					? "outgoing"
					: "incoming",
		}));

		res
			.status(200)
			.json({
				success: true,
				count: transactions.length,
				transactions: transactionsWithType,
			});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// @desc Legacy cash payment (kept for compatibility)
// @route POST /api/transactions/cash-payment
// @access Private
exports.recordCashPayment = async (req, res) => {
	try {
		const { bookingId, amount } = req.body;
		const booking = await Booking.findById(bookingId);
		if (!booking)
			return res
				.status(404)
				.json({ success: false, message: "Booking not found" });

		const transaction = await Transaction.create({
			bookingId,
			farmerId: booking.farmer,
			tractorOwnerId: booking.serviceId,
			amount,
			method: "cash",
			status: "completed",
		});

		booking.paymentStatus = "paid";
		await booking.save();

		res
			.status(201)
			.json({
				success: true,
				message: "Cash payment recorded successfully",
				transaction,
			});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// @desc Initiate Razorpay payment
// @route POST /api/transactions/razorpay/initiate
// @access Private
exports.initiateRazorpayPayment = async (req, res) => {
	try {
		const { bookingId } = req.body;
		const booking = await Booking.findById(bookingId);
		if (!booking)
			return res
				.status(404)
				.json({ success: false, message: "Booking not found" });

		const amount = booking.totalCost;
		const Razorpay = require("razorpay");

		const razorpay = new Razorpay({
			key_id: process.env.RAZORPAY_KEY_ID,
			key_secret: process.env.RAZORPAY_KEY_SECRET,
		});

		const order = await razorpay.orders.create({
			amount: amount * 100,
			currency: "INR",
			receipt: `receipt_${bookingId}`,
			notes: {
				bookingId,
				workType: booking.workType,
				landSize: booking.landSize,
			},
		});

		const transaction = await Transaction.create({
			bookingId,
			farmerId: req.user._id,
			tractorOwnerId: booking.serviceId,
			amount,
			method: "razorpay",
			status: "pending",
			razorpayOrderId: order.id,
		});

		res.status(201).json({
			success: true,
			order,
			transaction,
			bookingDetails: {
				workType: booking.workType,
				landSize: booking.landSize,
				totalCost: booking.totalCost,
			},
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// @desc Verify Razorpay payment
// @route POST /api/transactions/razorpay/verify
// @access Private
exports.verifyRazorpayPayment = async (req, res) => {
	try {
		const { orderId, paymentId, signature, bookingId } = req.body;
		const crypto = require("crypto");

		const body = orderId + "|" + paymentId;
		const expectedSignature = crypto
			.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
			.update(body)
			.digest("hex");
		if (expectedSignature !== signature)
			return res
				.status(400)
				.json({ success: false, message: "Payment verification failed" });

		const transaction = await Transaction.findOneAndUpdate(
			{ razorpayOrderId: orderId },
			{
				status: "completed",
				razorpayPaymentId: paymentId,
				razorpaySignature: signature,
			},
			{ new: true }
		);

		const booking = await Booking.findById(bookingId);
		booking.paymentStatus = "paid";
		await booking.save();

		res
			.status(200)
			.json({
				success: true,
				message: "Payment verified successfully",
				transaction,
			});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
