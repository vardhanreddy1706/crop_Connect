const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
	createWorkerRequirement,
	getAllWorkerRequirements,
	getMyWorkerRequirements,
	deleteWorkerRequirement,
	applyForRequirement,
	getWorkerApplications, // ✅ NEW
} = require("../controllers/WorkerRequirementController");

router.post("/", protect, createWorkerRequirement);
router.get("/", protect, getAllWorkerRequirements);
router.get("/my-requirements", protect, getMyWorkerRequirements);
router.get("/applications", protect, getWorkerApplications); // ✅ NEW - Must be before /:id
router.delete("/:id", protect, deleteWorkerRequirement);
router.post("/:id/apply", protect, applyForRequirement);

module.exports = router;
