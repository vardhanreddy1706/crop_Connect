const express = require("express");
const router = express.Router();
const {
	createBooking,
	getMyBookings,
	getServiceBookings,
	updateBookingStatus,
	cancelBooking,
} = require("../controllers/bookingController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router.post("/", protect, authorize("farmer"), createBooking);
router.get("/my-bookings", protect, authorize("farmer"), getMyBookings);
router.get(
	"/service-bookings",
	protect,
	authorize("tractor_owner", "worker"),
	getServiceBookings
);
router.put("/:id/status", protect, updateBookingStatus);
router.delete("/:id", protect, cancelBooking);

module.exports = router;
