// server/routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
	getMyOrders,
	createOrder,
	cancelOrder,
} = require("../controllers/orderController");

router.use(protect);

router.get("/my-orders", getMyOrders);
router.post("/create", createOrder);
router.put("/:orderId/cancel", cancelOrder);

module.exports = router;
