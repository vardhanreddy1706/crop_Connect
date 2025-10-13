const TractorService = require("../models/tractorService");

// @desc    Create tractor service
// @route   POST /api/tractors
// @access  Private (Tractor Owner)
exports.createTractorService = async (req, res) => {
	try {
		const tractorService = await TractorService.create({
			...req.body,
			owner: req.user._id,
		});

		res.status(201).json({
			success: true,
			message: "Tractor service added successfully",
			tractorService,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Get all tractor services
// @route   GET /api/tractors
// @access  Public
exports.getAllTractorServices = async (req, res) => {
	try {
		const { typeOfPlowing, landType, location, availability } = req.query;

		let query = {};

		if (typeOfPlowing) query.typeOfPlowing = typeOfPlowing;
		if (landType) query.landType = landType;
		if (location) query["location.district"] = new RegExp(location, "i");
		if (availability) query.availability = availability === "true";

		const tractorServices = await TractorService.find(query)
			.populate("owner", "name phone email")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: tractorServices.length,
			tractorServices,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Get single tractor service
// @route   GET /api/tractors/:id
// @access  Public
exports.getTractorServiceById = async (req, res) => {
	try {
		const tractorService = await TractorService.findById(
			req.params.id
		).populate("owner", "name phone email address");

		if (!tractorService) {
			return res.status(404).json({
				success: false,
				message: "Tractor service not found",
			});
		}

		res.status(200).json({
			success: true,
			tractorService,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Update tractor service
// @route   PUT /api/tractors/:id
// @access  Private (Owner only)
exports.updateTractorService = async (req, res) => {
	try {
		let tractorService = await TractorService.findById(req.params.id);

		if (!tractorService) {
			return res.status(404).json({
				success: false,
				message: "Tractor service not found",
			});
		}

		if (tractorService.owner.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized",
			});
		}

		tractorService = await TractorService.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true, runValidators: true }
		);

		res.status(200).json({
			success: true,
			message: "Tractor service updated successfully",
			tractorService,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Delete tractor service
// @route   DELETE /api/tractors/:id
// @access  Private (Owner only)
exports.deleteTractorService = async (req, res) => {
	try {
		const tractorService = await TractorService.findById(req.params.id);

		if (!tractorService) {
			return res.status(404).json({
				success: false,
				message: "Tractor service not found",
			});
		}

		if (tractorService.owner.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized",
			});
		}

		await tractorService.deleteOne();

		res.status(200).json({
			success: true,
			message: "Tractor service deleted successfully",
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Get my tractor services
// @route   GET /api/tractors/my-services
// @access  Private (Tractor Owner)
exports.getMyTractorServices = async (req, res) => {
	try {
		const tractorServices = await TractorService.find({
			owner: req.user._id,
		}).sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: tractorServices.length,
			tractorServices,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};


// @desc Create tractor service (Enhanced with notifications)
// @route POST /api/tractors
// @access Private (Tractor Owner)
exports.createTractorService = async (req, res) => {
  try {
    const tractorService = await TractorService.create({ ...req.body, owner: req.user._id });

    const nearbyFarmers = await User.find({
      role: "farmer",
      "address.district": { $regex: req.body.location.district, $options: "i" },
    }).select("_id");

    const notifications = nearbyFarmers.map(farmer => ({
      recipientId: farmer._id,
      type: "service_posted",
      title: "🚜 New Tractor Service Available",
      message: `${req.body.typeOfPlowing} service in ${req.body.location.district} - ₹${req.body.chargePerAcre}/acre`,
      relatedUserId: req.user._id,
      relatedServiceId: tractorService._id,
      data: { serviceType: req.body.typeOfPlowing, chargePerAcre: req.body.chargePerAcre, location: req.body.location, brand: req.body.brand, model: req.body.model },
    }));

    if (notifications.length > 0) await Notification.insertMany(notifications);

    if (req.io && nearbyFarmers.length > 0) {
      nearbyFarmers.forEach(farmer => {
        req.io.to(farmer._id.toString()).emit("notification", {
          type: "service_posted",
          title: "🚜 New Tractor Service Available",
          message: `${req.body.typeOfPlowing} service in ${req.body.location.district}`,
          data: tractorService,
        });
      });
    }

    res.status(201).json({ success: true, message: "Tractor service added successfully", tractorService, notifiedFarmers: nearbyFarmers.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Cancel tractor service
// @route POST /api/tractors/:id/cancel
// @access Private (Tractor Owner)
exports.cancelTractorService = async (req, res) => {
  try {
    const tractorService = await TractorService.findById(req.params.id);
    if (!tractorService) return res.status(404).json({ success: false, message: "Tractor service not found" });
    if (tractorService.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    tractorService.availability = false;
    tractorService.status = "cancelled";
    tractorService.cancelledAt = Date.now();
    await tractorService.save();

    res.status(200).json({ success: true, message: "Tractor service cancelled successfully", tractorService });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Other CRUD functions remain similar (getAll, getById, update, delete, getMyServices)…

