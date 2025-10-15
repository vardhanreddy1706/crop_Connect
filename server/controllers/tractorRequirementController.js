const TractorRequirement = require("../models/TractorRequirement");
const TractorService = require("../models/TractorService");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Booking = require("../models/Booking");
const NotificationService = require("../services/notificationService");

// ==================== EXISTING FUNCTIONS (ENHANCED) ====================

// @desc    Create tractor requirement (ENHANCED with auto-notification)
// @route   POST /api/tractor-requirements
// @access  Private (Farmer)
exports.createTractorRequirement = async (req, res) => {
	try {
		const tractorRequirement = await TractorRequirement.create({
			...req.body,
			farmer: req.user._id,
		});
		        await NotificationService.notifyTractorRequirementPosted(
							req.user,
							requirement
						);


		// 🆕 NEW: Find all tractor owners in the same district/state
		const nearbyTractorOwners = await User.find({
			role: "tractor_owner",
			"address.district": { $regex: req.body.location.district, $options: "i" },
		}).select("_id name");

		// 🆕 NEW: Create notifications for all nearby tractor owners
		const notifications = nearbyTractorOwners.map((owner) => ({
			recipientId: owner._id,
			type: "new_requirement",
			title: "🚜 New Tractor Request from Farmer",
			message: `New ${req.body.workType} request in ${req.body.location.district} - ${req.body.landSize} acres`,
			relatedUserId: req.user._id,
			relatedRequirementId: tractorRequirement._id,
			data: {
				farmerName: req.user.name,
				workType: req.body.workType,
				landSize: req.body.landSize,
				location: req.body.location,
				maxBudget: req.body.maxBudget,
				urgency: req.body.urgency,
				expectedDate: req.body.expectedDate,
				farmerPhone: req.user.phone,
				farmerAddress: req.user.address,
			},
		}));

		if (notifications.length > 0) {
			await Notification.insertMany(notifications);
		}

		// 🆕 NEW: Real-time notification via WebSocket
		if (req.io && nearbyTractorOwners.length > 0) {
			nearbyTractorOwners.forEach((owner) => {
				req.io.to(owner._id.toString()).emit("notification", {
					type: "new_requirement",
					title: "🚜 New Tractor Request from Farmer",
					message: `New ${req.body.workType} request in ${req.body.location.district} - ${req.body.landSize} acres`,
					data: tractorRequirement,
					timestamp: new Date(),
				});
			});
		}

		res.status(201).json({
			success: true,
			message: "Tractor requirement posted successfully",
			tractorRequirement,
			notifiedOwners: nearbyTractorOwners.length, // Shows how many owners were notified
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc Get all tractor requirements (for tractor owners to see)
// @route GET /api/tractor-requirements
// @access Private (Tractor Owner)
exports.getAllTractorRequirements = async (req, res) => {
	try {
		const { workType, landType, district, state, urgency, status } = req.query;

		let query = {};

		if (workType) query.workType = workType;
		if (landType) query.landType = landType;
		if (district) query["location.district"] = new RegExp(district, "i");
		if (state) query["location.state"] = new RegExp(state, "i");
		if (urgency) query.urgency = urgency;
		if (status) query.status = status;
		else query.status = "open"; // Default show only open requirements

		const tractorRequirements = await TractorRequirement.find(query)
			.populate("farmer", "name phone email address")
			.populate("acceptedBy", "name phone email") // ✅ FIXED - removed acceptedResponse
			.populate("responses.tractorOwner", "name phone email") // ✅ Correct nested path
			.sort({ createdAt: -1 })
			.lean();

		res.status(200).json({
			success: true,
			tractorRequirements,
		});
	} catch (error) {
		console.error("Get requirements error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc Get tractor requirement by ID
// @route GET /api/tractor-requirements/:id
// @access Private
exports.getTractorRequirementById = async (req, res) => {
	try {
		const tractorRequirement = await TractorRequirement.findById(req.params.id)
			.populate("farmer", "name phone email address")
			.populate("acceptedBy", "name phone email") // ✅ FIXED
			.populate("responses.tractorOwner", "name phone email"); // ✅ FIXED

		if (!tractorRequirement) {
			return res.status(404).json({
				success: false,
				message: "Tractor requirement not found",
			});
		}

		res.status(200).json({
			success: true,
			tractorRequirement,
		});
	} catch (error) {
		console.error("Get requirement by ID error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc Get my tractor requirements (for farmers)
// @route GET /api/tractor-requirements/my-requirements
// @access Private (Farmer)
exports.getMyTractorRequirements = async (req, res) => {
	try {
		const tractorRequirements = await TractorRequirement.find({
			farmer: req.user._id,
		})
			.populate("acceptedBy", "name phone email") // ✅ FIXED
			.populate("responses.tractorOwner", "name phone email") // ✅ FIXED
			.sort({ createdAt: -1 })
			.lean();

		res.status(200).json({
			success: true,
			tractorRequirements,
		});
	} catch (error) {
		console.error("Get my requirements error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Update tractor requirement
// @route   PUT /api/tractor-requirements/:id
// @access  Private (Farmer - Owner only)
exports.updateTractorRequirement = async (req, res) => {
	try {
		let tractorRequirement = await TractorRequirement.findById(req.params.id);

		if (!tractorRequirement) {
			return res.status(404).json({
				success: false,
				message: "Tractor requirement not found",
			});
		}

		// Check ownership
		if (tractorRequirement.farmer.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to update this requirement",
			});
		}

		tractorRequirement = await TractorRequirement.findByIdAndUpdate(
			req.params.id,
			req.body,
			{
				new: true,
				runValidators: true,
			}
		);

		res.status(200).json({
			success: true,
			message: "Requirement updated successfully",
			tractorRequirement, // Changed from 'requirement'
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Delete tractor requirement
// @route   DELETE /api/tractor-requirements/:id
// @access  Private (Farmer - Owner only)
exports.deleteTractorRequirement = async (req, res) => {
	try {
		const tractorRequirement = await TractorRequirement.findById(req.params.id);

		if (!tractorRequirement) {
			return res.status(404).json({
				success: false,
				message: "Tractor requirement not found",
			});
		}

		// Check ownership
		if (tractorRequirement.farmer.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized to delete this requirement",
			});
		}

		await tractorRequirement.deleteOne();

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

// @desc    Respond to tractor requirement (Tractor Owner places bid)
// @route   POST /api/tractor-requirements/:id/respond
// @access  Private (Tractor Owner)
exports.respondToRequirement = async (req, res) => {
	try {
		const { message, quotedPrice, contactNumber, estimatedDuration, notes } =
			req.body;

		const tractorRequirement = await TractorRequirement.findById(
			req.params.id
		).populate("farmer", "name phone email");

		if (!tractorRequirement) {
			return res.status(404).json({
				success: false,
				message: "Tractor requirement not found",
			});
		}

		if (tractorRequirement.status !== "open") {
			return res.status(400).json({
				success: false,
				message: "This requirement is no longer open for responses",
			});
		}

		// Check if already responded
		const alreadyResponded = tractorRequirement.responses.some(
			(response) => response.tractorOwner.toString() === req.user._id.toString()
		);

		if (alreadyResponded) {
			return res.status(400).json({
				success: false,
				message: "You have already responded to this requirement",
			});
		}

		// Add response (bid)
		tractorRequirement.responses.push({
			tractorOwner: req.user._id,
			message: message || notes || "",
			quotedPrice,
			contactNumber: contactNumber || req.user.phone,
			estimatedDuration: estimatedDuration || "1 day",
			respondedAt: Date.now(),
		});

		await tractorRequirement.save();

		// Get tractor service details
		const tractorService = await TractorService.findOne({
			owner: req.user._id,
		}).select("brand model vehicleNumber chargePerAcre rating");

		const userDetails = await User.findById(req.user._id).select(
			"name phone address profileImage"
		);

		// Create notification for farmer
		await Notification.create({
			recipientId: tractorRequirement.farmer._id,
			type: "bid_placed",
			title: "📋 New Bid Received!",
			message: `${userDetails.name} has placed a bid of ₹${quotedPrice}/acre for your ${tractorRequirement.workType} request`,
			relatedUserId: req.user._id,
			relatedRequirementId: tractorRequirement._id,
			data: {
				tractorOwner: userDetails,
				tractorService,
				quotedPrice,
				contactNumber: contactNumber || req.user.phone,
				workType: tractorRequirement.workType,
				landSize: tractorRequirement.landSize,
				estimatedDuration: estimatedDuration || "1 day",
			},
		});

		// 🆕 NEW: Real-time notification to farmer
		if (req.io) {
			req.io.to(tractorRequirement.farmer._id.toString()).emit("notification", {
				type: "bid_placed",
				title: "📋 New Bid Received!",
				message: `${userDetails.name} placed a bid of ₹${quotedPrice}/acre`,
				data: { quotedPrice, tractorOwner: userDetails },
				timestamp: new Date(),
			});
		}

		res.status(200).json({
			success: true,
			message: "Bid placed successfully",
			tractorRequirement,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc Accept tractor requirement (Tractor Owner)
// @route POST /api/tractor-requirements/:id/accept
// @access Private (Tractor Owner)
exports.acceptRequirement = async (req, res) => {
  try {
    const requirement = await TractorRequirement.findById(req.params.id)
      .populate("farmer", "name phone email");

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: "Tractor requirement not found",
      });
    }

    console.log("Requirement status:", requirement.status);
    console.log("Accepted by:", requirement.acceptedBy);

    // ✅ FIXED - Only check if already accepted by someone
    if (requirement.acceptedBy) {
      const acceptedUser = await User.findById(requirement.acceptedBy);
      return res.status(400).json({
        success: false,
        message: `This requirement has already been accepted by ${acceptedUser?.name || 'another tractor owner'}`,
      });
    }

    // Get tractor service
    const tractorService = await TractorService.findOne({
      owner: req.user._id,
    });

    if (!tractorService) {
      return res.status(400).json({
        success: false,
        message: "Please create a tractor service first",
      });
    }

    // Parse duration
    let durationHours = 8;
    if (requirement.duration) {
      const match = requirement.duration.match(/(\d+)/);
      if (match) {
        durationHours = parseInt(match[1]);
      }
    }

    // Calculate cost
    const costPerAcre = tractorService.chargePerAcre || (requirement.maxBudget / requirement.landSize);
    const totalCost = Math.round(costPerAcre * requirement.landSize);

    // Create booking
    const booking = await Booking.create({
      farmer: requirement.farmer._id,
      tractorOwnerId: req.user._id,
      serviceType: "tractor",
      serviceId: tractorService._id,
      serviceModel: "TractorService",
      bookingDate: requirement.expectedDate,
      duration: durationHours,
      totalCost: totalCost,
      location: requirement.location,
      workType: requirement.workType,
      landSize: requirement.landSize,
      status: "confirmed",
      paymentStatus: "pending",
      notes: `Booking created from requirement. Work: ${requirement.workType}, Land: ${requirement.landSize} acres`,
    });

    // Update requirement
    requirement.status = "in_progress";
    requirement.acceptedBy = req.user._id;
    requirement.acceptedAt = new Date();
    await requirement.save();

    // Populate farmer details for response
    await requirement.populate("farmer", "name phone email");

    // Create notification
    try {
      await Notification.create({
        recipientId: requirement.farmer._id,
        type: "requirement_accepted",
        title: "🎉 Requirement Accepted!",
        message: `${req.user.name} has accepted your ${requirement.workType} request`,
        relatedUserId: req.user._id,
        relatedRequirementId: requirement._id,
        data: {
          bookingId: booking._id,
          tractorOwner: req.user.name,
          workType: requirement.workType,
          totalCost,
        },
      });
    } catch (notifError) {
      console.error("Notification creation error:", notifError);
      // Don't fail the accept if notification fails
    }

    res.status(200).json({
      success: true,
      message: "Requirement accepted successfully",
      booking,
      requirement,
    });
  } catch (error) {
    console.error("Accept requirement error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to accept requirement",
    });
  }
};


// @desc Complete work (Tractor Owner marks work as done)
// @route POST /api/tractor-requirements/:id/complete
// @access Private (Tractor Owner)
exports.completeWork = async (req, res) => {
	try {
		const requirement = await TractorRequirement.findById(req.params.id);

		if (!requirement) {
			return res.status(404).json({
				success: false,
				message: "Requirement not found",
			});
		}

		if (requirement.status !== "in_progress") {
			return res.status(400).json({
				success: false,
				message: "This requirement is not in progress",
			});
		}

		// Update requirement
		requirement.status = "completed";
		requirement.completedAt = new Date();
		await requirement.save();

		// Update booking
		const booking = await Booking.findOne({
			serviceId: requirement.acceptedBy,
			farmer: requirement.farmer,
			workType: requirement.workType,
		});

		if (booking) {
			booking.status = "completed";
			await booking.save();
		}

		// Notify farmer
		await Notification.create({
			recipientId: requirement.farmer,
			type: "work_completed",
			title: "Work Completed!",
			message: `${requirement.workType} work has been completed. Please make payment.`,
			relatedRequirementId: requirement._id,
		});

		res.status(200).json({
			success: true,
			message: "Work marked as completed",
			requirement,
		});
	} catch (error) {
		console.error("Complete work error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
