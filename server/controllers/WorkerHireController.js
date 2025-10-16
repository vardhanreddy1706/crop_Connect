const WorkerHireRequest = require("../models/WorkerHireRequest");
const WorkerService = require("../models/WorkerService");
const Booking = require("../models/Booking");
const Notification = require("../models/Notification");
const User = require("../models/User");
const WorkerRequirement = require("../models/WorkerRequirement");

// @desc Farmer accepts worker application - Creates BOOKING
// @route POST /api/worker-hires/:id/farmer-accept
// @access Private (Farmer)
exports.acceptWorkerApplication = async (req, res) => {
  try {
    const hireRequest = await WorkerHireRequest.findById(req.params.id)
      .populate("worker", "name phone email")
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

		// ✅ CREATE BOOKING
		const booking = await Booking.create({
			farmer: hireRequest.farmer._id,
			tractorOwnerId: req.user._id,
			serviceType: "worker",
			serviceId: hireRequest.workerService?._id,
			serviceModel: "WorkerService",
			bookingDate: hireRequest.workDetails.startDate,
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

		// Update worker service availability
		if (hireRequest.workerService) {
			await WorkerService.findByIdAndUpdate(hireRequest.workerService._id, {
				availability: false,
				isBooked: true,
			});
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
