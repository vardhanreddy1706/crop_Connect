const express = require("express");
const router = express.Router();
const {
	postWorkerAvailability,
	getAvailableWorkers,
	getMyWorkerPosts,
	updateWorkerAvailability,
	deleteWorkerAvailability,
} = require("../controllers/workerController");
const { protect } = require("../middlewares/authMiddleware");

// Worker posts availability
router.post("/post-availability", protect, postWorkerAvailability);

// Get all available workers (for farmers)
router.get("/available", getAvailableWorkers);

// Get worker's own posts
router.get("/my-posts", protect, getMyWorkerPosts);

// Update worker availability
router.put("/availability/:id", protect, updateWorkerAvailability);

// Delete worker availability
router.delete("/availability/:id", protect, deleteWorkerAvailability);

module.exports = router;
