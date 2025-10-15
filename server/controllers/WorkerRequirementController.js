const WorkerRequirement = require("../models/WorkerRequirement");

const { createNotification } = require("../utils/createNotification");


// @desc    Farmer creates worker requirement
// @route   POST /api/worker-requirements
// @access  Private (Farmer)
exports.createWorkerRequirement = async (req, res) => {
	try {
		const requirementData = {
			farmer: req.user._id,
			...req.body,
		};

		const requirement = await WorkerRequirement.create(requirementData);

		await requirement.populate("farmer", "name email phone");

		res.status(201).json({
			success: true,
			message: "Worker requirement posted successfully!",
			requirement,
		});
	} catch (error) {
		console.error("Error creating worker requirement:", error);
		res.status(400).json({
			success: false,
			message: error.message || "Failed to create worker requirement",
		});
	}
};

// @desc Get all worker requirements (For workers to browse)
// @route GET /api/worker-requirements
// @access Public
exports.getAllWorkerRequirements = async (req, res) => {
  try {
    const { status, location, minWage, workType } = req.query;
    const query = { status: status || "open" };

    if (location) {
      query["location.fullAddress"] = new RegExp(location, "i");
    }

    if (minWage) {
      query.wagesOffered = { $gte: Number(minWage) };
    }

    if (workType) {
      query.workType = workType;
    }

    const requirements = await WorkerRequirement.find(query)
      .populate("farmer", "name phone email")
      .sort({ createdAt: -1 });

    // ✅ FIXED: Changed 'requirements' to 'workerRequirements'
    res.status(200).json({
      success: true,
      count: requirements.length,
      workerRequirements: requirements,  // ✅ Match frontend expectation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


// @desc    Get farmer's own requirements
// @route   GET /api/worker-requirements/my-requirements
// @access  Private (Farmer)
exports.getMyRequirements = async (req, res) => {
	try {
		const requirements = await WorkerRequirement.find({
			farmer: req.user._id,
		})
			.populate("applicants.worker", "name phone email")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: requirements.length,
			requirements,
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};



// @desc    Update worker requirement
// @route   PUT /api/worker-requirements/:id
// @access  Private (Farmer - owner only)
exports.updateWorkerRequirement = async (req, res) => {
	try {
		let requirement = await WorkerRequirement.findById(req.params.id);

		if (!requirement) {
			return res.status(404).json({
				success: false,
				message: "Requirement not found",
			});
		}

		// Check ownership
		if (requirement.farmer.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to update this requirement",
			});
		}

		requirement = await WorkerRequirement.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true, runValidators: true }
		);

		res.status(200).json({
			success: true,
			message: "Requirement updated successfully",
			requirement,
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Delete worker requirement
// @route   DELETE /api/worker-requirements/:id
// @access  Private (Farmer - owner only)
exports.deleteWorkerRequirement = async (req, res) => {
	try {
		const requirement = await WorkerRequirement.findById(req.params.id);

		if (!requirement) {
			return res.status(404).json({
				success: false,
				message: "Requirement not found",
			});
		}

		// Check ownership
		if (requirement.farmer.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to delete this requirement",
			});
		}

		await requirement.deleteOne();

		res.status(200).json({
			success: true,
			message: "Requirement deleted successfully",
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};




// Keep only ONE applyForRequirement function:
exports.applyForRequirement = async (req, res) => {
  try {
    const requirement = await WorkerRequirement.findById(req.params.id).populate("farmer");
    
    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: "Requirement not found",
      });
    }

    // Check if already applied
    const alreadyApplied = requirement.applicants.find(
      (app) => app.worker.toString() === req.user._id.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this requirement",
      });
    }

    requirement.applicants.push({
      worker: req.user._id,
      status: "pending",
    });

    await requirement.save();

    // ✅ NOW THIS WILL WORK - Create notification for farmer
    try {
      await createNotification({
        userId: requirement.farmer._id,
        type: "application_received",
        title: "New Worker Application",
        message: `${req.user.name} applied for your ${requirement.workType} job`,
        relatedId: requirement._id,
        relatedModel: "WorkerRequirement",
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
      // Don't fail the whole request if notification fails
    }

    res.status(200).json({
      success: true,
      message: "Application submitted successfully",
      requirement,
    });
  } catch (error) {
    console.error("Apply for requirement error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};