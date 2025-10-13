const express = require("express");
const router = express.Router();
const {
	createWorkerRequirement,
	getAllWorkerRequirements,
	getMyRequirements,
	applyForRequirement,
	updateWorkerRequirement,
	deleteWorkerRequirement,
} = require("../controllers/WorkerRequirementController");
const { protect } = require("../middlewares/authMiddleware");

// Farmer creates requirement
router.post("/", protect, createWorkerRequirement);

// Get all requirements (public/workers can see)
router.get("/", getAllWorkerRequirements);

// Get farmer's own requirements
router.get("/my-requirements", protect, getMyRequirements);

// Worker applies to requirement
router.post("/:id/apply", protect, applyForRequirement);

// Update requirement
router.put("/:id", protect, updateWorkerRequirement);

// Delete requirement
router.delete("/:id", protect, deleteWorkerRequirement);

module.exports = router;
