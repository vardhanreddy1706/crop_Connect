const Booking = require("../models/Booking");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const TractorRequirement = require("../models/TractorRequirement");
const TractorService = require("../models/TractorService"); // ✅ ADD THIS
const WorkerService = require("../models/WorkerService"); // ✅ ADD THIS
const User = require("../models/User");
const Razorpay = require("razorpay");
const NotificationService = require("../services/notificationService");
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

		// Calculate cost
		const acres = parseFloat(landSize || 1) || 1;
		const totalCost = Math.round(tractorService.chargePerAcre * acres);

		// Normalize location (string -> object)
		let locationObj = location;
		if (typeof location === "string") {
			locationObj = { district: location, fullAddress: location };
		}

		// Parse booking date and calculate time slot
		const requested = new Date(bookingDate || Date.now());
		const bookingDurationHours = parseFloat(duration || 8);
		const bookingStartTime = new Date(requested);
		const bookingEndTime = new Date(bookingStartTime.getTime() + bookingDurationHours * 60 * 60 * 1000);

		// Enforce: tractor not double-booked during overlapping time slot
		const overlappingBookings = await Booking.find({
			serviceId: tractorServiceId,
			serviceType: "tractor",
			status: { $in: ["pending", "confirmed", "in_progress"] },
		});

		for (const existingBooking of overlappingBookings) {
			const existingStart = new Date(existingBooking.bookingDate);
			const existingDurationHours = parseFloat(existingBooking.duration || 8);
			const existingEnd = new Date(existingStart.getTime() + existingDurationHours * 60 * 60 * 1000);

			// Check if time slots overlap
			const timeOverlaps = 
				(bookingStartTime >= existingStart && bookingStartTime < existingEnd) ||
				(bookingEndTime > existingStart && bookingEndTime <= existingEnd) ||
				(bookingStartTime <= existingStart && bookingEndTime >= existingEnd);

			if (timeOverlaps) {
				return res.status(409).json({
					success: false,
					message: `This tractor service is already booked from ${existingStart.toLocaleString()} for ${existingDurationHours} hours. Please choose a different time slot.`,
				});
			}
		}

		// Create booking
		const booking = await Booking.create({
			farmer: req.user._id,
			tractorOwnerId: tractorService.owner,
			serviceType: "tractor",
			serviceId: tractorServiceId,
			serviceModel: "TractorService",
			bookingDate: requested,
			duration: duration || 8,
			totalCost,
			location: locationObj,
			workType: workType || tractorService.typeOfPlowing,
			landSize: acres,
			status: "confirmed",
			paymentStatus: "pending",
			notes,
		});

		// Note: We don't mark the service as permanently unavailable here
		// Availability is checked dynamically based on time slot conflicts

		// Populate tractor owner details
		await booking.populate("tractorOwnerId", "name phone email");

		// Create notification for tractor owner
		await Notification.create({
			recipientId: tractorService.owner,
			type: "booking_received",
			title: "🎉 New Booking Received!",
			message: `${req.user.name} has booked your tractor for ${workType || tractorService.typeOfPlowing}`,
			relatedUserId: req.user._id,
			data: {
				bookingId: booking._id,
				workType,
				landSize: acres,
				totalCost,
				bookingDate,
			},
		});

// Email notifications
		try {
			// Email farmer (booking confirmation)
			await NotificationService.notifyBookingCreated(
				req.user,
				booking,
				"tractor",
				req.emailTransporter
			);
			// Email tractor owner (new booking received)
			await NotificationService.notifyNewBookingForProvider(
				booking.tractorOwnerId,
				booking,
				"tractor",
				req.emailTransporter
			);
		} catch (e) {
			console.error("Email notify (createBooking) error:", e.message);
		}

// Socket notification
		if (req.io) {
			req.io.to(tractorService.owner.toString()).emit("notification", {
				type: "booking_received",
				title: "🎉 New Booking!",
			message: `New booking for ${workType || tractorService.typeOfPlowing}`,
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
		const bookings = await Booking.find({
			farmer: req.user._id,
			serviceType: "worker",
		})
			.populate("tractorOwnerId", "name phone email") // this is the worker user
			.populate("serviceId")
			.sort({ createdAt: -1 })
			.lean();

		// normalize to match frontend expectations
		const normalized = bookings.map((b) => ({
			...b,
			serviceProvider: b.tractorOwnerId, // just like tractor bookings
		}));

		res.status(200).json({
			success: true,
			bookings: normalized,
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
const WorkerRequirement = require("../models/WorkerRequirement");
const getFarmerWorkerRequirements = async (req, res) => {
	try {
		const requirements = await WorkerRequirement.find({ farmer: req.user._id })
			.populate("acceptedBy", "name phone email")
			.sort({ createdAt: -1 })
			.lean();

		res.status(200).json({
			success: true,
			requirements,
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
// Email failure notifications (best-effort)
				try {
					await NotificationService.notifyPaymentFailed(
						req.user,
						{ amount: booking.totalCost, bookingId: booking._id },
						req.emailTransporter
					);
					if (booking.tractorOwnerId) {
						await NotificationService.notifyPaymentFailed(
							booking.tractorOwnerId,
							{ amount: booking.totalCost, bookingId: booking._id },
							req.emailTransporter
						);
					}
				} catch (e) {
					console.error("Email notify (payment failed) error:", e.message);
				}

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

// Realtime notify tractor owner
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

// Email notifications for payment
		try {
			await NotificationService.notifyPaymentReceived(
				booking.tractorOwnerId,
				transaction,
				req.emailTransporter
			);
			await NotificationService.notifyPaymentSent(
				req.user,
				transaction,
				req.emailTransporter
			);
		} catch (e) {
			console.error("Email notify (verifyPayment) error:", e.message);
		}

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

		// ✅ Check if service has other active bookings before marking as available
		if (booking.serviceId) {
			const otherActiveBookings = await Booking.countDocuments({
				serviceId: booking.serviceId,
				serviceType: booking.serviceType,
				status: { $in: ["pending", "confirmed", "in_progress"] },
				_id: { $ne: booking._id },
			});

			// Only mark as available if no other active bookings exist
			if (otherActiveBookings === 0) {
				if (booking.serviceType === "worker") {
					await WorkerService.findByIdAndUpdate(booking.serviceId, {
						availability: true,
						bookingStatus: "available",
					});
				} else if (booking.serviceType === "tractor") {
					await TractorService.findByIdAndUpdate(booking.serviceId, {
						availability: true,
						isBooked: false,
					});
				}
			}
		}

		// Create notification for farmer (ensure correct id shape)
		await Notification.create({
			recipientId: booking.farmer, // booking.farmer is an ObjectId; no ._id
			type: "booking_completed",
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

		// ✅ Check if service has other active bookings before marking as available
		if (booking.serviceId) {
			const otherActiveBookings = await Booking.countDocuments({
				serviceId: booking.serviceId,
				serviceType: booking.serviceType,
				status: { $in: ["pending", "confirmed", "in_progress"] },
				_id: { $ne: booking._id },
			});

			// Only mark as available if no other active bookings exist
			if (otherActiveBookings === 0) {
				if (booking.serviceType === "worker") {
					await WorkerService.findByIdAndUpdate(booking.serviceId, {
						availability: true,
						bookingStatus: "available",
					});
				} else if (booking.serviceType === "tractor") {
					await TractorService.findByIdAndUpdate(booking.serviceId, {
						availability: true,
						isBooked: false,
					});
				}
			}
		}

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
			type: "booking_completed",
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

// ✅ Auto-complete bookings when time passes and send payment notifications
const autoCompleteExpiredBookings = async (req, res) => {
	try {
		const now = new Date();
		
		// Find bookings that should be completed (time has passed)
		// Status must be "confirmed" or "in_progress"
		// bookingDate + duration < current time
		const expiredBookings = await Booking.find({
			status: { $in: ["confirmed", "in_progress"] },
		})
			.populate("farmer", "name email phone")
			.populate("tractorOwnerId", "name email phone")
			.lean();

		const completedBookings = [];
		
		for (const booking of expiredBookings) {
			const bookingStart = new Date(booking.bookingDate);
			const durationHours = parseFloat(booking.duration || 8);
			const bookingEnd = new Date(bookingStart.getTime() + durationHours * 60 * 60 * 1000);
			
			// If current time has passed the end time, mark as completed
			if (now >= bookingEnd) {
				// Update booking status
				await Booking.findByIdAndUpdate(booking._id, {
					status: "completed",
					workCompletedAt: now,
				});

				// Update service availability if no other active bookings
				if (booking.serviceId) {
					const otherActiveBookings = await Booking.countDocuments({
						serviceId: booking.serviceId,
						serviceType: booking.serviceType,
						status: { $in: ["pending", "confirmed", "in_progress"] },
						_id: { $ne: booking._id },
					});

					if (otherActiveBookings === 0) {
						if (booking.serviceType === "worker") {
							await WorkerService.findByIdAndUpdate(booking.serviceId, {
								availability: true,
								bookingStatus: "available",
							});
						} else if (booking.serviceType === "tractor") {
							await TractorService.findByIdAndUpdate(booking.serviceId, {
								availability: true,
								isBooked: false,
							});
						}
					}
				}

				// Create notification for farmer
				await Notification.create({
					recipientId: booking.farmer._id,
					type: "booking_completed",
					title: "🎊 Work Completed Automatically",
					message: `The work has been automatically marked as completed. ${booking.paymentStatus === "pending" ? "Please proceed with payment." : ""}`,
					relatedBookingId: booking._id,
					data: {
						bookingId: booking._id,
						totalCost: booking.totalCost,
						paymentStatus: booking.paymentStatus,
					},
				});

				// ✅ Send payment notification email if payment is pending
				if (booking.paymentStatus === "pending" && booking.farmer?.email) {
					try {
						const emailTransporter = req.emailTransporter || null;
						if (emailTransporter) {
							// Use NotificationService to send email
							await NotificationService.notifyPaymentSent(
								booking.farmer,
								{ amount: booking.totalCost, method: "pending", bookingId: booking._id },
								emailTransporter
							);
							
							// Also send a custom notification about work completion
							const Notification = require("../models/Notification");
							await Notification.create({
								recipientId: booking.farmer._id,
								type: "payment_required",
								title: "💰 Payment Required - Work Completed",
								message: `The work has been automatically marked as completed. Please proceed with payment of ₹${booking.totalCost}.`,
								relatedBookingId: booking._id,
							});
						}
					} catch (emailError) {
						console.error("Payment notification email error:", emailError);
					}
				}

				completedBookings.push(booking._id);
			}
		}

		res.status(200).json({
			success: true,
			message: `Auto-completed ${completedBookings.length} booking(s)`,
			completedCount: completedBookings.length,
			completedBookings,
		});
	} catch (error) {
		console.error("Auto-complete expired bookings error:", error);
		res.status(500).json({
			success: false,
			message: error.message || "Failed to auto-complete bookings",
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
	autoCompleteExpiredBookings,
};
