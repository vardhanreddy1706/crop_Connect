const express = require("express");
const router = express.Router();
const {
	createTractorRequirement,
	getAllTractorRequirements,
	getTractorRequirementById,
	getMyTractorRequirements,
	updateTractorRequirement,
	deleteTractorRequirement,
	respondToRequirement,
	acceptRequirement,
	completeWork,
} = require("../controllers/tractorRequirementController");
const { protect, authorize } = require("../middlewares/authMiddleware");

router
	.route("/")
	.get(protect, getAllTractorRequirements)
	.post(protect, authorize("farmer"), createTractorRequirement);

router.get(
	"/my-requirements",
	protect,
	authorize("farmer"),
	getMyTractorRequirements
);

router.post(
	"/:id/respond",
	protect,
	authorize("tractor_owner"),
	respondToRequirement
);
router.post(
	"/:id/accept",
	protect,
	authorize("tractor_owner"),
	acceptRequirement
);
router.post("/:id/complete", protect, authorize("tractor_owner"), completeWork);

router
	.route("/:id")
	.get(protect, getTractorRequirementById)
	.put(protect, authorize("farmer"), updateTractorRequirement)
	.delete(protect, authorize("farmer"), deleteTractorRequirement);

module.exports = router;
