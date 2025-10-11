const WorkerService = require("../models/workerService");

// @desc    Create worker service
// @route   POST /api/workers
// @access  Private (Worker)
exports.createWorkerService = async (req, res) => {
	try {
		const workerService = await WorkerService.create({
			...req.body,
			worker: req.user._id,
		});

		res.status(201).json({
			success: true,
			message: "Worker service added successfully",
			workerService,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Get all worker services
// @route   GET /api/workers
// @access  Public
exports.getAllWorkerServices = async (req, res) => {
	try {
		const { workerType, location, availability } = req.query;

		let query = {};

		if (workerType) query.workerType = workerType;
		if (location) query["location.district"] = new RegExp(location, "i");
		if (availability) query.availability = availability === "true";

		const workerServices = await WorkerService.find(query)
			.populate("worker", "name phone email")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: workerServices.length,
			workerServices,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Get single worker service
// @route   GET /api/workers/:id
// @access  Public
exports.getWorkerServiceById = async (req, res) => {
	try {
		const workerService = await WorkerService.findById(req.params.id).populate(
			"worker",
			"name phone email address"
		);

		if (!workerService) {
			return res.status(404).json({
				success: false,
				message: "Worker service not found",
			});
		}

		res.status(200).json({
			success: true,
			workerService,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Update worker service
// @route   PUT /api/workers/:id
// @access  Private (Worker only)
exports.updateWorkerService = async (req, res) => {
	try {
		let workerService = await WorkerService.findById(req.params.id);

		if (!workerService) {
			return res.status(404).json({
				success: false,
				message: "Worker service not found",
			});
		}

		if (workerService.worker.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized",
			});
		}

		workerService = await WorkerService.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true, runValidators: true }
		);

		res.status(200).json({
			success: true,
			message: "Worker service updated successfully",
			workerService,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Delete worker service
// @route   DELETE /api/workers/:id
// @access  Private (Worker only)
exports.deleteWorkerService = async (req, res) => {
	try {
		const workerService = await WorkerService.findById(req.params.id);

		if (!workerService) {
			return res.status(404).json({
				success: false,
				message: "Worker service not found",
			});
		}

		if (workerService.worker.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized",
			});
		}

		await workerService.deleteOne();

		res.status(200).json({
			success: true,
			message: "Worker service deleted successfully",
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Get my worker services
// @route   GET /api/workers/my-services
// @access  Private (Worker)
exports.getMyWorkerServices = async (req, res) => {
	try {
		const workerServices = await WorkerService.find({
			worker: req.user._id,
		}).sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: workerServices.length,
			workerServices,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
