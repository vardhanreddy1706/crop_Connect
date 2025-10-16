const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
	createRazorpayOrder,
	createOrder,
	getBuyerOrders,
	getSellerOrders,
	updateOrderStatus,
	cancelOrder,
} = require("../controllers/orderController");

// Create Razorpay order (before actual order creation)
router.post(
	"/create-razorpay-order",
	protect,
	authorize("buyer"),
	createRazorpayOrder
);

// Create order with vehicle details
router.post("/create", protect, authorize("buyer"), createOrder);

// Get orders
router.get("/buyer", protect, authorize("buyer"), getBuyerOrders);
router.get("/seller", protect, authorize("farmer"), getSellerOrders);

// Update order status
router.put("/:id/status", protect, updateOrderStatus);

// Cancel order
router.put("/:id/cancel", protect, authorize("buyer"), cancelOrder);

module.exports = router;
