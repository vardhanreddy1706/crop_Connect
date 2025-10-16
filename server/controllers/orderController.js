const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Crop = require("../models/Crop");
const Notification = require("../models/Notification");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay
const razorpay = new Razorpay({
	key_id: process.env.RAZORPAY_KEY_ID,
	key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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
// ✅ FIXED: Create order with correct payment method handling
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

        console.log("Creating order with payment method:", paymentMethod); // Debug

        // Get seller from first crop
        const Crop = require("../models/Crop");
        const firstCrop = await Crop.findById(items[0].crop).select("seller");

        if (!firstCrop || !firstCrop.seller) {
            return res.status(404).json({
                success: false,
                message: "Seller information not found",
            });
        }

        // ✅ Determine payment status based on method
        let paymentStatus = "pending";
        if (paymentMethod === "razorpay" && razorpayPaymentId) {
            paymentStatus = "completed";
        } else if (paymentMethod === "payAfterDelivery") {
            paymentStatus = "pending"; // Will be paid on delivery
        }

        // Create order
        const order = new Order({
            buyer: req.user._id || req.user.id,
            seller: firstCrop.seller,
            items: items.map(item => ({
                crop: item.crop,
                quantity: item.quantity,
                pricePerUnit: item.pricePerUnit,
                total: item.total,
            })),
            totalAmount,
            paymentMethod: paymentMethod || "razorpay", // ✅ Use camelCase
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
        const Cart = require("../models/Cart");
        await Cart.findOneAndUpdate(
            { user: req.user._id || req.user.id },
            { items: [] }
        );

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

// @desc Get buyer's orders
// @route GET /api/orders/buyer
// @access Private (Buyer)
exports.getBuyerOrders = async (req, res) => {
	try {
		const orders = await Order.find({ buyer: req.user._id })
			.populate("seller", "name phone email")
			.populate("items.crop")
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

// @desc Get seller's orders
// @route GET /api/orders/seller
// @access Private (Farmer)
exports.getSellerOrders = async (req, res) => {
	try {
		const orders = await Order.find({ seller: req.user._id })
			.populate("buyer", "name phone email")
			.populate("items.crop")
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

// @desc Update order status
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
		order.statusTimestamps[status] = new Date();
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

// @desc Cancel order
// @route PUT /api/orders/:id/cancel
// @access Private (Buyer)
exports.cancelOrder = async (req, res) => {
	try {
		const { reason } = req.body;
		const order = await Order.findById(req.params.id).populate("items.crop");

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		if (order.buyer.toString() !== req.user._id.toString()) {
			return res.status(403).json({
				success: false,
				message: "Not authorized",
			});
		}

		if (order.status === "picked" || order.status === "completed") {
			return res.status(400).json({
				success: false,
				message: "Cannot cancel order after pickup",
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
		order.statusTimestamps.cancelled = new Date();
		await order.save();

		// Notify seller
		await Notification.create({
			recipientId: order.seller,
			type: "order_cancelled",
			title: "❌ Order Cancelled",
			message: `${req.user.name} cancelled order #${order._id
				.toString()
				.substring(0, 8)}. Reason: ${reason || "Not specified"}`,
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

module.exports = exports;
