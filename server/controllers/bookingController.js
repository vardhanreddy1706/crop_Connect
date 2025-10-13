const Booking = require("../models/Booking");
const TractorService = require("../models/tractorService");
const WorkerService = require("../models/WorkerService");

// @desc    Create booking
// @route   POST /api/bookings/create
// @access  Private (Farmer)
exports.createBooking = async (req, res) => {
	try {
		const {
			serviceType,
			serviceId,
			bookingDate,
			duration,
			workType,
			landSize,
			location,
			notes,
		} = req.body;

		let service;
		let serviceModel;
		let totalCost = 0;

		if (serviceType === "tractor") {
			service = await TractorService.findById(serviceId);
			serviceModel = "TractorService";
			if (service && landSize) {
				totalCost = service.chargePerAcre * landSize;
			}
		} else if (serviceType === "worker") {
			service = await WorkerService.findById(serviceId);
			serviceModel = "WorkerService";
			if (service && duration) {
				totalCost = service.chargePerDay * duration;
			}
		}

		if (!service) {
			return res.status(404).json({
				success: false,
				message: "Service not found",
			});
		}

		if (!service.availability) {
			return res.status(400).json({
				success: false,
				message: "Service is not available",
			});
		}

		const booking = await Booking.create({
			farmer: req.user._id,
			serviceType,
			serviceId,
			serviceModel,
			bookingDate,
			duration,
			totalCost,
			workType,
			landSize,
			location,
			notes,
		});

		res.status(201).json({
			success: true,
			message: "Booking created successfully",
			booking,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Get all bookings for farmer
// @route   GET /api/bookings/my-bookings
// @access  Private (Farmer)
exports.getMyBookings = async (req, res) => {
	try {
		const bookings = await Booking.find({ farmer: req.user._id })
			.populate("serviceId")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: bookings.length,
			bookings,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Get bookings for service provider
// @route   GET /api/bookings/service-bookings
// @access  Private (Tractor Owner/Worker)
exports.getServiceBookings = async (req, res) => {
	try {
		let services;

		if (req.user.role === "tractor_owner") {
			services = await TractorService.find({ owner: req.user._id });
		} else if (req.user.role === "worker") {
			services = await WorkerService.find({ worker: req.user._id });
		}

		const serviceIds = services.map((s) => s._id);
		const bookings = await Booking.find({ serviceId: { $in: serviceIds } })
			.populate("farmer", "name phone email")
			.populate("serviceId")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: bookings.length,
			bookings,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
exports.updateBookingStatus = async (req, res) => {
	try {
		const { status } = req.body;
		const booking = await Booking.findById(req.params.id);

		if (!booking) {
			return res.status(404).json({
				success: false,
				message: "Booking not found",
			});
		}

		booking.status = status;
		await booking.save();

		res.status(200).json({
			success: true,
			message: "Booking status updated",
			booking,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Cancel booking
// @route   DELETE /api/bookings/:id
// @access  Private
exports.cancelBooking = async (req, res) => {
	try {
		const booking = await Booking.findById(req.params.id);

		if (!booking) {
			return res.status(404).json({
				success: false,
				message: "Booking not found",
			});
		}

		if (booking.farmer.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized",
			});
		}

		booking.status = "cancelled";
		await booking.save();

		res.status(200).json({
			success: true,
			message: "Booking cancelled successfully",
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// ✅ NEW FUNCTIONS - Add these at the end

// @desc    Get farmer's tractor bookings
// @route   GET /api/bookings/farmer/tractors
// @access  Private (Farmer)
exports.getFarmerTractorBookings = async (req, res) => {
	try {
		const bookings = await Booking.find({
			farmer: req.user._id,
			serviceType: "tractor",
		})
			.populate({
				path: "serviceId",
				populate: {
					path: "owner",
					select: "name phone email",
				},
			})
			.sort({ createdAt: -1 });

		// Format response
		const formattedBookings = bookings.map((booking) => ({
			_id: booking._id,
			bookingDate: booking.bookingDate,
			duration: booking.duration,
			location: booking.location || "",
			totalCost: booking.totalCost,
			status: booking.status,
			notes: booking.notes,
			workType: booking.workType,
			landSize: booking.landSize,
			createdAt: booking.createdAt,
			serviceProvider: {
				name: booking.serviceId?.owner?.name || "N/A",
				phone: booking.serviceId?.owner?.phone || "",
				email: booking.serviceId?.owner?.email || "",
			},
		}));

		res.status(200).json({
			success: true,
			count: formattedBookings.length,
			bookings: formattedBookings,
		});
	} catch (error) {
		console.error("Error fetching tractor bookings:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc    Get farmer's worker bookings
// @route   GET /api/bookings/farmer/workers
// @access  Private (Farmer)
exports.getFarmerWorkerBookings = async (req, res) => {
	try {
		const bookings = await Booking.find({
			farmer: req.user._id,
			serviceType: "worker",
		})
			.populate({
				path: "serviceId",
				populate: {
					path: "worker",
					select: "name phone email",
				},
			})
			.sort({ createdAt: -1 });

		// Format response
		const formattedBookings = bookings.map((booking) => ({
			_id: booking._id,
			bookingDate: booking.bookingDate,
			duration: booking.duration,
			location: booking.location || "",
			totalCost: booking.totalCost,
			status: booking.status,
			notes: booking.notes,
			workType: booking.workType,
			createdAt: booking.createdAt,
			serviceProvider: {
				name: booking.serviceId?.worker?.name || "N/A",
				phone: booking.serviceId?.worker?.phone || "",
				email: booking.serviceId?.worker?.email || "",
			},
		}));

		res.status(200).json({
			success: true,
			count: formattedBookings.length,
			bookings: formattedBookings,
		});
	} catch (error) {
		console.error("Error fetching worker bookings:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};


// @desc    Get farmer's tractor requirements (posted jobs)
// @route   GET /api/bookings/farmer/tractor-requirements
// @access  Private (Farmer)
exports.getFarmerTractorRequirements = async (req, res) => {
    try {
        const TractorRequirement = require("../models/TractorRequirement");
        
        const requirements = await TractorRequirement.find({
            farmer: req.user._id,
        }).sort({ createdAt: -1 });

        const formattedRequirements = requirements.map((req) => ({
            _id: req._id,
            workType: req.workType,
            landType: req.landType,
            landSize: req.landSize,
            expectedDate: req.expectedDate,
            duration: req.duration,
            location: req.location,
            maxBudget: req.maxBudget,
            urgency: req.urgency,
            status: req.status,
            notes: req.additionalNotes,
            responses: req.responses?.length || 0,
            createdAt: req.createdAt,
            type: "tractor-requirement",
        }));

        res.status(200).json({
            success: true,
            count: formattedRequirements.length,
            requirements: formattedRequirements,
        });
    } catch (error) {
        console.error("Error fetching tractor requirements:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get farmer's worker requirements (posted jobs)
// @route   GET /api/bookings/farmer/worker-requirements
// @access  Private (Farmer)
exports.getFarmerWorkerRequirements = async (req, res) => {
    try {
        const WorkerRequirement = require("../models/WorkerRequirement");
        
        const requirements = await WorkerRequirement.find({
            farmer: req.user._id,
        }).sort({ createdAt: -1 });

        const formattedRequirements = requirements.map((req) => ({
            _id: req._id,
            workType: req.workType,
            requiredAge: req.requiredAge,
            preferredGender: req.preferredGender,
            minExperience: req.minExperience,
            wagesOffered: req.wagesOffered,
            location: req.location,
            workDuration: req.workDuration,
            foodProvided: req.foodProvided,
            transportationProvided: req.transportationProvided,
            startDate: req.startDate,
            status: req.status,
            notes: req.notes,
            applicants: req.applicants?.length || 0,
            createdAt: req.createdAt,
            type: "worker-requirement",
        }));

        res.status(200).json({
            success: true,
            count: formattedRequirements.length,
            requirements: formattedRequirements,
        });
    } catch (error) {
        console.error("Error fetching worker requirements:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

