const WorkerService = require("../models/WorkerService");
const NotificationService = require("../services/notificationService");

// @desc Worker posts their availability
// @route POST /api/workers
// @access Private (Worker only)
const postWorkerAvailability = async (req, res) => {
	try {
		const {
			workerType,
			experience,
			chargePerDay,
			workingHours,
			location,
			availability,
			availableDates,
			skills,
			contactNumber,
			description,
		} = req.body;

		// ✅ REMOVED THE CHECK FOR EXISTING ACTIVE POST
		// Workers can now post multiple services

		// ✅ Optional: Check for duplicate service with same workerType on same dates
		// This prevents posting exact same service on same dates
		if (availableDates && availableDates.length > 0) {
			const duplicateService = await WorkerService.findOne({
				worker: req.user._id,
				workerType,
				availability: true,
				availableDates: { $in: availableDates },
			});

			if (duplicateService) {
				return res.status(400).json({
					success: false,
					message: `You already have an active ${workerType} service for these dates. Please choose different dates or update the existing service.`,
				});
			}
		}

		// Create new worker availability
		const workerService = await WorkerService.create({
			worker: req.user._id,
			workerType,
			experience,
			chargePerDay,
			workingHours,
			location,
			availability: availability !== undefined ? availability : true,
			availableDates,
			skills,
			contactNumber,
			description,
		});

		// Populate worker details
await workerService.populate("worker", "name email phone");

		// Email worker about service posting (best-effort)
		try {
			await NotificationService.notifyWorkerServicePosted(
				req.user,
				workerService,
				req.emailTransporter
			);
		} catch (e) {
			console.error("Email notify (worker service posted) error:", e.message);
		}

		res.status(201).json({
			success: true,
			message: "Service posted successfully!",
			workerService,
		});
	} catch (error) {
		console.error("Error posting worker service:", error);
		res.status(400).json({
			success: false,
			message: error.message || "Failed to post service",
		});
	}
};
// ADD THIS FUNCTION to workerController.js

// @desc Create worker service (with same-day check)
// @route POST /api/workers/services
// @access Private (Worker)
exports.createWorkerService = async (req, res) => {
  try {
    const { serviceType, skills, experience, dailyWage, availability, workDate, location, description } = req.body;

    // ✅ Check if worker already has a service posted for this date
    const startOfDay = new Date(workDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(workDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingService = await WorkerService.findOne({
      worker: req.user._id,
      workDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: "You already have a service posted for this date. Cannot post multiple services on the same day.",
      });
    }

    const workerService = await WorkerService.create({
      worker: req.user._id,
      serviceType: serviceType || req.body.workerType, // Support both field names
      skills: Array.isArray(skills) ? skills : [skills],
      experience: experience || 0,
      dailyWage: dailyWage || req.body.chargePerDay, // Support both field names
      availability: availability !== false,
      workDate: workDate || new Date(),
      location: location || req.user.address,
      description: description || "",
      isBooked: false,
      bookingStatus: "available",
    });

    res.status(201).json({
      success: true,
      message: "Worker service posted successfully",
      workerService,
    });
  } catch (error) {
    console.error("Create worker service error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// @desc Get all available workers (For Farmers to browse)
// @route GET /api/workers/available
// @access Public
const getAvailableWorkers = async (req, res) => {
	try {
		const { workerType, location, maxCharge, minExperience, village, district, state } = req.query;
		const query = { availability: true };

		if (workerType) {
			query.workerType = workerType;
		}

		if (location) query["location.district"] = new RegExp(location, "i");
		if (village) query["location.village"] = new RegExp(village, "i");
		if (district) query["location.district"] = new RegExp(district, "i");
		if (state) query["location.state"] = new RegExp(state, "i");

		// Auto-defaults for farmers: show same-village workers if no filters supplied
		if (!village && !district && !state && req.user?.role === "farmer") {
			if (req.user.address?.village) query["location.village"] = new RegExp(req.user.address.village, "i");
			if (req.user.address?.district) query["location.district"] = new RegExp(req.user.address.district, "i");
			if (req.user.address?.state) query["location.state"] = new RegExp(req.user.address.state, "i");
		}

		if (maxCharge) {
			query.chargePerDay = { $lte: Number(maxCharge) };
		}

		if (minExperience) {
			query.experience = { $gte: Number(minExperience) };
		}

		let workers = await WorkerService.find(query)
			.populate("worker", "name phone email")
			.sort({ createdAt: -1 })
			.lean();

		// Reflect engagement if any active booking exists for the worker service
		const serviceIds = workers.map((w) => w._id);
		const activeStatuses = ["pending", "confirmed", "in_progress"];
		const activeBookings = await require("../models/Booking").find({
			serviceId: { $in: serviceIds },
			serviceType: "worker",
			status: { $in: activeStatuses },
		}).select("serviceId bookingDate duration").lean();
		
		// Group bookings by service ID
		const bookingsByService = {};
		activeBookings.forEach((b) => {
			const serviceIdStr = String(b.serviceId);
			if (!bookingsByService[serviceIdStr]) {
				bookingsByService[serviceIdStr] = [];
			}
			bookingsByService[serviceIdStr].push({
				start: new Date(b.bookingDate),
				durationDays: parseFloat(b.duration || 1),
			});
		});
		
		// Mark workers with active bookings
		workers = workers.map((s) => {
			const serviceIdStr = String(s._id);
			const hasActiveBookings = bookingsByService[serviceIdStr] && bookingsByService[serviceIdStr].length > 0;
			return {
				...s,
				bookingStatus: hasActiveBookings ? "booked" : (s.bookingStatus || "available"),
				availability: hasActiveBookings ? false : s.availability,
				activeBookings: bookingsByService[serviceIdStr] || [],
			};
		});

		res.status(200).json({
			success: true,
			count: workers.length,
			workers,
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc Get worker's own availability posts
// @route GET /api/workers/my-posts
// @access Private (Worker)
const getMyWorkerPosts = async (req, res) => {
	try {
		const services = await WorkerService.find({
			worker: req.user._id,
		}).sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: services.length,
			services, // ✅ Changed from workerPosts to services
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc Update worker availability
// @route PUT /api/workers/availability/:id
// @access Private (Worker)
const updateWorkerAvailability = async (req, res) => {
	try {
		let workerService = await WorkerService.findById(req.params.id);

		if (!workerService) {
			return res.status(404).json({
				success: false,
				message: "Worker service not found",
			});
		}

		// Check ownership
		if (workerService.worker.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to update this service",
			});
		}

		workerService = await WorkerService.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true, runValidators: true }
		).populate("worker", "name email phone");

		res.status(200).json({
			success: true,
			message: "Service updated successfully",
			workerService,
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc Delete worker availability
// @route DELETE /api/workers/availability/:id
// @access Private (Worker)
const deleteWorkerAvailability = async (req, res) => {
	try {
		const workerService = await WorkerService.findById(req.params.id);

		if (!workerService) {
			return res.status(404).json({
				success: false,
				message: "Worker service not found",
			});
		}

		// Check ownership
		if (workerService.worker.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to delete this service",
			});
		}

		await workerService.deleteOne();

		res.status(200).json({
			success: true,
			message: "Service deleted successfully",
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

// Export all functions
module.exports = {
	postWorkerAvailability,
	getAvailableWorkers,
	getMyWorkerPosts,
	updateWorkerAvailability,
	deleteWorkerAvailability,
};
