const express = require("express");
const router = express.Router();
const {
	createBooking,
	getMyBookings,
	getServiceBookings,
	updateBookingStatus,
	cancelBooking,
	getFarmerTractorBookings,
	getFarmerWorkerBookings,
	getFarmerTractorRequirements, 
	getFarmerWorkerRequirements, 
} = require("../controllers/bookingController");

const { protect, authorize } = require("../middlewares/authMiddleware");


router.get(
	"/farmer/tractor-requirements",
	protect,
	authorize("farmer"),
	getFarmerTractorRequirements
);

router.get(
	"/farmer/worker-requirements",
	protect,
	authorize("farmer"),
	getFarmerWorkerRequirements
);
// Farmer-specific booking routes (NEW)
router.get(
	"/farmer/tractors",
	protect,
	authorize("farmer"),
	getFarmerTractorBookings
);

router.get(
	"/farmer/workers",
	protect,
	authorize("farmer"),
	getFarmerWorkerBookings
);

// Create booking
router.post("/create", protect, authorize("farmer"), createBooking);

// Get my bookings (all types)
router.get("/my-bookings", protect, authorize("farmer"), getMyBookings);

// Get service bookings (for service providers)
router.get(
	"/service-bookings",
	protect,
	authorize("tractor_owner", "worker"),
	getServiceBookings
);

// Update booking status
router.put("/:id/status", protect, updateBookingStatus);

// Cancel booking
router.delete("/:id", protect, cancelBooking);

module.exports = router;
