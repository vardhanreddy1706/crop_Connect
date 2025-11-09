const TractorService = require("../models/TractorService");
const User = require("../models/User"); // ← ADD THIS
const Notification = require("../models/Notification"); // ← ADD THIS
const NotificationService = require("../services/notificationService");

// @desc    Create tractor service (Enhanced with notifications)
// @route   POST /api/tractors
// @access  Private (Tractor Owner)
exports.createTractorService = async (req, res) => {
	try {
		// Validate required scheduling fields
		const { availableDate, availableTime } = req.body || {};
		if (!availableDate || !availableTime) {
			return res.status(400).json({
				success: false,
				message: "Available date and time are required",
			});
		}

		// Compute a combined datetime for backward compatibility and easy checks
		let combinedISO;
		try {
			const combined = new Date(`${availableDate}T${availableTime}`);
			combinedISO = combined.toISOString();
		} catch (e) {
			return res.status(400).json({ success: false, message: "Invalid date/time" });
		}

		// ✅ Validate working duration
		const workingDuration = parseFloat(req.body.workingDuration || 8);
		if (!workingDuration || workingDuration < 1 || workingDuration > 24) {
			return res.status(400).json({
				success: false,
				message: "Working duration must be between 1 and 24 hours",
			});
		}

		// ✅ Calculate requested time slot (start and end times)
		const requestedDateStr = new Date(availableDate).toISOString().slice(0, 10);
		const [requestedHours, requestedMinutes] = availableTime.split(':').map(Number);
		const requestedStart = new Date(`${requestedDateStr}T${availableTime}`);
		const requestedEnd = new Date(requestedStart.getTime() + workingDuration * 60 * 60 * 1000);
		
		// ✅ Find all existing services by the same owner on the same date
		const existingServices = await TractorService.find({
			owner: req.user._id,
			status: { $ne: "cancelled" }, // Exclude cancelled services
		}).lean();
		
		// ✅ Check for overlapping time slots
		for (const svc of existingServices) {
			const svcDateStr = new Date(svc.availableDate).toISOString().slice(0, 10);
			
			// Only check services on the same date
			if (svcDateStr !== requestedDateStr) continue;
			
			// Calculate existing service time slot
			const svcDuration = svc.workingDuration || 8; // Default to 8 hours if not set
			const svcStart = new Date(`${svcDateStr}T${svc.availableTime}`);
			const svcEnd = new Date(svcStart.getTime() + svcDuration * 60 * 60 * 1000);
			
			// Check if time slots overlap
			const timeOverlaps = 
				(requestedStart >= svcStart && requestedStart < svcEnd) ||
				(requestedEnd > svcStart && requestedEnd <= svcEnd) ||
				(requestedStart <= svcStart && requestedEnd >= svcEnd);
			
			if (timeOverlaps) {
				const svcEndTime = new Date(svcEnd);
				const svcEndTimeStr = svcEndTime.toLocaleTimeString("en-IN", { 
					hour: "2-digit", 
					minute: "2-digit",
					hour12: true 
				});
				return res.status(409).json({
					success: false,
					message: `The slot is already engaged. You have a service posted for ${new Date(availableDate).toLocaleDateString("en-IN")} from ${svc.availableTime} to ${svcEndTimeStr}. Please choose a different time slot or wait until after ${svcEndTimeStr}.`,
				});
			}
		}

		// ✅ Also check if there's an active booking for this time slot
		const Booking = require("../models/Booking");
		const activeBookings = await Booking.find({
			tractorOwnerId: req.user._id,
			serviceType: "tractor",
			status: { $in: ["pending", "confirmed", "in_progress"] },
		}).lean();

		for (const booking of activeBookings) {
			const bookingStart = new Date(booking.bookingDate);
			const bookingDurationHours = parseFloat(booking.duration || 8);
			const bookingEnd = new Date(bookingStart.getTime() + bookingDurationHours * 60 * 60 * 1000);

			// Check if the requested time slot overlaps with existing booking
			const timeOverlaps = 
				(requestedStart >= bookingStart && requestedStart < bookingEnd) ||
				(requestedEnd > bookingStart && requestedEnd <= bookingEnd) ||
				(requestedStart <= bookingStart && requestedEnd >= bookingEnd);
			
			if (timeOverlaps) {
				const bookingEndTimeStr = bookingEnd.toLocaleTimeString("en-IN", { 
					hour: "2-digit", 
					minute: "2-digit",
					hour12: true 
				});
				return res.status(409).json({
					success: false,
					message: `You already have a booking for this time slot. The slot is engaged until ${bookingEndTimeStr}. Please choose a different time slot or wait until after ${bookingEndTimeStr}.`,
				});
			}
		}

		const tractorService = await TractorService.create({
			...req.body,
			availableDates: [combinedISO],
			owner: req.user._id,
		});

// Email owner about service posting (best-effort)
		try {
			await NotificationService.notifyTractorServicePosted(
				req.user,
				tractorService,
				req.emailTransporter
			);

			// Notify nearby farmers (optional - can be commented out if not needed)
			
			const nearbyFarmers = await User.find({
				role: "farmer",
				"address.district": {
					$regex: req.body.location?.district || "",
					$options: "i",
				},
			}).select("_id");

			if (nearbyFarmers.length > 0) {
				const notifications = nearbyFarmers.map((farmer) => ({
					recipientId: farmer._id,
					type: "service_posted",
					title: "🚜 New Tractor Service Available",
					message: `${req.body.typeOfPlowing} service in ${req.body.location?.district} - ₹${req.body.chargePerAcre}/acre`,
					relatedUserId: req.user._id,
					data: {
						serviceType: req.body.typeOfPlowing,
						chargePerAcre: req.body.chargePerAcre,
						location: req.body.location,
					},
				}));

				await Notification.insertMany(notifications);

				// Socket.io notification
				if (req.io) {
					nearbyFarmers.forEach((farmer) => {
						req.io.to(farmer._id.toString()).emit("notification", {
							type: "service_posted",
							title: "🚜 New Tractor Service Available",
							message: `${req.body.typeOfPlowing} service nearby`,
						});
					});
				}
			}

			res.status(201).json({
				success: true,
				message: "Tractor service added successfully",
				tractorService,
				notifiedFarmers: nearbyFarmers.length,
			});
		} catch (notifError) {
			console.error("Notification error:", notifError);
			// Still return success even if notifications fail
			res.status(201).json({
				success: true,
				message: "Tractor service added successfully",
				tractorService,
			});
		}
	} catch (error) {
		console.error("Create tractor service error:", error);
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
		const { typeOfPlowing, landType, location, availability, village, district, state } = req.query;

		let query = {};

		if (typeOfPlowing) query.typeOfPlowing = typeOfPlowing;
		if (landType) query.landType = landType;
		// Back-compat single 'location' maps to district
		if (location) query["location.district"] = new RegExp(location, "i");
		if (village) query["location.village"] = new RegExp(village, "i");
		if (district) query["location.district"] = new RegExp(district, "i");
		if (state) query["location.state"] = new RegExp(state, "i");
		if (availability) query.availability = availability === "true";

		// ✅ Initial query filtering for performance (comparing farmer's address with service location)
		// Final filtering happens after population to ensure exact matching
		if (!village && !district && !state && req.user?.role === "farmer") {
			// For farmers, filter by service location (not owner's permanent address)
			if (req.user.address?.village) {
				query["location.village"] = new RegExp(`^${req.user.address.village}$`, "i");
			}
			if (req.user.address?.district) {
				query["location.district"] = new RegExp(`^${req.user.address.district}$`, "i");
			}
			if (req.user.address?.state) {
				query["location.state"] = new RegExp(`^${req.user.address.state}$`, "i");
			}
		}

		let tractorServices = await TractorService.find(query)
			.populate("owner", "name phone email address")
			.sort({ createdAt: -1 })
			.lean();

		// ✅ Location-based filtering: Compare farmer's permanent address (from registration) 
		// with the service location (posted by tractor owner when creating service)
		// Only show services where farmer's address matches the service's posted location
		if (req.user?.role === "farmer") {
			// Get farmer's permanent address from User model (entered during registration)
			const farmerVillage = req.user.address?.village?.trim().toLowerCase();
			const farmerDistrict = req.user.address?.district?.trim().toLowerCase();
			const farmerState = req.user.address?.state?.trim().toLowerCase();

			// If farmer has location details, apply location-based filtering
			if (farmerVillage || farmerDistrict || farmerState) {
				tractorServices = tractorServices.filter((service) => {
					// ✅ Get service location from TractorService model (location entered when posting service)
					// This is the location the tractor owner specified when creating the service
					// NOT the tractor owner's permanent address from their User profile
					const serviceLocation = service.location || {};
					const serviceVillage = serviceLocation.village?.trim().toLowerCase() || "";
					const serviceDistrict = serviceLocation.district?.trim().toLowerCase() || "";
					const serviceState = serviceLocation.state?.trim().toLowerCase() || "";

					// ✅ Compare farmer's permanent address (User model) with service's posted location (TractorService model)
					// Both must have matching village, district, and state
					
					// Village matching: Both must have village and they must match exactly
					if (farmerVillage && serviceVillage) {
						if (serviceVillage !== farmerVillage) {
							return false; // Different villages - hide service
						}
					} else if (farmerVillage || serviceVillage) {
						return false; // One has village, other doesn't - different locations
					}
					
					// District matching: Both must have district and they must match exactly
					if (farmerDistrict && serviceDistrict) {
						if (serviceDistrict !== farmerDistrict) {
							return false; // Different districts - hide service
						}
					} else if (farmerDistrict || serviceDistrict) {
						return false; // One has district, other doesn't - different locations
					}
					
					// State matching: Both must have state and they must match exactly
					if (farmerState && serviceState) {
						if (serviceState !== farmerState) {
							return false; // Different states - hide service
						}
					} else if (farmerState || serviceState) {
						return false; // One has state, other doesn't - different locations
					}

					// ✅ All location fields match - show the service
					return true;
				});
			}
		}

		// Ensure engagement reflects any active bookings
		const serviceIds = tractorServices.map((s) => s._id);
		const activeStatuses = ["pending", "confirmed", "in_progress"];
		const activeBookings = await require("../models/Booking").find({
			serviceId: { $in: serviceIds },
			serviceType: "tractor",
			status: { $in: activeStatuses },
		}).select("serviceId bookingDate duration").lean();
		
		// Group bookings by service ID
		const bookingsByService = {};
		activeBookings.forEach((b) => {
			const serviceIdStr = String(b.serviceId);
			if (!bookingsByService[serviceIdStr]) {
				bookingsByService[serviceIdStr] = [];
			}
			bookingsByService[serviceIdStr].push({
				start: new Date(b.bookingDate),
				durationHours: parseFloat(b.duration || 8),
			});
		});
		
		// Mark services with active bookings
		tractorServices = tractorServices.map((s) => {
			const serviceIdStr = String(s._id);
			const hasActiveBookings = bookingsByService[serviceIdStr] && bookingsByService[serviceIdStr].length > 0;
			return {
				...s,
				isBooked: hasActiveBookings,
				availability: hasActiveBookings ? false : s.availability,
				activeBookings: bookingsByService[serviceIdStr] || [],
			};
		});

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
		let tractorServices = await TractorService.find({
			owner: req.user._id,
		}).sort({ createdAt: -1 }).lean();

		// Cross-check with active bookings to mark engaged
		const serviceIds = tractorServices.map((s) => s._id);
		const activeStatuses = ["pending", "confirmed", "in_progress"];
		const activeBookings = await require("../models/Booking").find({
			serviceId: { $in: serviceIds },
			serviceType: "tractor",
			status: { $in: activeStatuses },
		}).select("serviceId").lean();
		const engaged = new Set(activeBookings.map((b) => String(b.serviceId)));
		tractorServices = tractorServices.map((s) => ({
			...s,
			isBooked: s.isBooked || engaged.has(String(s._id)),
			availability: engaged.has(String(s._id)) ? false : s.availability,
		}));

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

// @desc    Cancel tractor service
// @route   POST /api/tractors/:id/cancel
// @access  Private (Tractor Owner)
exports.cancelTractorService = async (req, res) => {
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

		tractorService.availability = false;
		tractorService.status = "cancelled";
		tractorService.cancelledAt = Date.now();
		await tractorService.save();

		res.status(200).json({
			success: true,
			message: "Tractor service cancelled successfully",
			tractorService,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
