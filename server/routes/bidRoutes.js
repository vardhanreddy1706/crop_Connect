const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
	placeBid,
	getFarmerBids,
	getTractorOwnerBids,
	acceptBid,
	rejectBid,
} = require("../controllers/bidController");

router.post("/", protect, authorize("tractor_owner"), placeBid);
router.get("/farmer", protect, authorize("farmer"), getFarmerBids);
router.get(
	"/tractor-owner",
	protect,
	authorize("tractor_owner"),
	getTractorOwnerBids
);
router.post("/:id/accept", protect, authorize("farmer"), acceptBid);
router.post("/:id/reject", protect, authorize("farmer"), rejectBid);

module.exports = router;
