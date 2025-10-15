const WorkerHireRequest = require("../models/WorkerHireRequest");
const WorkerService = require("../models/WorkerService");
const WorkerRequirement = require("../models/WorkerRequirement");
const Booking = require("../models/Booking");
const { createNotification } = require("../utils/createNotification");

// ==========================================
// SCENARIO 1: FARMER HIRES WORKER
// ==========================================

// @desc    Farmer creates hire request for worker
// @route   POST /api/worker-hires/hire-worker
// @access  Private (Farmer)
exports.farmerHiresWorker = async (req, res) => {
	try {
		const { workerServiceId, workDetails, agreedAmount, notes } = req.body;

		// Find worker service
		const workerService = await WorkerService.findById(
			workerServiceId
		).populate("worker");

		if (!workerService) {
			return res.status(404).json({
				success: false,
				message: "Worker service not found",
			});
		}

		// ✅ Check if worker is already booked
		if (workerService.bookingStatus === "booked") {
			return res.status(400).json({
				success: false,
				message: "This worker is already booked",
			});
		}

		// Check if already requested
		const existingRequest = await WorkerHireRequest.findOne({
			farmer: req.user._id,
			workerService: workerServiceId,
			status: "pending",
		});

		if (existingRequest) {
			return res.status(400).json({
				success: false,
				message: "You have already sent a hire request to this worker",
			});
		}

		// Create hire request
		const hireRequest = await WorkerHireRequest.create({
			farmer: req.user._id,
			worker: workerService.worker._id,
			workerService: workerServiceId,
			requestType: "farmer_to_worker",
			workDetails,
			agreedAmount: agreedAmount || workerService.chargePerDay,
			notes,
		});

		await hireRequest.populate([
			{ path: "farmer", select: "name phone email" },
			{ path: "workerService", select: "workerType chargePerDay location" },
		]);

		// ✅ Create notification for worker
		await createNotification({
			userId: workerService.worker._id,
			recipientId: workerService.worker._id,
			type: "worker_hire_request",
			title: "New Hire Request!",
			message: `${req.user.name} wants to hire you for ${workerService.workerType} work`,
			relatedRequirementId: hireRequest._id,
		});

		res.status(201).json({
			success: true,
			message: "Hire request sent successfully! Worker will be notified.",
			hireRequest,
		});
	} catch (error) {
		console.error("Farmer hire worker error:", error);
		res.status(500).json({
			success: false,
			message: error.message || "Failed to create hire request",
		});
	}
};

// @desc    Worker accepts farmer's hire request
// @route   POST /api/worker-hires/:id/worker-accept
// @access  Private (Worker)
exports.workerAcceptHire = async (req, res) => {
	try {
		const hireRequest = await WorkerHireRequest.findById(req.params.id)
			.populate("farmer")
			.populate("workerService");

		if (!hireRequest) {
			return res.status(404).json({
				success: false,
				message: "Hire request not found",
			});
		}

		// Check authorization
		if (hireRequest.worker.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized",
			});
		}

		if (hireRequest.status !== "pending") {
			return res.status(400).json({
				success: false,
				message: "Request already processed",
			});
		}

		// Update hire request
		hireRequest.status = "accepted";

		// ✅ Create booking WITH serviceModel FIELD
		const booking = await Booking.create({
			farmer: hireRequest.farmer._id,
			tractorOwnerId: hireRequest.worker,
			serviceType: "worker",
			serviceId: hireRequest.workerService._id,
			serviceModel: "WorkerService", // ✅✅✅ ADDED THIS LINE!
			bookingDate: hireRequest.workDetails?.startDate || new Date(),
			duration: hireRequest.workDetails?.duration || 1,
			totalCost: hireRequest.agreedAmount,
			location:
				hireRequest.workDetails?.location || hireRequest.workerService.location,
			workType: hireRequest.workerService.workerType,
			status: "confirmed",
			paymentCompleted: false,
			notes: hireRequest.notes,
		});

		hireRequest.bookingId = booking._id;
		await hireRequest.save();

		// ✅ Update worker service status
		await WorkerService.findByIdAndUpdate(hireRequest.workerService._id, {
			bookingStatus: "booked",
			currentBookingId: booking._id,
			availability: false,
		});

		// ✅ Notify farmer
		await createNotification({
			userId: hireRequest.farmer._id,
			recipientId: hireRequest.farmer._id,
			type: "worker_hire_accepted",
			title: "Worker Accepted!",
			message: `${req.user.name} accepted your hire request. Proceed with payment.`,
			relatedBookingId: booking._id,
		});

		res.status(200).json({
			success: true,
			message: "Hire request accepted! Booking created.",
			hireRequest,
			booking,
		});
	} catch (error) {
		console.error("Worker accept hire error:", error);
		res.status(500).json({
			success: false,
			message: error.message || "Failed to accept hire request",
		});
	}
};

// @desc    Worker rejects farmer's hire request
// @route   POST /api/worker-hires/:id/worker-reject
// @access  Private (Worker)
exports.workerRejectHire = async (req, res) => {
	try {
		const { reason } = req.body;

		const hireRequest = await WorkerHireRequest.findById(
			req.params.id
		).populate("farmer");

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
				message: "Request already processed",
			});
		}

		hireRequest.status = "rejected";
		hireRequest.rejectionReason = reason || "Rejected by worker";
		await hireRequest.save();

		// Notify farmer
		await createNotification({
			userId: hireRequest.farmer._id,
			recipientId: hireRequest.farmer._id,
			type: "worker_hire_rejected",
			title: "Worker Declined",
			message: `${req.user.name} declined your hire request. ${reason || ""}`,
			relatedRequirementId: hireRequest._id,
		});

		res.status(200).json({
			success: true,
			message: "Hire request rejected",
			hireRequest,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// ==========================================
// SCENARIO 2: WORKER APPLIES FOR JOB
// ==========================================

// @desc    Worker applies for farmer's job posting
// @route   POST /api/worker-hires/apply-for-job
// @access  Private (Worker)
exports.workerAppliesForJob = async (req, res) => {
	try {
		const { workerRequirementId, workerServiceId, notes } = req.body;

		// Find requirement
		const requirement = await WorkerRequirement.findById(
			workerRequirementId
		).populate("farmer");

		if (!requirement) {
			return res.status(404).json({
				success: false,
				message: "Job posting not found",
			});
		}

		// Check if already applied
		const existingApplication = await WorkerHireRequest.findOne({
			farmer: requirement.farmer._id,
			worker: req.user._id,
			workerService: workerServiceId,
			requestType: "worker_to_farmer",
			status: "pending",
		});

		if (existingApplication) {
			return res.status(400).json({
				success: false,
				message: "You have already applied for this job",
			});
		}

		// Create hire request
		const hireRequest = await WorkerHireRequest.create({
			farmer: requirement.farmer._id,
			worker: req.user._id,
			workerService: workerServiceId,
			requestType: "worker_to_farmer",
			workDetails: {
				startDate: requirement.startDate,
				duration: requirement.duration,
				workDescription: requirement.workType,
				location: requirement.location,
			},
			agreedAmount: requirement.wagesOffered || 0, // ✅ Fixed: was budget, should be wagesOffered
			notes,
		});

		await hireRequest.populate([
			{ path: "worker", select: "name phone email" },
			{ path: "workerService", select: "workerType chargePerDay experience" },
		]);

		// ✅ Notify farmer
		await createNotification({
			userId: requirement.farmer._id,
			recipientId: requirement.farmer._id,
			type: "worker_application",
			title: "New Worker Application!",
			message: `${req.user.name} applied for your ${requirement.workType} job`,
			relatedRequirementId: hireRequest._id,
		});

		res.status(201).json({
			success: true,
			message: "Application submitted successfully! Farmer will be notified.",
			hireRequest,
		});
	} catch (error) {
		console.error("Worker apply error:", error);
		res.status(500).json({
			success: false,
			message: error.message || "Failed to apply for job",
		});
	}
};

// @desc    Farmer accepts worker's job application
// @route   POST /api/worker-hires/:id/farmer-accept
// @access  Private (Farmer)
exports.farmerAcceptApplication = async (req, res) => {
	try {
		const hireRequest = await WorkerHireRequest.findById(req.params.id)
			.populate("worker")
			.populate("workerService");

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
				message: "Application already processed",
			});
		}

		hireRequest.status = "accepted";

		// ✅ Create booking WITH serviceModel FIELD
		const booking = await Booking.create({
			farmer: hireRequest.farmer,
			tractorOwnerId: hireRequest.worker._id,
			serviceType: "worker",
			serviceId: hireRequest.workerService._id,
			serviceModel: "WorkerService", // ✅✅✅ ADDED THIS LINE!
			bookingDate: hireRequest.workDetails?.startDate || new Date(),
			duration: hireRequest.workDetails?.duration || 1,
			totalCost: hireRequest.agreedAmount,
			location: hireRequest.workDetails?.location,
			workType: hireRequest.workerService.workerType,
			status: "confirmed",
			paymentCompleted: false,
			notes: hireRequest.notes,
		});

		hireRequest.bookingId = booking._id;
		await hireRequest.save();

		// ✅ Update worker service
		await WorkerService.findByIdAndUpdate(hireRequest.workerService._id, {
			bookingStatus: "booked",
			currentBookingId: booking._id,
			availability: false,
		});

		// ✅ Notify worker
		await createNotification({
			userId: hireRequest.worker._id,
			recipientId: hireRequest.worker._id,
			type: "application_accepted",
			title: "Application Accepted!",
			message: `${req.user.name} accepted your job application!`,
			relatedBookingId: booking._id,
		});

		res.status(200).json({
			success: true,
			message: "Application accepted! Booking created.",
			hireRequest,
			booking,
		});
	} catch (error) {
		console.error("Farmer accept application error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Farmer rejects worker's application
// @route   POST /api/worker-hires/:id/farmer-reject
// @access  Private (Farmer)
exports.farmerRejectApplication = async (req, res) => {
	try {
		const { reason } = req.body;

		const hireRequest = await WorkerHireRequest.findById(
			req.params.id
		).populate("worker");

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
		hireRequest.rejectionReason = reason || "Not selected";
		await hireRequest.save();

		// Notify worker
		await createNotification({
			userId: hireRequest.worker._id,
			recipientId: hireRequest.worker._id,
			type: "application_rejected",
			title: "Application Not Selected",
			message: `Your application was not selected. ${reason || ""}`,
			relatedRequirementId: hireRequest._id,
		});

		res.status(200).json({
			success: true,
			message: "Application rejected",
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// ==========================================
// COMMON: GET REQUESTS
// ==========================================

// @desc    Get hire requests for worker
// @route   GET /api/worker-hires/worker-requests
// @access  Private (Worker)
exports.getWorkerHireRequests = async (req, res) => {
	try {
		const { status } = req.query;
		const query = {
			worker: req.user._id,
			requestType: "farmer_to_worker", // ✅ Only show farmer→worker requests
		};

		if (status) {
			query.status = status;
		}

		const hireRequests = await WorkerHireRequest.find(query)
			.populate("farmer", "name phone email")
			.populate(
				"workerService",
				"workerType chargePerDay workingHours location"
			)
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: hireRequests.length,
			requests: hireRequests, // ✅ Changed to match frontend expectation
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
// @desc    Get worker's applications (worker-to-farmer requests)
// @route   GET /api/worker-hires/worker-applications
// @access  Private (Worker)
exports.getWorkerApplications = async (req, res) => {
    try {
        const applications = await WorkerHireRequest.find({
            worker: req.user._id,
            requestType: "worker_to_farmer",
        })
            .populate("farmer", "name phone email")
            .populate("workerService", "workerType chargePerDay location")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: applications.length,
            applications,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get hire requests/applications for farmer
// @route   GET /api/worker-hires/farmer-requests
// @access  Private (Farmer)
exports.getFarmerHireRequests = async (req, res) => {
	try {
		const { status } = req.query;
		const query = { farmer: req.user._id };

		if (status) {
			query.status = status;
		}

		const hireRequests = await WorkerHireRequest.find(query)
			.populate("worker", "name phone email")
			.populate(
				"workerService",
				"workerType chargePerDay workingHours location experience"
			)
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: hireRequests.length,
			hireRequests,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
module.exports = {
	farmerHiresWorker: exports.farmerHiresWorker,
	workerAcceptHire: exports.workerAcceptHire,
	workerRejectHire: exports.workerRejectHire,
	workerAppliesForJob: exports.workerAppliesForJob,
	farmerAcceptApplication: exports.farmerAcceptApplication,
	farmerRejectApplication: exports.farmerRejectApplication,
	getWorkerHireRequests: exports.getWorkerHireRequests,
	getWorkerApplications: exports.getWorkerApplications,
	getFarmerHireRequests: exports.getFarmerHireRequests,
	getWorkerApplications: exports.getWorkerApplications, // ✅ ADD THIS LINE
};