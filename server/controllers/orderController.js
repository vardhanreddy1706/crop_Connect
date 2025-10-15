// server/controllers/orderController.js
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Crop = require("../models/Crop");
const User = require("../models/User");
const createNotification = require("../middlewares/createNotification");

// @desc    Get user's orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
	try {
		const orders = await Order.find({ user: req.user._id })
			.sort({ createdAt: -1 })
			.lean();

		// Transform orders to match frontend
		const transformedOrders = orders.map((order) => ({
			_id: order._id,
			items: order.items.map((item) => ({
				name: item.name,
				quantity: item.quantity,
				price: item.price,
			})),
			totalAmount: order.totalAmount,
			status: order.status,
			paymentStatus: order.paymentStatus,
			createdAt: order.createdAt,
		}));

		res.status(200).json({
			success: true,
			orders: transformedOrders,
		});
	} catch (error) {
		console.error("Get orders error:", error);
		res.status(500).json({
			success: false,
			message: "Server Error",
		});
	}
};

// @desc    Cancel order
// @route   PUT /api/orders/:orderId/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
	// Start a session for transaction
	const session = await Order.startSession();

	try {
		await session.withTransaction(async () => {
			const order = await Order.findOne({
				_id: req.params.orderId,
				user: req.user._id,
			}).session(session);

			if (!order) {
				throw new Error("Order not found");
			}

			// Check if order can be cancelled
			if (!["pending", "processing"].includes(order.status)) {
				throw new Error("Order cannot be cancelled in current status");
			}

			// Get user document
			const user = await User.findById(req.user._id).session(session);
			if (!user) {
				throw new Error("User not found");
			}

			// Only update totalSpent if the order is not already cancelled
			if (order.status !== "cancelled") {
				user.totalSpent = Math.max(
					0,
					(user.totalSpent || 0) - order.totalAmount
				);
				await user.save({ session });
			}

			// Update order status
			order.status = "cancelled";
			await order.save({ session });

			// Create notification
			try {
				// Pass the notification creation as a promise to be handled within the transaction
				await Promise.resolve().then(async () => {
					await createNotification({
						userId: order.user,
						message: `Order #${order._id} has been cancelled`,
						type: "order_cancelled",
						orderId: order._id,
					});
				});
			} catch (notifError) {
				console.error("Notification error:", notifError);
				// Don't throw the error, just log it
			}
		});

		// Send success response after transaction completes
		return res.json({
			success: true,
			message: "Order cancelled successfully",
		});
	} catch (error) {
		console.error("Cancel order error:", error);
		return res
			.status(error.message.includes("cannot be cancelled") ? 400 : 500)
			.json({
				success: false,
				message: error.message || "Server Error",
			});
	} finally {
		await session.endSession();
	}
};

// @desc    Create order
// @route   POST /api/orders/create
// @access  Private
exports.createOrder = async (req, res) => {
	try {
		const { items, orderType = "crop", totalAmount } = req.body;

		if (!items || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({
				success: false,
				message: "No items provided for order",
			});
		}

		// Validate items format
		const validItems = items.map((item) => ({
			itemId: item.itemId,
			name: item.name,
			quantity: item.quantity,
			price: item.price,
		}));

		// Verify total amount
		const calculatedTotal = validItems.reduce(
			(sum, item) => sum + item.price,
			0
		);
		if (totalAmount !== calculatedTotal) {
			return res.status(400).json({
				success: false,
				message: "Total amount mismatch",
			});
		}
		const checkoutCart = async () => {
			if (cart.length === 0) {
				toast.error("Cart is empty");
				return;
			}
			try {
				// Build items and total from cart flat shape
				const items = cart.map((item) => ({
					itemId: item.itemId,
					name: item.name,
					quantity: item.quantity,
					price: item.price * item.quantity,
				}));
				const totalAmount = items.reduce((sum, i) => sum + i.price, 0);

				const res = await api.post("/orders/create", {
					orderType: "crop",
					items,
					totalAmount,
				});

				toast.success("🎉 Order placed successfully! Thanks for buying.");
				setCart([]);
				localStorage.setItem("cartCount", "0");
				await fetchDashboardData();
				setActiveTab("orders");
			} catch (error) {
				toast.error(error.response?.data?.message || "Failed to place order");
			}
		};

		// Create order with validated data
		const order = await Order.create({
			user: req.user._id,
			orderType,
			items,
			totalAmount,
			shippingAddress: {
				village: "Default Village",
				district: "Default District",
				state: "Default State",
				pincode: "000000",
				contactNumber: req.user.phone || "9999999999",
			},
		});

		// Clear cart after successful order
		await Cart.findOneAndDelete({ user: req.user._id });

		res.status(201).json({
			success: true,
			message: "Order created successfully",
			order: {
				_id: order._id,
				items: order.items,
				totalAmount: order.totalAmount,
				status: order.status,
				createdAt: order.createdAt,
			},
		});
	} catch (error) {
		console.error("Create order error:", error);
		res.status(500).json({
			success: false,
			message: "Server Error",
		});
	}
};
