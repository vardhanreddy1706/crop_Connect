// server/routes/orderRoutes.js

const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
	createOrder,
	createRazorpayOrder,
	getBuyerOrders,
	getSellerOrders,
	confirmOrder,
	markAsPicked,
	completeOrder,
	cancelOrder,
	updateOrderStatus,
} = require("../controllers/orderController");

// ========================================
// PROTECT ALL ROUTES
// ========================================
router.use(protect);

// ========================================
// PAYMENT ROUTES
// ========================================
// @route POST /api/orders/create-razorpay-order
// @desc Create Razorpay payment order
// @access Private
router.post("/create-razorpay-order", createRazorpayOrder);

// ========================================
// ORDER MANAGEMENT
// ========================================
// @route POST /api/orders/create
// @desc Create new order
// @access Private (Buyer)
router.post("/create", createOrder);

// ========================================
// GET ORDERS
// ========================================
// @route GET /api/orders/buyer
// @desc Get buyer's orders
// @access Private (Buyer)
router.get("/buyer", getBuyerOrders);

// @route GET /api/orders/seller
// @desc Get farmer's orders (crops sold)
// @access Private (Farmer)
router.get("/seller", getSellerOrders);

// ========================================
// FARMER ACTIONS
// ========================================
// @route PUT /api/orders/:orderId/confirm
// @desc Farmer confirms order
// @access Private (Farmer)
router.put("/:orderId/confirm", confirmOrder);

// @route PUT /api/orders/:orderId/picked
// @desc Farmer marks order as picked up
// @access Private (Farmer)
router.put("/:orderId/picked", markAsPicked);

// ========================================
// BUYER ACTIONS
// ========================================
// @route PUT /api/orders/:orderId/complete
// @desc Buyer marks order as complete
// @access Private (Buyer)
router.put("/:orderId/complete", completeOrder);

// ========================================
// CANCEL ORDER (Both Buyer & Farmer)
// ========================================
// @route PUT /api/orders/:orderId/cancel
// @desc Cancel order
// @access Private (Buyer or Farmer)
router.put("/:orderId/cancel", cancelOrder);

// ========================================
// LEGACY ROUTE (For compatibility)
// ========================================
// @route PUT /api/orders/:id/status
// @desc Update order status (generic)
// @access Private
router.put("/:id/status", updateOrderStatus);

module.exports = router;
