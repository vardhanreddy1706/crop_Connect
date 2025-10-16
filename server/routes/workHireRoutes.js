const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
	createHireRequest,
	getWorkerHireRequests,
	getFarmerHireRequests,
	acceptWorkerApplication,
	rejectWorkerApplication,
	workerAcceptHireRequest,
	workerRejectHireRequest,
	farmerHiresWorker, // ✅ ADD THIS (it's an alias)
} = require("../controllers/WorkerHireController");

// ==========================================
// FARMER ROUTES - Accept/Reject Applications
// ==========================================
router.post(
	"/:id/farmer-accept",
	protect,
	authorize("farmer"),
	acceptWorkerApplication
);
router.post(
	"/:id/farmer-reject",
	protect,
	authorize("farmer"),
	rejectWorkerApplication
);

// Get farmer's hire requests
router.get(
	"/farmer-requests",
	protect,
	authorize("farmer"),
	getFarmerHireRequests
);

// Create hire request (farmer hires worker from Browse Workers)
router.post("/create", protect, authorize("farmer"), createHireRequest);

// ==========================================
// WORKER ROUTES - Accept/Reject Hire Requests
// ==========================================
router.post(
	"/:id/worker-accept",
	protect,
	authorize("worker"),
	workerAcceptHireRequest
);
router.post(
	"/:id/worker-reject",
	protect,
	authorize("worker"),
	workerRejectHireRequest
);

// Get worker's hire requests
router.get(
	"/worker-requests",
	protect,
	authorize("worker"),
	getWorkerHireRequests
);

router.post("/hire-worker", protect, authorize("farmer"), farmerHiresWorker);



module.exports = router;
