const WorkerHireRequest = require("../models/WorkerHireRequest");
const WorkerService = require("../models/WorkerService");
const Booking = require("../models/Booking");
const Notification = require("../models/Notification");
const User = require("../models/User");
const WorkerRequirement = require("../models/WorkerRequirement");
const NotificationService = require("../services/notificationService");

async function hasActiveWorkerBooking(userId) {
  return await Booking.findOne({
    tractorOwnerId: userId,
    serviceType: "worker",
    status: { $in: ["pending", "confirmed", "in_progress"] },
  }).lean();
}

// @desc Farmer accepts worker application - Creates BOOKING
// @route POST /api/worker-hires/:id/farmer-accept
// @access Private (Farmer)
exports.acceptWorkerApplication = async (req, res) => {
  try {
const hireRequest = await WorkerHireRequest.findById(req.params.id)
      .populate("worker", "name phone email gender")
      .populate("requirementId");

    if (!hireRequest) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (hireRequest.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (hireRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This application has already been processed",
      });
    }

    // Update hire request
    hireRequest.status = "accepted";
    await hireRequest.save();

    // Extract duration
    const durationMatch = hireRequest.workDetails.duration?.match(/(\d+)/);
    const durationDays = durationMatch ? parseInt(durationMatch[1]) : 1;
    const totalCost = hireRequest.agreedAmount * durationDays;

// Enforce: female worker only booked once
    if (hireRequest.worker?.gender === "female") {
      const existing = await hasActiveWorkerBooking(hireRequest.worker._id);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "This female worker already has an active booking",
        });
      }
    }

    // ✅ CREATE BOOKING (serviceId is optional now)
    const booking = await Booking.create({
      farmer: req.user._id,
      tractorOwnerId: hireRequest.worker._id,
      serviceType: "worker",
      // serviceId: null, // ✅ No service - worker applied to requirement
      // serviceModel: null,
      bookingDate: hireRequest.workDetails.startDate || new Date(),
      duration: durationDays,
      totalCost: totalCost,
      location: hireRequest.workDetails.location,
      workType: hireRequest.workDetails.workDescription,
      status: "confirmed",
      paymentStatus: "pending",
      hireRequestId: hireRequest._id,
      requirementId: hireRequest.requirementId?._id, // ✅ Link to requirement
      notes: hireRequest.notes || `Worker booking for ${hireRequest.workDetails.workDescription}`,
    });

    hireRequest.bookingId = booking._id;
    await hireRequest.save();

    // Update requirement
    if (hireRequest.requirementId) {
      const requirement = await WorkerRequirement.findById(hireRequest.requirementId);
      if (requirement) {
        requirement.status = "accepted";
        requirement.acceptedBy = hireRequest.worker._id;
        requirement.acceptedAt = new Date();
        
        // Update applicant status
        const applicantIndex = requirement.applicants.findIndex(
          app => app.worker.toString() === hireRequest.worker._id.toString()
        );
        if (applicantIndex !== -1) {
          requirement.applicants[applicantIndex].status = "accepted";
        }
        
        await requirement.save();
      }
    }

    // Notify worker
    await Notification.create({
      recipientId: hireRequest.worker._id,
      type: "hire_accepted",
      title: "✅ Application Accepted!",
      message: `${req.user.name} accepted your application! Work starts on ${new Date(hireRequest.workDetails.startDate).toLocaleDateString()}`,
      relatedUserId: req.user._id,
      data: {
        bookingId: booking._id,
        hireRequestId: hireRequest._id,
        workType: hireRequest.workDetails.workDescription,
        totalCost,
      },
    });

// Email notifications
    try {
      await NotificationService.notifyNewBookingForProvider(
        hireRequest.worker,
        booking,
        "worker",
        req.emailTransporter
      );
      await NotificationService.notifyBookingCreated(
        req.user,
        booking,
        "worker",
        req.emailTransporter
      );
    } catch (e) {
      console.error("Email notify (farmer accept worker) error:", e.message);
    }

    res.status(200).json({
      success: true,
      message: "Application accepted and booking created",
      hireRequest,
      booking,
    });
  } catch (error) {
    console.error("Accept application error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Farmer rejects worker application
// @route POST /api/worker-hire/:id/reject
// @access Private (Farmer)
exports.rejectWorkerApplication = async (req, res) => {
	try {
		const hireRequest = await WorkerHireRequest.findById(req.params.id);

		if (!hireRequest) {
			return res.status(404).json({
				success: false,
				message: "Application not found",
			});
		}

		if (hireRequest.farmer.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized",
			});
		}

		hireRequest.status = "rejected";
		hireRequest.rejectionReason = req.body.reason || "Not selected";
		await hireRequest.save();

		// Update requirement applicant status
		if (hireRequest.requirementId) {
			const requirement = await WorkerRequirement.findById(
				hireRequest.requirementId
			);
			if (requirement) {
				const applicantIndex = requirement.applicants.findIndex(
					(app) => app.worker.toString() === hireRequest.worker.toString()
				);
				if (applicantIndex !== -1) {
					requirement.applicants[applicantIndex].status = "rejected";
				}
				await requirement.save();
			}
		}

		// Notify worker
		await Notification.create({
			recipientId: hireRequest.worker,
			type: "hire_rejected",
			title: "❌ Application Not Selected",
			message: `Your application was not selected. Keep trying!`,
			data: {
				hireRequestId: hireRequest._id,
				reason: req.body.reason,
			},
		});

		res.status(200).json({
			success: true,
			message: "Application rejected",
			hireRequest,
		});
	} catch (error) {
		console.error("Reject application error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc Farmer creates hire request for a worker (from Browse Workers)
// @route POST /api/worker-hire/create
// @access Private (Farmer)
exports.createHireRequest = async (req, res) => {
	try {
		const {
			workerId,
			workerServiceId,
			workType,
			duration,
			dailyWage,
			workDate,
			location,
			notes,
		} = req.body;

		const worker = await User.findById(workerId);
		if (!worker || worker.role !== "worker") {
			return res.status(404).json({
				success: false,
				message: "Worker not found",
			});
		}

		const workerService = await WorkerService.findById(workerServiceId);
if (!workerService) {
			return res.status(404).json({
				success: false,
				message: "Worker service not found",
			});
		}

		if (!workerService.availability) {
			return res.status(400).json({
				success: false,
				message: "This worker is not available on this date",
			});
		}

		// Enforce: female worker only booked once
		if (worker.gender === "female") {
			const existing = await hasActiveWorkerBooking(worker._id);
			if (existing) {
				return res.status(400).json({
					success: false,
					message: "This female worker already has an active booking",
				});
			}
		}

		const hireRequest = await WorkerHireRequest.create({
			farmer: req.user._id,
			worker: workerId,
			workerService: workerServiceId,
			requestType: "farmer_to_worker",
			workDetails: {
				startDate: workDate || new Date(),
				duration: duration || "1 day",
				workDescription: workType || workerService.serviceType,
				location: location || req.user.address,
			},
			agreedAmount: dailyWage || workerService.dailyWage,
			notes: notes || "",
		});

		await Notification.create({
			recipientId: workerId,
			type: "hire_request",
			title: "💼 New Hire Request!",
			message: `${req.user.name} wants to hire you for ${
				workType || workerService.serviceType
			}`,
			relatedUserId: req.user._id,
			data: {
				hireRequestId: hireRequest._id,
				farmerName: req.user.name,
				workType: workType || workerService.serviceType,
				dailyWage: dailyWage || workerService.dailyWage,
				workDate,
			},
		});

// Email notification to worker
    try {
      await NotificationService.notifyNewBookingForProvider(
        hireRequest.worker,
        { _id: hireRequest._id },
        "worker",
        req.emailTransporter
      );
    } catch (e) {
      console.error("Email notify (createHireRequest) error:", e.message);
    }

    res.status(201).json({
        success: true,
			message: "Hire request sent successfully",
			hireRequest,
		});
	} catch (error) {
		console.error("Create hire request error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc Worker accepts farmer's hire request - Creates BOOKING
// @route POST /api/worker-hire/:id/worker-accept
// @access Private (Worker)
exports.workerAcceptHireRequest = async (req, res) => {
	try {
		const hireRequest = await WorkerHireRequest.findById(req.params.id)
			.populate("farmer", "name phone email")
			.populate("workerService");

		if (!hireRequest) {
			return res.status(404).json({
				success: false,
				message: "Hire request not found",
			});
		}

		if (hireRequest.worker.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized",
			});
		}

		if (hireRequest.status !== "pending") {
			return res.status(400).json({
				success: false,
				message: "This request has already been processed",
			});
		}

		hireRequest.status = "accepted";
		await hireRequest.save();

		const durationMatch = hireRequest.workDetails.duration?.match(/(\d+)/);
		const durationDays = durationMatch ? parseInt(durationMatch[1]) : 1;
		const totalCost = hireRequest.agreedAmount * durationDays;

		// Parse booking date and calculate time slot (for workers, duration is in days)
		const requested = new Date(hireRequest.workDetails.startDate || Date.now());
		const bookingStartTime = new Date(requested);
		bookingStartTime.setHours(0, 0, 0, 0); // Start of day
		const bookingEndTime = new Date(bookingStartTime);
		bookingEndTime.setDate(bookingEndTime.getDate() + durationDays);
		bookingEndTime.setHours(23, 59, 59, 999); // End of last day

		// Enforce: worker not double-booked during overlapping time slot
		const overlappingBookings = await Booking.find({
			tractorOwnerId: req.user._id,
			serviceType: "worker",
			status: { $in: ["pending", "confirmed", "in_progress"] },
		});

		for (const existingBooking of overlappingBookings) {
			const existingStart = new Date(existingBooking.bookingDate);
			existingStart.setHours(0, 0, 0, 0);
			const existingDurationDays = parseFloat(existingBooking.duration || 1);
			const existingEnd = new Date(existingStart);
			existingEnd.setDate(existingEnd.getDate() + existingDurationDays);
			existingEnd.setHours(23, 59, 59, 999);

			// Check if time slots overlap
			const timeOverlaps = 
				(bookingStartTime >= existingStart && bookingStartTime < existingEnd) ||
				(bookingEndTime > existingStart && bookingEndTime <= existingEnd) ||
				(bookingStartTime <= existingStart && bookingEndTime >= existingEnd);

			if (timeOverlaps) {
				return res.status(400).json({
					success: false,
					message: `You are already booked from ${existingStart.toLocaleDateString()} for ${existingDurationDays} day(s). Please choose a different time slot.`,
				});
			}
		}

// Enforce: female worker only booked once
		if (req.user.gender === "female") {
			const existing = await hasActiveWorkerBooking(req.user._id);
			if (existing) {
				return res.status(400).json({
					success: false,
					message: "You already have an active booking",
				});
			}
		}

		// ✅ CREATE BOOKING
		const booking = await Booking.create({
			farmer: hireRequest.farmer._id,
			tractorOwnerId: req.user._id,
			serviceType: "worker",
			serviceId: hireRequest.workerService?._id,
			serviceModel: "WorkerService",
			bookingDate: requested,
			duration: durationDays,
			totalCost: totalCost,
			location: hireRequest.workDetails.location,
			workType: hireRequest.workDetails.workDescription,
			status: "confirmed",
			paymentStatus: "pending",
			hireRequestId: hireRequest._id,
			notes: hireRequest.notes,
		});

		hireRequest.bookingId = booking._id;
		await hireRequest.save();

		// Update worker service booking status (availability checked dynamically based on time slots)
		if (hireRequest.workerService) {
			await WorkerService.findByIdAndUpdate(
				hireRequest.workerService._id,
				{
					bookingStatus: "booked",
					currentBookingId: booking._id,
				},
				{ new: true }
			);
		}

		// Notify farmer
		await Notification.create({
			recipientId: hireRequest.farmer._id,
			type: "hire_accepted",
			title: "✅ Worker Accepted!",
			message: `${req.user.name} accepted your hire request for ${hireRequest.workDetails.workDescription}`,
			relatedUserId: req.user._id,
			data: {
				bookingId: booking._id,
				hireRequestId: hireRequest._id,
				workType: hireRequest.workDetails.workDescription,
				totalCost,
			},
		});

// Email notifications
    try {
      await NotificationService.notifyNewBookingForProvider(
        req.user,
        booking,
        "worker",
        req.emailTransporter
      );
      await NotificationService.notifyBookingCreated(
        hireRequest.farmer,
        booking,
        "worker",
        req.emailTransporter
      );
    } catch (e) {
      console.error("Email notify (worker accept hire) error:", e.message);
    }

    res.status(200).json({
        success: true,
			message: "Hire request accepted and booking created",
			hireRequest,
			booking,
		});
	} catch (error) {
		console.error("Worker accept hire request error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc Worker rejects farmer's hire request
// @route POST /api/worker-hire/:id/worker-reject
// @access Private (Worker)
exports.workerRejectHireRequest = async (req, res) => {
	try {
		const hireRequest = await WorkerHireRequest.findById(req.params.id);

		if (!hireRequest) {
			return res.status(404).json({
				success: false,
				message: "Hire request not found",
			});
		}

		if (hireRequest.worker.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized",
			});
		}

		hireRequest.status = "rejected";
		hireRequest.rejectionReason = req.body.reason || "Not available";
		await hireRequest.save();

		await Notification.create({
			recipientId: hireRequest.farmer,
			type: "hire_rejected",
			title: "❌ Request Declined",
			message: `Worker declined your hire request`,
			data: {
				hireRequestId: hireRequest._id,
				reason: req.body.reason,
			},
		});

		res.status(200).json({
			success: true,
			message: "Hire request rejected",
			hireRequest,
		});
	} catch (error) {
		console.error("Worker reject hire request error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc Get hire requests for worker
// @route GET /api/worker-hire/worker-requests
// @access Private (Worker)
exports.getWorkerHireRequests = async (req, res) => {
	try {
		const hireRequests = await WorkerHireRequest.find({
			worker: req.user._id,
		})
			.populate("farmer", "name phone email address")
			.populate("workerService")
			.populate("requirementId")
			.sort({ createdAt: -1 })
			.lean();

		res.status(200).json({
			success: true,
			count: hireRequests.length,
			hireRequests,
		});
	} catch (error) {
		console.error("Get worker hire requests error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc Get hire requests created by farmer
// @route GET /api/worker-hire/farmer-requests
// @access Private (Farmer)
exports.getFarmerHireRequests = async (req, res) => {
	try {
		const hireRequests = await WorkerHireRequest.find({
			farmer: req.user._id,
		})
			.populate("worker", "name phone email address")
			.populate("workerService")
			.populate("requirementId")
			.sort({ createdAt: -1 })
			.lean();

		res.status(200).json({
			success: true,
			count: hireRequests.length,
			hireRequests,
		});
	} catch (error) {
		console.error("Get farmer hire requests error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

module.exports = exports;
exports.farmerHiresWorker = exports.createHireRequest;
