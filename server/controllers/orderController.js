// server/controllers/orderController.js

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Crop = require("../models/Crop");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Razorpay = require("razorpay");
const NotificationService = require("../services/notificationService");
const crypto = require("crypto");

// Initialize Razorpay
const razorpay = new Razorpay({
	key_id: process.env.RAZORPAY_KEY_ID,
	key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ========================================
// RAZORPAY PAYMENT
// ========================================

// @desc Create Razorpay order
// @route POST /api/orders/create-razorpay-order
// @access Private (Buyer)
exports.createRazorpayOrder = async (req, res) => {
	try {
		const { amount, currency = "INR" } = req.body;

		const options = {
			amount: amount * 100, // Convert to paise
			currency,
			receipt: `order_${Date.now()}`,
		};

		const razorpayOrder = await razorpay.orders.create(options);

		res.status(200).json({
			success: true,
			order: razorpayOrder,
		});
	} catch (error) {
		console.error("Razorpay order creation error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// ========================================
// CREATE ORDER
// ========================================

// @desc Create order with payment method handling
// @route POST /api/orders/create
// @access Private (Buyer)
exports.createOrder = async (req, res) => {
	try {
		const {
			items,
			totalAmount,
			paymentMethod,
			vehicleDetails,
			pickupSchedule,
			deliveryAddress,
			razorpayOrderId,
			razorpayPaymentId,
			razorpaySignature,
		} = req.body;

		// Validate required fields
		if (!items || items.length === 0) {
			return res.status(400).json({
				success: false,
				message: "No items in order",
			});
		}

		if (!deliveryAddress || !deliveryAddress.fullAddress) {
			return res.status(400).json({
				success: false,
				message: "Delivery address is required",
			});
		}

		console.log("Creating order with payment method:", paymentMethod);

		// Get seller from first crop
		const firstCrop = await Crop.findById(items[0].crop).select("seller");

		if (!firstCrop || !firstCrop.seller) {
			return res.status(404).json({
				success: false,
				message: "Seller information not found",
			});
		}

		// Determine payment status based on method
		let paymentStatus = "pending";
		if (paymentMethod === "razorpay" && razorpayPaymentId) {
			paymentStatus = "completed";
		} else if (paymentMethod === "payAfterDelivery") {
			paymentStatus = "pending";
		}

		// Create order
		const order = new Order({
			buyer: req.user._id || req.user.id,
			seller: firstCrop.seller,
			items: items.map((item) => ({
				crop: item.crop,
				quantity: item.quantity,
				pricePerUnit: item.pricePerUnit,
				total: item.total,
			})),
			totalAmount,
			paymentMethod: paymentMethod || "razorpay",
			paymentStatus,
			vehicleDetails,
			pickupSchedule,
			deliveryAddress: {
				village: deliveryAddress.village || "",
				district: deliveryAddress.district || "",
				state: deliveryAddress.state || "",
				pincode: deliveryAddress.pincode || "",
				fullAddress: deliveryAddress.fullAddress,
			},
			razorpayOrderId,
			razorpayPaymentId,
			razorpaySignature,
		});

		await order.save();

		console.log("Order created successfully:", order._id);

		// Update crop quantities
		for (const item of items) {
			await Crop.findByIdAndUpdate(item.crop, {
				$inc: { quantity: -item.quantity },
			});
		}

		// Clear buyer's cart
		await Cart.findOneAndUpdate(
			{ user: req.user._id || req.user.id },
			{ items: [] }
		);

// Notification + emails handled below

// Email both parties (best-effort)
		try {
			const seller = await User.findById(firstCrop.seller).select("email name");
			await NotificationService.notifyOrderCreatedForSeller(
				{ _id: firstCrop.seller, email: seller?.email, name: seller?.name },
				order,
				req.emailTransporter
			);
			await NotificationService.notifyOrderCreatedForBuyer(
				req.user,
				order,
				req.emailTransporter
			);
		} catch (e) {
			console.error("Email notify (order create) error:", e.message);
		}

		return res.status(201).json({
			success: true,
			message: "Order created successfully",
			order,
		});
	} catch (error) {
		console.error("Create order error:", error);
		return res.status(500).json({
			success: false,
			message: error.message || "Failed to create order",
		});
	}
};

// ========================================
// GET ORDERS
// ========================================

// @desc Get buyer's orders
// @route GET /api/orders/buyer
// @access Private (Buyer)
exports.getBuyerOrders = async (req, res) => {
	try {
		const orders = await Order.find({ buyer: req.user._id })
			.populate({
				path: "items.crop",
				select: "cropName variety unit images",
			})
			.populate("seller", "name phone email address")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			orders,
		});
	} catch (error) {
		console.error("Get buyer orders error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// @desc Get seller's orders (Farmer's crop sales)
// @route GET /api/orders/seller
// @access Private (Farmer)
exports.getSellerOrders = async (req, res) => {
	try {
		const orders = await Order.find({ seller: req.user._id })
			.populate({
				path: "items.crop",
				select: "cropName variety unit images",
			})
			.populate("buyer", "name phone email village district state")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			orders,
		});
	} catch (error) {
		console.error("Get seller orders error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// ========================================
// FARMER ACTIONS (New Features)
// ========================================

// @desc Farmer confirms order
// @route PUT /api/orders/:orderId/confirm
// @access Private (Farmer)
exports.confirmOrder = async (req, res) => {
	try {
		const { orderId } = req.params;

		const order = await Order.findById(orderId);

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		// Verify seller (defensive)
		if (!order.seller || !req.user?._id || order.seller.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized",
			});
		}

		// Idempotent / permissive confirm
		if (order.status === "confirmed") {
			return res.status(200).json({ success: true, message: "Order already confirmed", order });
		}
		// If already picked or completed, treat as no-op success for idempotency
		if (order.status === "picked" || order.status === "completed") {
			return res.status(200).json({ success: true, message: `Order already ${order.status}` , order });
		}
		if (order.status === "cancelled") {
			return res.status(400).json({ success: false, message: `Order is ${order.status} and cannot be confirmed` });
		}

		// For any other state (including pending), set to confirmed
		order.status = "confirmed";
		await order.save();

		// Notify buyer (do not fail request if notifications break)
		try {
			await Notification.create({
				recipientId: order.buyer,
				type: "order_confirmed",
				title: "✅ Order Confirmed!",
				message: `Your order #${order._id
					.toString()
					.substring(0, 8)} has been confirmed by the farmer`,
				relatedUserId: req.user._id,
				data: {
					orderId: order._id,
				},
			});
		} catch (notifErr) {
			console.error("Notification error (confirmOrder):", notifErr);
		}

		return res.status(200).json({
			success: true,
			message: "Order confirmed successfully",
			order,
		});
	} catch (error) {
		console.error("Confirm order error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to confirm order",
		});
	}
};

// @desc Farmer marks order as picked up
// @route PUT /api/orders/:orderId/picked
// @access Private (Farmer)
exports.markAsPicked = async (req, res) => {
	try {
		const { orderId } = req.params;

		const order = await Order.findById(orderId);

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		// Verify seller (defensive)
		if (!order.seller || !req.user?._id || order.seller.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized",
			});
		}

		// Idempotent behaviors
		if (order.status === "picked") {
			return res.status(200).json({ success: true, message: "Order already picked", order });
		}
		if (order.status === "completed") {
			return res.status(200).json({ success: true, message: "Order already completed", order });
		}
		if (order.status === "cancelled") {
			return res.status(400).json({ success: false, message: "Cancelled order cannot be picked" });
		}
		if (order.status !== "confirmed") {
			return res.status(400).json({
				success: false,
				message: "Order must be confirmed first",
			});
		}

		order.status = "picked";
		order.pickedUpAt = new Date();
		await order.save();

		// Notify buyer (do not fail request if notifications break)
		try {
			await Notification.create({
				recipientId: order.buyer,
				type: "order_picked",
				title: "🚚 Order Picked Up!",
				message: `Your order #${order._id
					.toString()
					.substring(0, 8)} has been picked up from the farm`,
				relatedUserId: req.user._id,
				data: {
					orderId: order._id,
				},
			});
		} catch (notifErr) {
			console.error("Notification error (markAsPicked):", notifErr);
		}

		return res.status(200).json({
			success: true,
			message: "Order marked as picked",
			order,
		});
	} catch (error) {
		console.error("Mark as picked error:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to update order",
		});
	}
};

// ========================================
// BUYER ACTIONS
// ========================================
exports.completeOrder = async (req, res) => {
	try {
		const order = await Order.findById(req.params.orderId);
		if (!order)
			return res
				.status(404)
				.json({ success: false, message: "Order not found" });
		if (order.buyer.toString() !== req.user._id.toString())
			return res
				.status(403)
				.json({ success: false, message: "Not authorized" });
		if (order.status !== "picked")
			return res
				.status(400)
				.json({ success: false, message: "Order must be picked first" });

		order.status = "completed";
		order.completedAt = new Date();
		if (order.paymentMethod === "payAfterDelivery") {
			order.paymentStatus = "completed";
		}

		await order.save();

		try {
			await Notification.create({
				recipientId: order.seller,
				type: "order_completed",
				title: "✨ Order Completed!",
				message: `Order #${order._id
					.toString()
					.slice(0, 8)} marked completed by buyer`,
				relatedUserId: req.user._id,
				data: { orderId: order._id },
			});
		} catch (notifErr) {
			console.error("Notification error:", notifErr);
			// don’t fail the request just because notifications broke
		}

		return res.json({
			success: true,
			message: "Order completed successfully",
			order,
		});
	} catch (err) {
		console.error("Complete order error:", err);
		return res
			.status(500)
			.json({ success: false, message: "Server error completing order" });
	}
};

// ========================================
// CANCEL ORDER
// ========================================

// @desc Cancel order
// @route PUT /api/orders/:orderId/cancel
// @access Private (Buyer or Farmer)
exports.cancelOrder = async (req, res) => {
	try {
		const { orderId } = req.params;
		const { reason } = req.body;

		const order = await Order.findById(orderId).populate("items.crop");

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		// Verify buyer or seller
		const userId = req.user._id.toString();
		const isBuyer = order.buyer.toString() === userId;
		const isSeller = order.seller.toString() === userId;

		if (!isBuyer && !isSeller) {
			return res.status(403).json({
				success: false,
				message: "Not authorized",
			});
		}

		if (order.status === "completed" || order.status === "cancelled") {
			return res.status(400).json({
				success: false,
				message: "Order cannot be cancelled",
			});
		}

		// Restore crop quantities
		for (const item of order.items) {
			await Crop.findByIdAndUpdate(item.crop._id, {
				$inc: { quantity: item.quantity },
			});
		}

		order.status = "cancelled";
		order.cancellationReason = reason;
		order.cancelledBy = userId;
		order.cancelledAt = new Date();
		await order.save();

		// Notify the other party
		const notifyId = isBuyer ? order.seller : order.buyer;
		await Notification.create({
			recipientId: notifyId,
			type: "order_cancelled",
			title: "❌ Order Cancelled",
			message: `Order #${order._id
				.toString()
				.substring(0, 8)} has been cancelled. Reason: ${
				reason || "Not specified"
			}`,
			relatedUserId: req.user._id,
			data: {
				orderId: order._id,
				reason,
			},
		});

		res.status(200).json({
			success: true,
			message: "Order cancelled successfully",
			order,
		});
	} catch (error) {
		console.error("Cancel order error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// ========================================
// LEGACY ENDPOINTS (Keep for compatibility)
// ========================================

// @desc Update order status (Generic)
// @route PUT /api/orders/:id/status
// @access Private
exports.updateOrderStatus = async (req, res) => {
	try {
		const { status } = req.body;
		const order = await Order.findById(req.params.id);

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		// Authorization check
		const isBuyer = order.buyer.toString() === req.user._id.toString();
		const isSeller = order.seller.toString() === req.user._id.toString();

		if (!isBuyer && !isSeller) {
			return res.status(403).json({
				success: false,
				message: "Not authorized",
			});
		}

		// Update status
		order.status = status;
		await order.save();

		// Notify relevant party
		const notifyId = isBuyer ? order.seller : order.buyer;
		const statusMessages = {
			confirmed: "✅ Order Confirmed!",
			picked: "🚚 Order Picked Up!",
			completed: "✨ Order Completed!",
			cancelled: "❌ Order Cancelled",
		};

		await Notification.create({
			recipientId: notifyId,
			type: "order_status_update",
			title: statusMessages[status] || "Order Status Updated",
			message: `Order #${order._id
				.toString()
				.substring(0, 8)} is now ${status}`,
			relatedUserId: req.user._id,
			data: {
				orderId: order._id,
				status,
			},
		});

		res.status(200).json({
			success: true,
			message: "Order status updated",
			order,
		});
	} catch (error) {
		console.error("Update order status error:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

module.exports = exports;
