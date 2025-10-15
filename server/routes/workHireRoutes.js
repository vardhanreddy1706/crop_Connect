const express = require("express");
const router = express.Router();
const {
	farmerHiresWorker,
	workerAcceptHire,
	workerRejectHire,
	workerAppliesForJob,
	farmerAcceptApplication,
	farmerRejectApplication,
	getWorkerHireRequests,
	getFarmerHireRequests,
	getWorkerApplications,
} = require("../controllers/WorkerHireController");
const { protect, authorize } = require("../middlewares/authMiddleware");

// ==========================================
// SCENARIO 1: FARMER HIRES WORKER
// ==========================================
router.post("/hire-worker", protect, authorize("farmer"), farmerHiresWorker);
router.post(
	"/:id/worker-accept",
	protect,
	authorize("worker"),
	workerAcceptHire
);
router.post(
	"/:id/worker-reject",
	protect,
	authorize("worker"),
	workerRejectHire
);

// ==========================================
// SCENARIO 2: WORKER APPLIES FOR JOB
// ==========================================
router.post(
	"/apply-for-job",
	protect,
	authorize("worker"),
	workerAppliesForJob
);
router.post(
	"/:id/farmer-accept",
	protect,
	authorize("farmer"),
	farmerAcceptApplication
);
router.post(
	"/:id/farmer-reject",
	protect,
	authorize("farmer"),
	farmerRejectApplication
);

// ==========================================
// COMMON: GET REQUESTS
// ==========================================
router.get(
	"/worker-requests",
	protect,
	authorize("worker"),
	getWorkerHireRequests
);
router.get(
	"/farmer-requests",
	protect,
	authorize("farmer"),
	getFarmerHireRequests
);
router.get(
	"/worker-applications",
	protect,
	getWorkerApplications
);


module.exports = router;
