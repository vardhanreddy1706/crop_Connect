const Booking = require("../models/Booking");
const TractorService = require("../models/tractorService");
const WorkerService = require("../models/workerService");

// @desc    Create booking
// @route   POST /api/bookings
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
