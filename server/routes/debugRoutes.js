const router = require("express").Router();
const Booking = require("../models/Booking");

// DELETE bookings without tractorOwnerId
router.delete("/fix-bookings", async (req, res) => {
	try {
		const result = await Booking.deleteMany({
			$or: [{ tractorOwnerId: { $exists: false } }, { tractorOwnerId: null }],
		});

		res.json({
			success: true,
			message: `Deleted ${result.deletedCount} bad bookings`,
			deletedCount: result.deletedCount,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
});

module.exports = router;
