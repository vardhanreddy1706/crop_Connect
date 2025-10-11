const express = require("express");
const router = express.Router();
const {
	createTractorService,
	getAllTractorServices,
	getTractorServiceById,
	updateTractorService,
	deleteTractorService,
	getMyTractorServices,
} = require("../controllers/tractorController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router
	.route("/")
	.get(getAllTractorServices)
	.post(protect, authorize("tractor_owner"), createTractorService);

router.get(
	"/my-services",
	protect,
	authorize("tractor_owner"),
	getMyTractorServices
);

router
	.route("/:id")
	.get(getTractorServiceById)
	.put(protect, authorize("tractor_owner"), updateTractorService)
	.delete(protect, authorize("tractor_owner"), deleteTractorService);

module.exports = router;
