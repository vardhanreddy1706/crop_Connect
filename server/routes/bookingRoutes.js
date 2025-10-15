const router = require("express").Router();
const { protect, authorize } = require("../middlewares/authMiddleware");

const {
	getFarmerTractorBookings,
	getFarmerWorkerBookings,
	getFarmerTractorRequirements,
	getFarmerWorkerRequirements,
	getAllFarmerBookings,
	getTractorOwnerBookings,
	createRazorpayOrder,
	verifyPayment,
	choosePayAfterWork,
	completeWork,
	cancelBooking,
	createBooking,
	completeBooking,
	getWorkerBookings,
} = require("../controllers/bookingController");

// BOOKING CREATION
router.post("/create", protect, createBooking);

// FARMER ROUTES
router.get("/farmer/tractors", protect, getFarmerTractorBookings);
router.get("/farmer/workers", protect, getFarmerWorkerBookings);
router.get(
	"/farmer/tractor-requirements",
	protect,
	getFarmerTractorRequirements
);
router.get("/farmer/worker-requirements", protect, getFarmerWorkerRequirements);
router.get("/farmer", protect, getAllFarmerBookings);

// TRACTOR OWNER ROUTES
router.get(
	"/tractor-owner",
	protect,
	authorize("tractor_owner"),
	getTractorOwnerBookings
);

// WORKER ROUTES
router.get("/worker", protect, authorize("worker"), getWorkerBookings);

// ✅ FIXED: WORK COMPLETION - Remove authorization, handle in controller
router.post("/:id/complete", protect, completeWork);
router.post("/:id/complete-work", protect, completeWork);

// PAYMENT ROUTES
router.post("/:id/create-order", protect, createRazorpayOrder);
router.post("/:id/verify-payment", protect, verifyPayment);
router.post("/:id/pay-after-work", protect, choosePayAfterWork);

// BOOKING MANAGEMENT
router.post("/:id/cancel", protect, cancelBooking);

module.exports = router;
