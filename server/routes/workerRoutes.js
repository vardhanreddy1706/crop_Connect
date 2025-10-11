const express = require("express");
const router = express.Router();
const {
	createWorkerService,
	getAllWorkerServices,
	getWorkerServiceById,
	updateWorkerService,
	deleteWorkerService,
	getMyWorkerServices,
} = require("../controllers/workerController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router
	.route("/")
	.get(getAllWorkerServices)
	.post(protect, authorize("worker"), createWorkerService);

router.get("/my-services", protect, authorize("worker"), getMyWorkerServices);

router
	.route("/:id")
	.get(getWorkerServiceById)
	.put(protect, authorize("worker"), updateWorkerService)
	.delete(protect, authorize("worker"), deleteWorkerService);

module.exports = router;
