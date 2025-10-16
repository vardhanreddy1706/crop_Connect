const Booking = require("../models/Booking");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const TractorRequirement = require("../models/TractorRequirement");
const TractorService = require("../models/TractorService"); // ✅ ADD THIS
const WorkerService = require("../models/WorkerService"); // ✅ ADD THIS
const User = require("../models/User");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay
const razorpay = new Razorpay({
	key_id: process.env.RAZORPAY_KEY_ID,
	key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create direct booking (when farmer books a tractor directly)
const createBooking = async (req, res) => {
	try {
		const {
			tractorServiceId,
			bookingDate,
			duration,
			location,
			workType,
			landSize,
			notes,
		} = req.body;

		// Get tractor service
		const tractorService = await TractorService.findById(tractorServiceId);

		if (!tractorService) {
			return res.status(404).json({
				success: false,
				message: "Tractor service not found",
			});
		}

		if (!tractorService.availability) {
			return res.status(400).json({
				success: false,
				message: "This tractor is not available",
			});
		}

		// Calculate cost
		const totalCost = Math.round(
			tractorService.chargePerAcre * (landSize || 1)
		);

		// Create booking
		const booking = await Booking.create({
			farmer: req.user._id,
			tractorOwnerId: tractorService.owner,
			serviceType: "tractor",
			serviceId: tractorServiceId,
			serviceModel: "TractorService",
			bookingDate,
			duration: duration || 8,
			totalCost,
			location,
			workType: workType || tractorService.typeOfPlowing,
			landSize,
			status: "confirmed",
			paymentStatus: "pending",
			notes,
		});

		// Populate tractor owner details
		await booking.populate("tractorOwnerId", "name phone email");

		// Create notification for tractor owner
		await Notification.create({
			recipientId: tractorService.owner,
			type: "booking_received",
			title: "🎉 New Booking Received!",
			message: `${req.user.name} has booked your tractor for ${workType}`,
			relatedUserId: req.user._id,
			data: {
				bookingId: booking._id,
				workType,
				landSize,
				totalCost,
				bookingDate,
			},
		});

		// Socket notification
		if (req.io) {
			req.io.to(tractorService.owner.toString()).emit("notification", {
				type: "booking_received",
				title: "🎉 New Booking!",
				message: `New booking for ${workType}`,
				bookingId: booking._id,
			});
		}

		res.status(201).json({
			success: true,
			message: "Booking created successfully",
			booking,
		});
	} catch (error) {
		console.error("Create booking error:", error);
		res.status(500).json({
			success: false,
			message: error.message || "Failed to create booking",
		});
	}
};

// Get farmer's tractor bookings
const getFarmerTractorBookings = async (req, res) => {
	try {
		const bookings = await Booking.find({
			farmer: req.user._id,
			serviceType: "tractor",
		})
			.populate("tractorOwnerId", "name phone email")
			.populate("serviceId")
			.sort({ createdAt: -1 })
			.lean();

		res.status(200).json({
			success: true,
			bookings,
		});
	} catch (error) {
		console.error("Get farmer tractor bookings error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get farmer's worker bookings
const getFarmerWorkerBookings = async (req, res) => {
	try {
		res.status(200).json({
			success: true,
			bookings: [],
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get farmer's tractor requirements
const getFarmerTractorRequirements = async (req, res) => {
	try {
		const requirements = await TractorRequirement.find({
			farmer: req.user._id,
		})
			.populate("acceptedBy", "name phone email")
			.sort({ createdAt: -1 })
			.lean();

		res.status(200).json({
			success: true,
			requirements,
		});
	} catch (error) {
		console.error("Get farmer tractor requirements error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get farmer's worker requirements
const getFarmerWorkerRequirements = async (req, res) => {
	try {
		res.status(200).json({
			success: true,
			requirements: [],
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get all farmer bookings
const getAllFarmerBookings = async (req, res) => {
	try {
		const bookings = await Booking.find({ farmer: req.user._id })
			.populate("tractorOwnerId", "name phone email")
			.populate("serviceId")
			.sort({ createdAt: -1 })
			.lean();

		res.status(200).json({
			success: true,
			bookings,
		});
	} catch (error) {
		console.error("Get all farmer bookings error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get tractor owner's bookings
const getTractorOwnerBookings = async (req, res) => {
	try {
		const bookings = await Booking.find({ tractorOwnerId: req.user._id })
			.populate("farmer", "name phone email")
			.populate("serviceId")
			.sort({ createdAt: -1 })
			.lean();

		res.status(200).json({
			success: true,
			bookings,
		});
	} catch (error) {
		console.error("Get tractor owner bookings error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Create Razorpay Order
const createRazorpayOrder = async (req, res) => {
	try {
		const booking = await Booking.findById(req.params.id);

		if (!booking) {
			return res.status(404).json({
				success: false,
				message: "Booking not found",
			});
		}

		// Check authorization
		if (!req.user || booking.farmer.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized",
			});
		}

		if (booking.paymentStatus === "paid") {
			return res.status(400).json({
				success: false,
				message: "Booking already paid",
			});
		}

		// Check if tractorOwnerId exists
		if (!booking.tractorOwnerId) {
			return res.status(400).json({
				success: false,
				message: "Tractor owner information missing. Please contact support.",
			});
		}

		// Check if Razorpay is configured
		if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
			console.warn("⚠️ Razorpay credentials not configured");
			// Return mock order for development
			const mockOrder = {
				id: `order_mock_${Date.now()}`,
				amount: booking.totalCost * 100,
				currency: "INR",
			};

			booking.razorpayOrderId = mockOrder.id;
			booking.paymentMethod = "pay_now";
			await booking.save();

			return res.status(200).json({
				success: true,
				order: mockOrder,
				bookingId: booking._id,
				amount: booking.totalCost,
				key: "rzp_test_mock",
				isMock: true,
			});
		}

		// Create real Razorpay order
		const options = {
			amount: booking.totalCost * 100,
			currency: "INR",
			receipt: `booking_${booking._id}`,
			notes: {
				bookingId: booking._id.toString(),
				farmerId: booking.farmer.toString(),
				tractorOwnerId: booking.tractorOwnerId.toString(),
			},
		};

		const order = await razorpay.orders.create(options);

		booking.razorpayOrderId = order.id;
		booking.paymentMethod = "pay_now";
		await booking.save();

		res.status(200).json({
			success: true,
			order,
			bookingId: booking._id,
			amount: booking.totalCost,
			key: process.env.RAZORPAY_KEY_ID,
			isMock: false,
		});
	} catch (error) {
		console.error("Create Razorpay order error:", error);
		res.status(500).json({
			success: false,
			message: error.message || "Failed to create order",
		});
	}
};

// Verify Payment
const verifyPayment = async (req, res) => {
	try {
		const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
			req.body;

		const booking = await Booking.findById(req.params.id).populate(
			"tractorOwnerId",
			"name phone email"
		);

		if (!booking) {
			return res.status(404).json({
				success: false,
				message: "Booking not found",
			});
		}

		// Verify signature (only if not mock)
		if (
			process.env.RAZORPAY_KEY_SECRET &&
			!razorpay_order_id.includes("mock")
		) {
			const body = razorpay_order_id + "|" + razorpay_payment_id;
			const expectedSignature = crypto
				.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
				.update(body.toString())
				.digest("hex");

			const isAuthentic = expectedSignature === razorpay_signature;

			if (!isAuthentic) {
				return res.status(400).json({
					success: false,
					message: "Payment verification failed - Invalid signature",
				});
			}
		}

		// Update booking
		booking.paymentStatus = "paid";
		booking.razorpayPaymentId = razorpay_payment_id;
		booking.razorpaySignature = razorpay_signature;
		booking.paidAt = new Date();
		await booking.save();

		// Create transaction
		const transaction = await Transaction.create({
			bookingId: booking._id,
			farmerId: booking.farmer,
			tractorOwnerId: booking.tractorOwnerId._id,
			amount: booking.totalCost,
			method: "razorpay",
			paymentId: razorpay_payment_id,
			razorpayOrderId: razorpay_order_id,
			razorpaySignature: razorpay_signature,
			status: "completed",
			paidAt: new Date(),
		});

		// Notify tractor owner
		if (req.io) {
			req.io.to(booking.tractorOwnerId._id.toString()).emit("notification", {
				type: "payment_received",
				title: "💰 Payment Received!",
				message: `Payment of ₹${booking.totalCost} received`,
				amount: booking.totalCost,
			});
		}

		await Notification.create({
			recipientId: booking.tractorOwnerId._id,
			type: "payment_received",
			title: "💰 Payment Received!",
			message: `Payment of ₹${booking.totalCost} received for ${booking.workType}`,
			relatedUserId: booking.farmer,
			data: {
				bookingId: booking._id,
				transactionId: transaction._id,
				amount: booking.totalCost,
			},
		});

		res.status(200).json({
			success: true,
			message: "Payment successful",
			booking,
			transaction,
		});
	} catch (error) {
		console.error("Verify payment error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Choose Pay After Work
const choosePayAfterWork = async (req, res) => {
	try {
		const booking = await Booking.findById(req.params.id);

		if (!booking) {
			return res.status(404).json({
				success: false,
				message: "Booking not found",
			});
		}

		booking.paymentMethod = "pay_after_work";
		booking.paymentStatus = "pending";
		await booking.save();

		res.status(200).json({
			success: true,
			message: "Payment method set to pay after work",
			booking,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// ✅ COMPLETE FIX: Complete work + Update service availability
const completeWork = async (req, res) => {
	try {
		const booking = await Booking.findById(req.params.id)
			.populate("farmer", "name phone email")
			.populate("tractorOwnerId", "name phone email");

		if (!booking) {
			return res
				.status(404)
				.json({ success: false, message: "Booking not found" });
		}

		// ✅ Authorization: Check based on role and serviceType
		const isFarmer = booking.farmer._id.toString() === req.user._id.toString();
		const isTractorOwner =
			booking.tractorOwnerId &&
			booking.tractorOwnerId._id.toString() === req.user._id.toString();

		// For worker bookings, tractorOwnerId actually stores the worker's ID
		const isWorkerBooking = booking.serviceType === "worker";
		const isAuthorizedWorker = isWorkerBooking && isTractorOwner;

		if (!isFarmer && !isTractorOwner && !isAuthorizedWorker) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to complete this booking",
			});
		}

		if (booking.status === "completed") {
			return res.status(400).json({
				success: false,
				message: "Booking already marked as completed",
			});
		}

		// Update booking status
		booking.status = "completed";
		booking.workCompletedAt = new Date();
		await booking.save();

		// ✅ Update service availability back to true
		if (booking.serviceType === "worker" && booking.serviceId) {
			await WorkerService.findByIdAndUpdate(booking.serviceId, {
				availability: true,
				isBooked: false,
			});
		} else if (booking.serviceType === "tractor" && booking.serviceId) {
			await TractorService.findByIdAndUpdate(booking.serviceId, {
				availability: true,
				isBooked: false,
			});
		}

		// Create notification for farmer
		await Notification.create({
			recipientId: booking.farmer._id,
			type: "work_completed",
			title: "🎊 Work Completed!",
			message: `${req.user.name} has marked the work as completed.`,
			data: {
				bookingId: booking._id,
				totalCost: booking.totalCost,
			},
		});

		res.status(200).json({
			success: true,
			message: "Work marked as completed successfully",
			booking,
		});
	} catch (error) {
		console.error("Complete work error:", error);
		res.status(500).json({
			success: false,
			message: error.message || "Failed to complete work",
		});
	}
};

// Cancel booking
const cancelBooking = async (req, res) => {
	try {
		const booking = await Booking.findById(req.params.id);

		if (!booking) {
			return res.status(404).json({
				success: false,
				message: "Booking not found",
			});
		}

		booking.status = "cancelled";
		await booking.save();

		// Notify other user
		const otherUserId =
			booking.farmer.toString() === req.user._id.toString()
				? booking.tractorOwnerId
				: booking.farmer;

		await Notification.create({
			recipientId: otherUserId,
			type: "booking_cancelled",
			title: "Booking Cancelled",
			message: `${req.user.name} has cancelled the booking`,
			data: {
				bookingId: booking._id,
			},
		});

		res.status(200).json({
			success: true,
			message: "Booking cancelled",
			booking,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Complete Booking (Tractor Owner marks work done)
const completeBooking = async (req, res) => {
	try {
		const booking = await Booking.findById(req.params.id);

		if (!booking) {
			return res.status(404).json({
				success: false,
				message: "Booking not found",
			});
		}

		if (booking.tractorOwnerId.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to complete this booking",
			});
		}

		if (booking.status === "completed") {
			return res.status(400).json({
				success: false,
				message: "Booking already marked as completed",
			});
		}

		booking.status = "completed";
		booking.workCompletedAt = new Date();
		await booking.save();

		// Notify farmer
		await Notification.create({
			recipientId: booking.farmer,
			type: "work_completed",
			title: "🎊 Work Completed!",
			message: `${req.user.name} has marked the work as completed. Please proceed with payment.`,
			data: {
				bookingId: booking._id,
				totalCost: booking.totalCost,
			},
		});

		res.status(200).json({
			success: true,
			message: "Work marked as completed successfully",
			booking,
		});
	} catch (error) {
		console.error("Complete booking error:", error);
		res.status(500).json({
			success: false,
			message: error.message || "Failed to complete booking",
		});
	}
};

const getWorkerBookings = async (req, res) => {
	try {
		const bookings = await Booking.find({
			tractorOwnerId: req.user.id,
			serviceType: "worker",
		})
			.populate("farmer", "name email phone")
			.populate({
				path: "serviceId",
				model: "WorkerService",
			})
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: bookings.length,
			bookings,
		});
	} catch (error) {
		console.error("Get worker bookings error:", error);
		res.status(500).json({
			success: false,
			message: error.message || "Failed to fetch bookings",
		});
	}
};

// Mark booking as complete
const markBookingComplete = async (req, res) => {
	try {
		const booking = await Booking.findById(req.params.id);

		if (!booking) {
			return res.status(404).json({
				success: false,
				message: "Booking not found",
			});
		}

		// Check if user is the service provider
		if (booking.tractorOwnerId.toString() !== req.user.id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to update this booking",
			});
		}

		booking.status = "completed";
		booking.workCompletedAt = new Date();
		await booking.save();

		res.status(200).json({
			success: true,
			message: "Booking marked as completed",
			booking,
		});
	} catch (error) {
		console.error("Mark complete error:", error);
		res.status(500).json({
			success: false,
			message: error.message || "Failed to mark as complete",
		});
	}
};

module.exports = {
	getFarmerTractorBookings,
	getFarmerWorkerBookings,
	getFarmerTractorRequirements,
	getFarmerWorkerRequirements,
	getAllFarmerBookings,
	getTractorOwnerBookings,
	createRazorpayOrder,
	verifyPayment,
	choosePayAfterWork,
	completeWork,
	cancelBooking,
	createBooking,
	completeBooking,
	getWorkerBookings,
	markBookingComplete,
};
