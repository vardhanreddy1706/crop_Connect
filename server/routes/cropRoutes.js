const express = require("express");
const router = express.Router();
const {
	createCrop,
	getAllCrops,
	getCropById,
	updateCrop,
	deleteCrop,
	getMyCrops,
} = require("../controllers/cropController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router
	.route("/")
	.get(getAllCrops)
	.post(protect, authorize("farmer"), createCrop);

router.get("/my-crops", protect, authorize("farmer"), getMyCrops);

router
	.route("/:id")
	.get(getCropById)
	.put(protect, authorize("farmer"), updateCrop)
	.delete(protect, authorize("farmer"), deleteCrop);

module.exports = router;
