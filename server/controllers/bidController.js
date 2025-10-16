const Bid = require("../models/Bid");
const TractorRequirement = require("../models/TractorRequirement");
const Booking = require("../models/Booking");
const Notification = require("../models/Notification");
const TractorService = require("../models/TractorService");

// @desc Place a bid on a tractor requirement
// @route POST /api/bids
// @access Private (Tractor Owner)
exports.placeBid = async (req, res) => {
	try {
		const {
			requirementId,
			proposedAmount,
			proposedDuration,
			proposedDate,
			message,
		} = req.body;

		// Check if requirement exists
		const requirement = await TractorRequirement.findById(
			requirementId
		).populate("farmer", "name phone email");

		if (!requirement) {
			return res.status(404).json({
				success: false,
				message: "Requirement not found",
			});
		}

		if (requirement.status !== "open") {
			return res.status(400).json({
				success: false,
				message: "This requirement is no longer accepting bids",
			});
		}

		// Check if already bid
		const existingBid = await Bid.findOne({
			requirementId,
			tractorOwnerId: req.user._id,
		});

		if (existingBid) {
			return res.status(400).json({
				success: false,
				message: "You have already placed a bid on this requirement",
			});
		}

		// Create bid
		const bid = await Bid.create({
			requirementId,
			tractorOwnerId: req.user._id,
			proposedAmount,
			proposedDuration,
			proposedDate: proposedDate || requirement.expectedDate,
			message: message || "",
		});

		// Create notification for farmer
		await Notification.create({
			recipientId: requirement.farmer._id,
			type: "bid_placed",
			title: "🎯 New Bid Received!",
			message: `${req.user.name} placed a bid of ₹${proposedAmount} for your ${requirement.workType} request`,
			relatedUserId: req.user._id,
			relatedRequirementId: requirementId,
			data: {
				bidId: bid._id,
				tractorOwnerName: req.user.name,
				proposedAmount,
				workType: requirement.workType,
			},
		});

		res.status(201).json({
			success: true,
			message: "Bid placed successfully",
			bid,
		});
	} catch (error) {
		console.error("Place bid error:", error);
		res.status(500).json({
			success: false,
			message: error.message || "Failed to place bid",
		});
	}
};

// @desc Get bids for a farmer (on their requirements)
// @route GET /api/bids/farmer
// @access Private (Farmer)
exports.getFarmerBids = async (req, res) => {
	try {
		// Find all requirements by this farmer
		const requirements = await TractorRequirement.find({
			farmer: req.user._id,
		}).select("_id");

		const requirementIds = requirements.map((r) => r._id);

		// Find all bids on those requirements
		const bids = await Bid.find({
			requirementId: { $in: requirementIds },
		})
			.populate("tractorOwnerId", "name phone email address")
			.populate("requirementId", "workType landSize location expectedDate")
			.sort({ createdAt: -1 })
			.lean();

		res.status(200).json({
			success: true,
			count: bids.length,
			bids,
		});
	} catch (error) {
		console.error("Get farmer bids error:", error);
		res.status(500).json({
			success: false,
			message: error.message || "Failed to fetch bids",
		});
	}
};

// @desc Get bids placed by tractor owner
// @route GET /api/bids/tractor-owner
// @access Private (Tractor Owner)
exports.getTractorOwnerBids = async (req, res) => {
	try {
		const bids = await Bid.find({
			tractorOwnerId: req.user._id,
		})
			.populate(
				"requirementId",
				"workType landSize location expectedDate farmer"
			)
			.populate({
				path: "requirementId",
				populate: {
					path: "farmer",
					select: "name phone email",
				},
			})
			.sort({ createdAt: -1 })
			.lean();

		res.status(200).json({
			success: true,
			count: bids.length,
			bids,
		});
	} catch (error) {
		console.error("Get tractor owner bids error:", error);
		res.status(500).json({
			success: false,
			message: error.message || "Failed to fetch bids",
		});
	}
};

// @desc Accept a bid (Farmer)
// @route POST /api/bids/:id/accept
// @access Private (Farmer)
exports.acceptBid = async (req, res) => {
	try {
		const bid = await Bid.findById(req.params.id)
			.populate("tractorOwnerId", "name phone email")
			.populate("requirementId");

		if (!bid) {
			return res.status(404).json({
				success: false,
				message: "Bid not found",
			});
		}

		// Check if user is the farmer who posted the requirement
		if (bid.requirementId.farmer.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized",
			});
		}

		if (bid.status !== "pending") {
			return res.status(400).json({
				success: false,
				message: "This bid has already been processed",
			});
		}

		// Get tractor service
		const tractorService = await TractorService.findOne({
			owner: bid.tractorOwnerId._id,
		});

		// Create booking
		const booking = await Booking.create({
			farmer: req.user._id,
			tractorOwnerId: bid.tractorOwnerId._id,
			serviceType: "tractor",
			serviceId: tractorService?._id,
			serviceModel: "TractorService",
			bookingDate: bid.proposedDate,
			duration: parseInt(bid.proposedDuration) || 1,
			totalCost: bid.proposedAmount,
			location: bid.requirementId.location,
			workType: bid.requirementId.workType,
			landSize: bid.requirementId.landSize,
			status: "confirmed",
			paymentStatus: "pending",
			bidId: bid._id,
			notes: `Booking created from accepted bid. ${bid.message || ""}`,
		});

		// Update bid status
		bid.status = "accepted";
		await bid.save();

		// Update requirement status
		bid.requirementId.status = "accepted";
		bid.requirementId.acceptedBy = bid.tractorOwnerId._id;
		bid.requirementId.acceptedAt = new Date();
		await bid.requirementId.save();

		// Reject all other bids
		await Bid.updateMany(
			{
				requirementId: bid.requirementId._id,
				_id: { $ne: bid._id },
				status: "pending",
			},
			{ status: "rejected" }
		);

		// Create notification for tractor owner
		await Notification.create({
			recipientId: bid.tractorOwnerId._id,
			type: "bid_accepted",
			title: "🎉 Your Bid Was Accepted!",
			message: `${req.user.name} accepted your bid of ₹${bid.proposedAmount}. Booking created!`,
			relatedUserId: req.user._id,
			data: {
				bookingId: booking._id,
				bidId: bid._id,
				amount: bid.proposedAmount,
			},
		});

		res.status(200).json({
			success: true,
			message: "Bid accepted and booking created successfully",
			bid,
			booking,
		});
	} catch (error) {
		console.error("Accept bid error:", error);
		res.status(500).json({
			success: false,
			message: error.message || "Failed to accept bid",
		});
	}
};

// @desc Reject a bid (Farmer)
// @route POST /api/bids/:id/reject
// @access Private (Farmer)
exports.rejectBid = async (req, res) => {
	try {
		const bid = await Bid.findById(req.params.id).populate("requirementId");

		if (!bid) {
			return res.status(404).json({
				success: false,
				message: "Bid not found",
			});
		}

		if (bid.requirementId.farmer.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized",
			});
		}

		if (bid.status !== "pending") {
			return res.status(400).json({
				success: false,
				message: "This bid has already been processed",
			});
		}

		bid.status = "rejected";
		await bid.save();

		// Notify tractor owner
		await Notification.create({
			recipientId: bid.tractorOwnerId,
			type: "bid_rejected",
			title: "Bid Not Accepted",
			message: `Your bid on ${bid.requirementId.workType} was not accepted`,
			data: {
				bidId: bid._id,
			},
		});

		res.status(200).json({
			success: true,
			message: "Bid rejected",
		});
	} catch (error) {
		console.error("Reject bid error:", error);
		res.status(500).json({
			success: false,
			message: error.message || "Failed to reject bid",
		});
	}
};
