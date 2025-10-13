const TractorRequirement = require("../models/TractorRequirement");
const TractorService = require("../models/tractorService");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Booking = require("../models/Booking");

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

// @desc    Get all tractor requirements (for tractor owners to see)
// @route   GET /api/tractor-requirements
// @access  Private (Tractor Owner)
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
		else query.status = { $in: ["open", "in_progress"] }; // 🆕 Show both open and in_progress

		const tractorRequirements = await TractorRequirement.find(query)
			.populate("farmer", "name phone email address")
			.populate("responses.tractorOwner", "name phone rating")
			.populate("acceptedResponse.tractorOwner", "name phone") // 🆕 NEW: Populate accepted response
			.sort({ urgency: -1, expectedDate: 1, createdAt: -1 });

		res.status(200).json({
			success: true,
			count: tractorRequirements.length,
			tractorRequirements, // Changed from 'requirements' to match frontend
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Get single tractor requirement
// @route   GET /api/tractor-requirements/:id
// @access  Private
exports.getTractorRequirementById = async (req, res) => {
	try {
		const tractorRequirement = await TractorRequirement.findById(req.params.id)
			.populate("farmer", "name phone email address")
			.populate("responses.tractorOwner", "name phone email rating")
			.populate("acceptedResponse.tractorOwner", "name phone address"); // 🆕 NEW

		if (!tractorRequirement) {
			return res.status(404).json({
				success: false,
				message: "Tractor requirement not found",
			});
		}

		res.status(200).json({
			success: true,
			tractorRequirement, // Changed from 'requirement'
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Get my tractor requirements (Farmer)
// @route   GET /api/tractor-requirements/my-requirements
// @access  Private (Farmer)
exports.getMyTractorRequirements = async (req, res) => {
	try {
		const tractorRequirements = await TractorRequirement.find({
			farmer: req.user._id,
		})
			.populate("responses.tractorOwner", "name phone email rating")
			.populate("acceptedResponse.tractorOwner", "name phone address") // 🆕 NEW
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: tractorRequirements.length,
			tractorRequirements, // Changed from 'requirements'
		});
	} catch (error) {
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

// ==================== NEW FUNCTIONS ====================

// @desc    Accept farmer's tractor requirement (Tractor Owner accepts bid)
// @route   POST /api/tractor-requirements/:id/accept
// @access  Private (Tractor Owner)
exports.acceptRequirement = async (req, res) => {
	try {
		const requirement = await TractorRequirement.findById(
			req.params.id
		).populate("farmer", "name phone email address");

		if (!requirement) {
			return res.status(404).json({
				success: false,
				message: "Tractor requirement not found",
			});
		}

		if (requirement.status !== "open") {
			return res.status(400).json({
				success: false,
				message: "This requirement is no longer open",
			});
		}

		// Find the response from current tractor owner
		const response = requirement.responses.find(
			(r) => r.tractorOwner.toString() === req.user._id.toString()
		);

		if (!response) {
			return res.status(400).json({
				success: false,
				message: "You haven't placed a bid for this requirement",
			});
		}

		// Update requirement status to in_progress and store accepted response
		requirement.status = "in_progress";
		requirement.acceptedResponse = {
			tractorOwner: req.user._id,
			quotedPrice: response.quotedPrice,
			acceptedAt: Date.now(),
		};
		await requirement.save();

		// Create booking
		const booking = await Booking.create({
			farmer: requirement.farmer._id,
			serviceType: "tractor",
			serviceId: req.user._id,
			serviceModel: "TractorService",
			bookingDate: requirement.expectedDate,
			duration: requirement.duration || response.estimatedDuration || "1 day",
			totalCost: response.quotedPrice * requirement.landSize,
			location: requirement.location,
			workType: requirement.workType,
			landSize: requirement.landSize,
			status: "confirmed",
			paymentStatus: "pending",
		});

		// Get tractor owner details
		const tractorOwner = await User.findById(req.user._id).select(
			"name phone address"
		);
		const tractorService = await TractorService.findOne({
			owner: req.user._id,
		}).select("brand model vehicleNumber");

		// Notify farmer about acceptance with tractor owner details
		await Notification.create({
			recipientId: requirement.farmer._id,
			type: "bid_accepted",
			title: "🎉 Your Request Accepted!",
			message: `${tractorOwner.name} has accepted your tractor requirement for ${requirement.workType}`,
			relatedUserId: req.user._id,
			relatedRequirementId: requirement._id,
			relatedBookingId: booking._id,
			data: {
				tractorOwner: {
					name: tractorOwner.name,
					phone: tractorOwner.phone,
					address: tractorOwner.address,
				},
				tractorService,
				quotedPrice: response.quotedPrice,
				totalCost: response.quotedPrice * requirement.landSize,
				workDate: requirement.expectedDate,
				location: requirement.location,
				bookingId: booking._id,
			},
		});

		// Real-time notification to farmer
		if (req.io) {
			req.io.to(requirement.farmer._id.toString()).emit("notification", {
				type: "bid_accepted",
				title: "🎉 Your Request Accepted!",
				message: `${tractorOwner.name} has accepted your requirement`,
				data: {
					tractorOwner: {
						name: tractorOwner.name,
						phone: tractorOwner.phone,
						address: tractorOwner.address,
					},
					tractorService,
					booking,
				},
				timestamp: new Date(),
			});
		}

		res.status(200).json({
			success: true,
			message:
				"Requirement accepted successfully. Farmer has been notified with your details.",
			booking,
			requirement,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Mark work as completed (Tractor Owner)
// @route   POST /api/tractor-requirements/:id/complete
// @access  Private (Tractor Owner)
exports.completeWork = async (req, res) => {
	try {
		const requirement = await TractorRequirement.findById(
			req.params.id
		).populate("farmer", "name phone");

		if (!requirement) {
			return res.status(404).json({
				success: false,
				message: "Requirement not found",
			});
		}

		// Find the associated booking
		const booking = await Booking.findOne({
			farmer: requirement.farmer._id,
			serviceId: req.user._id,
		});

		if (!booking) {
			return res.status(404).json({
				success: false,
				message: "Booking not found",
			});
		}

		// Update statuses
		requirement.status = "completed";
		booking.status = "completed";

		await requirement.save();
		await booking.save();

		// Notify farmer about work completion and payment options
		await Notification.create({
			recipientId: requirement.farmer._id,
			type: "work_completed",
			title: "✅ Work Completed!",
			message: `Your ${requirement.workType} work has been completed. Please proceed with payment.`,
			relatedRequirementId: requirement._id,
			relatedBookingId: booking._id,
			data: {
				workType: requirement.workType,
				totalCost: booking.totalCost,
				completedAt: Date.now(),
				bookingId: booking._id,
				paymentOptions: [
					{
						method: "cash",
						title: "Pay After Work Completion",
						description: "Pay cash after work is done",
					},
					{
						method: "razorpay",
						title: "Pay Online via Razorpay",
						description: "Secure online payment",
					},
				],
			},
		});

		// Real-time notification to farmer
		if (req.io) {
			req.io.to(requirement.farmer._id.toString()).emit("notification", {
				type: "work_completed",
				title: "✅ Work Completed!",
				message: `Your ${requirement.workType} work has been completed`,
				data: { booking, requirement },
				timestamp: new Date(),
			});
		}

		res.status(200).json({
			success: true,
			message: "Work marked as completed. Farmer can now make payment.",
			requirement,
			booking,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
