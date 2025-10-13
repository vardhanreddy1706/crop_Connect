const WorkerService = require("../models/WorkerService");

// @desc    Worker posts their availability
// @route   POST /api/workers/post-availability
// @access  Private (Worker only)
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
		} = req.body;

		// Check if worker already has an active post
		const existingPost = await WorkerService.findOne({
			worker: req.user._id,
			availability: true,
		});

		if (existingPost) {
			return res.status(400).json({
				success: false,
				message:
					"You already have an active availability post. Please update or delete it first.",
			});
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
		});

		// Populate worker details
		await workerService.populate("worker", "name email phone");

		res.status(201).json({
			success: true,
			message: "Availability posted successfully!",
			workerService,
		});
	} catch (error) {
		console.error("Error posting worker availability:", error);
		res.status(400).json({
			success: false,
			message: error.message || "Failed to post availability",
		});
	}
};

// @desc    Get all available workers (For Farmers to browse)
// @route   GET /api/workers/available
// @access  Public
const getAvailableWorkers = async (req, res) => {
	try {
		const { workerType, location, maxCharge, minExperience } = req.query;

		const query = { availability: true };

		if (workerType) {
			query.workerType = workerType;
		}

		if (location) {
			query["location.district"] = new RegExp(location, "i");
		}

		if (maxCharge) {
			query.chargePerDay = { $lte: Number(maxCharge) };
		}

		if (minExperience) {
			query.experience = { $gte: Number(minExperience) };
		}

		const workers = await WorkerService.find(query)
			.populate("worker", "name phone email")
			.sort({ createdAt: -1 });

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

// @desc    Get worker's own availability posts
// @route   GET /api/workers/my-posts
// @access  Private (Worker)
const getMyWorkerPosts = async (req, res) => {
	try {
		const workerPosts = await WorkerService.find({
			worker: req.user._id,
		}).sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: workerPosts.length,
			workerPosts,
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Update worker availability
// @route   PUT /api/workers/availability/:id
// @access  Private (Worker)
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
			message: "Availability updated successfully",
			workerService,
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Delete worker availability
// @route   DELETE /api/workers/availability/:id
// @access  Private (Worker)
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
			message: "Worker availability deleted successfully",
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
