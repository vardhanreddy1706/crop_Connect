const WorkerRequirement = require("../models/WorkerRequirement");
const User = require("../models/User");
const Notification = require("../models/Notification");
// @desc Post worker requirement by farmer
// @route POST /api/worker-requirements
// @access Private (Farmer)
exports.createWorkerRequirement = async (req, res) => {

	try {
		const workerRequirement = await WorkerRequirement.create({
			...req.body,
			farmer: req.user._id,
		});

		// Find nearby workers with gender filter
		const gender = req.body.preferredGender;
		const workerQuery = {
			role: "worker",
			"address.district": {
				$regex: req.body.location?.district || "",
				$options: "i",
			},
		};
		if (gender && gender !== "any") {
			workerQuery.gender = gender;
		}

		const nearbyWorkers = await User.find(workerQuery).select("_id name");

		// Notify nearby workers
		const notifications = nearbyWorkers.map((worker) => ({
			recipientId: worker._id,
			type: "new_requirement",
			title: "🆕 New Job Opportunity!",
			message: `New ${req.body.workType} job in ${req.body.location?.district} - ₹${req.body.wagesOffered}/day`,
			relatedUserId: req.user._id,
			relatedRequirementId: workerRequirement._id,
			data: {
				farmerName: req.user.name,
				workType: req.body.workType,
				duration: req.body.duration || "1 day",
				wagesOffered: req.body.wagesOffered,
				location: req.body.location,
				preferredGender: gender || "any",
			},
		}));

		if (notifications.length > 0) {
			await Notification.insertMany(notifications);
		}

		res.status(201).json({
			success: true,
			message: "Worker requirement posted successfully",
			workerRequirement,
			notifiedWorkers: nearbyWorkers.length,
		});
	} catch (error) {
		console.error("Create worker requirement error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc Get all worker requirements (for workers)
// @route GET /api/worker-requirements
// @access Private (Worker)
exports.getAllWorkerRequirements = async (req, res) => {
	try {
		const { workType, district, state, status } = req.query;
		let query = {};

		if (workType) query.workType = workType;
		if (district) query["location.district"] = new RegExp(district, "i");
		if (state) query["location.state"] = new RegExp(state, "i");
		if (status) query.status = status;
		else query.status = "open";

		// Enforce gender visibility: only show requirements matching worker gender or 'any'
		if (req.user?.gender) {
			query.preferredGender = { $in: ["any", req.user.gender] };
		}

		const results = await WorkerRequirement.find(query)
			.populate("farmer", "name phone email address")
			.sort({ createdAt: -1 })
			.lean();

		// ✅ Mark whether current worker already applied
		const workerId = req.user?._id?.toString();
		const workerRequirements = results.map((item) => ({
			...item,
			hasApplied: Array.isArray(item.applicants)
				? item.applicants.some((app) => app.worker?.toString() === workerId)
				: false,
		}));

		res.status(200).json({
			success: true,
			workerRequirements,
		});
	} catch (error) {
		console.error("Get worker requirements error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc Get my worker requirements (for farmers)
// @route GET /api/worker-requirements/my-requirements
// @access Private (Farmer)
exports.getMyWorkerRequirements = async (req, res) => {
	try {
		const workerRequirements = await WorkerRequirement.find({
			farmer: req.user._id,
		})
			.populate("acceptedBy", "name phone email")
			.populate("applicants.worker", "name phone email address")
			.sort({ createdAt: -1 })
			.lean();

		res.status(200).json({
			success: true,
			workerRequirements,
		});
	} catch (error) {
		console.error("Get my requirements error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
// @desc Worker applies for requirement
// @route POST /api/worker-requirements/:id/apply
// @access Private (Worker)
exports.applyForRequirement = async (req, res) => {
  try {
    const requirement = await WorkerRequirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: "Requirement not found",
      });
    }

    if (requirement.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "This job is no longer available",
      });
    }

    // Enforce gender match
    if (
      requirement.preferredGender &&
      requirement.preferredGender !== "any" &&
      requirement.preferredGender !== req.user.gender
    ) {
      return res.status(400).json({
        success: false,
        message:
          requirement.preferredGender === "female"
            ? "This job is for female workers only"
            : requirement.preferredGender === "male"
            ? "This job is for male workers only"
            : "You are not eligible to apply for this requirement",
      });
    }

    // Check if already applied
    const alreadyApplied = requirement.applicants.some(
      (app) => app.worker.toString() === req.user._id.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this requirement",
      });
    }

    // Create WorkerHireRequest
    const WorkerHireRequest = require("../models/WorkerHireRequest");
    
    const hireRequest = await WorkerHireRequest.create({
      farmer: requirement.farmer,
      worker: req.user._id,
      requirementId: req.params.id,
      requestType: "worker_to_farmer",
      workDetails: {
        startDate: requirement.startDate,
        duration: requirement.duration || "1 day",
        workDescription: requirement.workType,
        location: requirement.location,
      },
      agreedAmount: requirement.wagesOffered,
      notes: `Application for ${requirement.workType}`,
    });

    // Add to applicants array
    requirement.applicants.push({
      worker: req.user._id,
      appliedAt: new Date(),
      status: "pending",
      hireRequestId: hireRequest._id,
    });

    await requirement.save();

    // Notify farmer
    const Notification = require("../models/Notification");
    await Notification.create({
      recipientId: requirement.farmer,
      type: "worker_application",
      title: "🔔 New Worker Application!",
      message: `${req.user.name} applied for your ${requirement.workType} job`,
      relatedUserId: req.user._id,
      data: {
        hireRequestId: hireRequest._id,
        requirementId: requirement._id,
        workerName: req.user.name,
        workType: requirement.workType,
      },
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      hireRequest,
    });
  } catch (error) {
    console.error("Apply for requirement error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ ADD: Get worker's own applications
exports.getWorkerApplications = async (req, res) => {
  try {
    const WorkerHireRequest = require("../models/WorkerHireRequest");
    
    const applications = await WorkerHireRequest.find({
      worker: req.user._id,
      requestType: "worker_to_farmer",
    })
      .populate("farmer", "name phone email")
      .populate("requirementId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// @desc Delete worker requirement
// @route DELETE /api/worker-requirements/:id
// @access Private (Farmer)
exports.deleteWorkerRequirement = async (req, res) => {
	try {
		const workerRequirement = await WorkerRequirement.findById(req.params.id);

		if (!workerRequirement) {
			return res.status(404).json({
				success: false,
				message: "Requirement not found",
			});
		}

		if (workerRequirement.farmer.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to delete this requirement",
			});
		}

		await workerRequirement.deleteOne();

		res.status(200).json({
			success: true,
			message: "Requirement deleted successfully",
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

module.exports = exports;
