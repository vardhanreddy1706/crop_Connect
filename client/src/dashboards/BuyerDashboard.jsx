// src/pages/dashboards/BuyerDashboard.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faShoppingBag,
	faSignOutAlt,
	faBoxOpen,
	faTruckMoving,
	faCreditCard,
	faSpinner,
	faTimesCircle,
	faCheckCircle,
	faClock,
	faTrash,
	faPlus,
	faMinus,
	faTimes,
	faMapMarkerAlt,
	faCalendar,
	faTruck,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import api from "../config/api";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// Helper functions
const getAvailableQuantity = (item) =>
	Number(item?.availableQuantity || item?.crop?.quantity || 999);
const getItemId = (item) =>
	item?.itemId?.toString() ||
	item?.crop?._id?.toString() ||
	item?._id?.toString() ||
	"";
const getItemName = (item) =>
	item?.name || item?.cropName || item?.crop?.cropName || "Unknown Item";
const getUnitPrice = (item) =>
	Number(item?.price || item?.pricePerUnit || item?.crop?.pricePerUnit || 0);
const getQuantity = (item) => Number(item?.quantity || 1);
const getItemUnit = (item) => item?.unit || item?.crop?.unit || "quintal";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

// 🔍 Debug: Log environment variables (Remove in production)
console.log("🔑 Environment Check:", {
	RAZORPAY_KEY: import.meta.env.VITE_RAZORPAY_KEY_ID
		? "✅ Loaded"
		: "❌ Missing",
	API_URL: import.meta.env.VITE_API_BASE_URL ? "✅ Loaded" : "❌ Missing",
	SOCKET_URL: import.meta.env.VITE_SOCKET_URL ? "✅ Loaded" : "❌ Missing",
});

function BuyerDashboard() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	// State
	const [activeTab, setActiveTab] = useState("orders");
	const [orders, setOrders] = useState([]);
	const [cart, setCart] = useState([]);
	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState(false);
	const [isConnected, setIsConnected] = useState(false);

	// Checkout modal form state
	const [showCheckoutModal, setShowCheckoutModal] = useState(false);
	const [vehicleDetails, setVehicleDetails] = useState({
		vehicleType: "",
		vehicleNumber: "",
		driverName: "",
		driverPhone: "",
	});
	const [pickupSchedule, setPickupSchedule] = useState({
		date: "",
		timeSlot: "morning",
	});
	const [paymentMethod, setPaymentMethod] = useState("razorpay");

	// Fetch orders
	const fetchOrders = useCallback(async () => {
		try {
			const { data } = await api.get("/orders/buyer");
			setOrders(data.orders || []);
		} catch (error) {
			console.error("Fetch orders error:", error);
			toast.error("Failed to fetch orders");
		} finally {
			setLoading(false);
		}
	}, []);

	// Fetch cart
	const fetchCart = useCallback(async () => {
		try {
			const { data } = await api.get("/cart");
			setCart(data.cart || []);
			console.log("Cart fetched:", data.cart);
		} catch (error) {
			console.error("Fetch cart error:", error);
			toast.error("Failed to fetch cart");
		}
	}, []);

	// Socket.IO for real-time updates
	useEffect(() => {
		if (!user?._id) return;
		const socket = io(SOCKET_URL, {
			withCredentials: true,
			transports: ["websocket", "polling"],
		});

		socket.on("connect", () => {
			setIsConnected(true);
			socket.emit("join", user._id);
		});
		socket.on("orderStatusUpdate", (u) => {
			toast.success(`Order #${u.orderId.slice(-8)} ${u.status}`);
			fetchOrders();
		});
		socket.on("notification", (n) => {
			if (n.type.includes("order")) fetchOrders();
		});
		socket.on("disconnect", () => setIsConnected(false));
		return () => socket.disconnect();
	}, [user, fetchOrders]);

	// On mount
	useEffect(() => {
		const tab = searchParams.get("tab");
		if (tab) setActiveTab(tab);
		if (user) {
			fetchOrders();
			fetchCart();
		} else {
			toast.error("Please login");
			navigate("/login");
		}
	}, [searchParams, user, navigate, fetchOrders, fetchCart]);

	// Cart & order handlers
	const handleRemoveFromCart = async (itemId) => {
		if (!window.confirm("Remove this item from cart?")) return;
		try {
			await api.delete(`/cart/remove/${itemId}`);
			toast.success("Removed from cart");
			fetchCart();
		} catch (error) {
			console.error("Remove cart error:", error);
			toast.error("Failed to remove item");
		}
	};

	const handleUpdateQuantity = async (itemId, newQty, maxQty) => {
		if (newQty < 1) {
			toast.error("Quantity cannot be less than 1");
			return;
		}

		if (newQty > maxQty) {
			toast.error(`Only ${maxQty} available!`);
			return;
		}

		try {
			const response = await api.put("/cart/update", {
				itemId: itemId,
				quantity: newQty,
			});

			if (response.data.success) {
				toast.success("Quantity updated");
				fetchCart();
			}
		} catch (error) {
			console.error("Update quantity error:", error);
			const errorMsg =
				error.response?.data?.message || "Failed to update quantity";
			toast.error(errorMsg);
			if (error.response?.data?.availableQuantity) {
				fetchCart();
			}
		}
	};

	const handleCancelOrder = async (id) => {
		const reason = prompt("Cancellation reason:");
		if (!reason) return;
		try {
			await api.put(`/orders/${id}/cancel`, { reason });
			toast.success("Order cancelled");
			fetchOrders();
		} catch (error) {
			console.error("Cancel order error:", error);
			toast.error(error.response?.data?.message || "Failed to cancel");
		}
	};

	const handleCompleteOrder = async (id) => {
		if (!window.confirm("Mark this order as received and complete?")) return;
		try {
			await api.put(`/orders/${id}/complete`);
			toast.success("Order completed successfully!");
			fetchOrders();
		} catch (error) {
			console.error("Complete order error:", error);
			toast.error(error.response?.data?.message || "Failed to complete order");
		}
	};

	// Payment logic
	const cartTotal = cart.reduce(
		(sum, itm) => sum + getUnitPrice(itm) * getQuantity(itm),
		0
	);

	// Create order on server
	const createOrderFromCart = async (paymentDetails) => {
		setProcessing(true);
		try {
			const fullAddress = `${user.village || ""}, ${user.district || ""}, ${
				user.state || ""
			}, ${user.pincode || ""}`.trim();

			const orderData = {
				items: cart.map((itm) => ({
					crop: getItemId(itm),
					quantity: getQuantity(itm),
					pricePerUnit: getUnitPrice(itm),
					total: getUnitPrice(itm) * getQuantity(itm),
				})),
				totalAmount: cartTotal,
				paymentMethod,
				vehicleDetails,
				pickupSchedule,
				deliveryAddress: {
					village: user.village || "",
					district: user.district || "",
					state: user.state || "",
					pincode: user.pincode || "",
					fullAddress: fullAddress,
				},
				...paymentDetails,
			};

			console.log("Creating order with data:", orderData);

			const res = await api.post("/orders/create", orderData);
			if (res.data.success) {
				toast.success("🎉 Order placed successfully!");
				setShowCheckoutModal(false);
				fetchOrders();
				fetchCart();
				setActiveTab("orders");
			}
		} catch (e) {
			console.error("Create order error:", e);
			toast.error(e.response?.data?.message || "Order creation failed");
		} finally {
			setProcessing(false);
		}
	};

	// Razorpay checkout
	const handleRazorpayCheckout = async () => {
		if (
			!vehicleDetails.vehicleType ||
			!vehicleDetails.vehicleNumber ||
			!vehicleDetails.driverName ||
			!vehicleDetails.driverPhone ||
			!pickupSchedule.date
		) {
			toast.error("Please fill all vehicle and pickup details");
			return;
		}

		setProcessing(true);
		try {
			// 🔧 Get Razorpay key with fallback for testing
			const key =
				import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_ROHjDsLS2VVDeE";

			// 🔍 Debug logs
			console.log("💳 Razorpay Checkout Started");
			console.log(
				"🔑 Using Key:",
				key ? `${key.substring(0, 10)}...` : "MISSING"
			);
			console.log("💰 Cart Total:", cartTotal);

			if (!key || key === "undefined") {
				console.error("❌ Razorpay Key ID is missing or invalid!");
				console.error(
					"📝 Check your .env file has: VITE_RAZORPAY_KEY_ID=rzp_test_..."
				);
				toast.error(
					"Payment configuration error. Please check environment variables."
				);
				setProcessing(false);
				return;
			}

			// Create Razorpay order on backend
			console.log("📦 Creating Razorpay order...");
			const { data: orderData } = await api.post(
				"/orders/create-razorpay-order",
				{ amount: cartTotal }
			);
			console.log("✅ Razorpay order created:", orderData.order.id);

			// Check if Razorpay script is loaded
			if (typeof window.Razorpay === "undefined") {
				console.error("❌ Razorpay script not loaded!");
				console.error(
					"📝 Add <script src='https://checkout.razorpay.com/v1/checkout.js'></script> to index.html"
				);
				toast.error("Payment gateway not loaded. Please refresh the page.");
				setProcessing(false);
				return;
			}

			console.log("🚀 Opening Razorpay checkout...");

			const options = {
				key,
				amount: orderData.order.amount,
				currency: orderData.order.currency || "INR",
				order_id: orderData.order.id,
				name: "Crop Connect",
				description: "Cart Checkout",
				handler: async (resp) => {
					console.log("✅ Payment successful:", resp.razorpay_payment_id);
					await createOrderFromCart({
						razorpayOrderId: resp.razorpay_order_id,
						razorpayPaymentId: resp.razorpay_payment_id,
						razorpaySignature: resp.razorpay_signature,
					});
				},
				prefill: {
					name: user?.name || "",
					email: user?.email || "",
					contact: user?.phone || "",
				},
				theme: { color: "#10B981" },
				modal: {
					ondismiss: () => {
						console.log("❌ Payment modal dismissed by user");
						setProcessing(false);
					},
				},
			};

			const rz = new window.Razorpay(options);

			rz.on("payment.failed", (response) => {
				console.error("❌ Payment failed:", response.error);
				toast.error(
					`Payment failed: ${response.error.description || "Please try again"}`
				);
				setProcessing(false);
			});

			rz.open();
		} catch (err) {
			console.error("❌ Razorpay checkout error:", err);
			console.error("Error details:", err.response?.data || err.message);
			toast.error(
				err.response?.data?.message || "Checkout failed. Please try again."
			);
			setProcessing(false);
		}
	};

	// Cash on delivery
	const handlePayAfterDeliveryCheckout = async () => {
		if (
			!vehicleDetails.vehicleType ||
			!vehicleDetails.vehicleNumber ||
			!vehicleDetails.driverName ||
			!vehicleDetails.driverPhone ||
			!pickupSchedule.date
		) {
			toast.error("Please fill all vehicle and pickup details");
			return;
		}
		await createOrderFromCart({});
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
				<div className="text-center">
					<FontAwesomeIcon
						icon={faSpinner}
						spin
						size="4x"
						className="text-green-600 mb-4"
					/>
					<p className="text-gray-600 font-medium">Loading your dashboard...</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<FontAwesomeIcon
						icon={faSpinner}
						spin
						size="3x"
						className="text-green-600 mb-4"
					/>
					<p>Loading user data...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
			{/* Connection Status Banner */}
			{!isConnected && (
				<div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white py-3 px-4 text-center shadow-md">
					<FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
					<span className="font-medium">
						Real-time updates disconnected. Reconnecting...
					</span>
				</div>
			)}

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header Section */}
				<div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
						<div>
							<h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
								<div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-md">
									<FontAwesomeIcon
										icon={faBoxOpen}
										className="text-white"
										size="lg"
									/>
								</div>
								Buyer Dashboard
							</h1>
							<p className="text-gray-600 mt-2 ml-1">
								Welcome back,{" "}
								<span className="font-semibold text-green-700">
									{user?.name}
								</span>
							</p>
						</div>
						<div className="flex items-center gap-3">
							<button
								onClick={() => navigate("/crops")}
								className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
							>
								<FontAwesomeIcon icon={faShoppingBag} />
								Browse Crops
							</button>
							<button
								onClick={logout}
								className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
							>
								<FontAwesomeIcon icon={faSignOutAlt} />
								Logout
							</button>
						</div>
					</div>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
					{/* Total Orders */}
					<div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow duration-200">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-blue-100 text-sm font-medium mb-1">
									Total Orders
								</p>
								<p className="text-4xl font-bold">{orders.length}</p>
								<p className="text-blue-100 text-xs mt-1">All time orders</p>
							</div>
							<div className="bg-white bg-opacity-20 p-4 rounded-xl">
								<FontAwesomeIcon icon={faBoxOpen} size="2x" />
							</div>
						</div>
					</div>

					{/* Active Orders */}
					<div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow duration-200">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-purple-100 text-sm font-medium mb-1">
									Active Orders
								</p>
								<p className="text-4xl font-bold">
									{
										orders.filter((o) =>
											["confirmed", "picked"].includes(o.status)
										).length
									}
								</p>
								<p className="text-purple-100 text-xs mt-1">In progress</p>
							</div>
							<div className="bg-white bg-opacity-20 p-4 rounded-xl">
								<FontAwesomeIcon icon={faTruckMoving} size="2x" />
							</div>
						</div>
					</div>

					{/* Total Spent */}
					<div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow duration-200 sm:col-span-2 lg:col-span-1">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-green-100 text-sm font-medium mb-1">
									Total Spent
								</p>
								<p className="text-4xl font-bold">
									₹
									{orders
										.filter((o) => o.status !== "cancelled")
										.reduce((sum, o) => sum + o.totalAmount, 0)
										.toLocaleString()}
								</p>
								<p className="text-green-100 text-xs mt-1">Successful orders</p>
							</div>
							<div className="bg-white bg-opacity-20 p-4 rounded-xl">
								<FontAwesomeIcon icon={faCreditCard} size="2x" />
							</div>
						</div>
					</div>
				</div>

				{/* Tabs */}
				<div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
					<div className="flex border-b border-gray-200">
						<button
							onClick={() => setActiveTab("orders")}
							className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-200 ${
								activeTab === "orders"
									? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-b-4 border-green-600"
									: "text-gray-600 hover:bg-gray-50"
							}`}
						>
							<FontAwesomeIcon icon={faBoxOpen} className="mr-2" />
							My Orders ({orders.length})
						</button>
						<button
							onClick={() => setActiveTab("cart")}
							className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-200 relative ${
								activeTab === "cart"
									? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-b-4 border-green-600"
									: "text-gray-600 hover:bg-gray-50"
							}`}
						>
							<FontAwesomeIcon icon={faShoppingBag} className="mr-2" />
							My Cart
							{cart.length > 0 && (
								<span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
									{cart.length}
								</span>
							)}
						</button>
					</div>
				</div>

				{/* Tab Content */}
				{activeTab === "orders" ? (
					<div className="space-y-6">
						{orders.length === 0 ? (
							<div className="bg-white rounded-2xl shadow-lg p-12 text-center">
								<div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
									<FontAwesomeIcon
										icon={faBoxOpen}
										size="3x"
										className="text-gray-400"
									/>
								</div>
								<h3 className="text-xl font-semibold text-gray-800 mb-2">
									No orders yet
								</h3>
								<p className="text-gray-600 mb-6">
									Start shopping to see your orders here
								</p>
								<button
									onClick={() => navigate("/crops")}
									className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
								>
									Browse Crops
								</button>
							</div>
						) : (
							orders.map((order) => (
								<div
									key={order._id}
									className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 border-l-4 border-green-500"
								>
									{/* Order Header */}
									<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-gray-200">
										<div>
											<h3 className="text-xl font-bold text-gray-800 mb-1">
												Order #{order._id?.slice(-8).toUpperCase()}
											</h3>
											<p className="text-sm text-gray-500 flex items-center gap-2">
												<FontAwesomeIcon
													icon={faClock}
													className="text-gray-400"
												/>
												{new Date(order.createdAt).toLocaleDateString("en-IN", {
													dateStyle: "long",
												})}
											</p>
											<p className="text-sm text-gray-600 mt-1">
												<strong>Seller:</strong> {order.seller?.name} |{" "}
												<a
													href={`tel:${order.seller?.phone}`}
													className="text-blue-600 hover:underline"
												>
													{order.seller?.phone}
												</a>
											</p>
										</div>
										<div className="flex items-center gap-3">
											{order.status === "pending" && (
												<div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">
													<FontAwesomeIcon icon={faClock} />
													<span className="font-semibold text-sm">PENDING</span>
												</div>
											)}
											{order.status === "confirmed" && (
												<div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
													<FontAwesomeIcon icon={faCheckCircle} />
													<span className="font-semibold text-sm">
														CONFIRMED
													</span>
												</div>
											)}
											{order.status === "picked" && (
												<div className="flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full">
													<FontAwesomeIcon icon={faTruckMoving} />
													<span className="font-semibold text-sm">
														IN TRANSIT
													</span>
												</div>
											)}
											{order.status === "completed" && (
												<div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
													<FontAwesomeIcon icon={faCheckCircle} />
													<span className="font-semibold text-sm">
														COMPLETED
													</span>
												</div>
											)}
											{order.status === "cancelled" && (
												<div className="flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full">
													<FontAwesomeIcon icon={faTimesCircle} />
													<span className="font-semibold text-sm">
														CANCELLED
													</span>
												</div>
											)}
										</div>
									</div>

									{/* Order Items */}
									<div className="space-y-3 mb-6">
										{order.items.map((item, i) => (
											<div
												key={i}
												className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl hover:shadow-md transition-shadow"
											>
												<div className="flex items-center gap-3">
													{item.crop?.images?.[0] && (
														<img
															src={item.crop.images[0]}
															alt={item.crop.cropName}
															className="w-16 h-16 object-cover rounded-lg shadow-sm"
														/>
													)}
													<div>
														<p className="font-semibold text-gray-900 text-lg">
															{item.crop?.cropName || "Crop"}
														</p>
														<p className="text-sm text-gray-600 mt-1">
															{item.quantity} {item.crop?.unit || "quintal"} × ₹
															{item.pricePerUnit.toLocaleString()}
														</p>
													</div>
												</div>
												<p className="text-xl font-bold text-green-600">
													₹{item.total.toLocaleString()}
												</p>
											</div>
										))}
									</div>

									{/* Vehicle & Pickup Details */}
									{order.vehicleDetails && (
										<div className="grid md:grid-cols-2 gap-4 mb-4 p-4 bg-blue-50 rounded-xl">
											<div>
												<h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
													<FontAwesomeIcon
														icon={faTruck}
														className="text-blue-600"
													/>
													Vehicle Details
												</h4>
												<p className="text-sm">
													<strong>Type:</strong>{" "}
													{order.vehicleDetails.vehicleType}
												</p>
												<p className="text-sm">
													<strong>Number:</strong>{" "}
													{order.vehicleDetails.vehicleNumber}
												</p>
												<p className="text-sm">
													<strong>Driver:</strong>{" "}
													{order.vehicleDetails.driverName}
												</p>
												<p className="text-sm">
													<strong>Phone:</strong>{" "}
													<a
														href={`tel:${order.vehicleDetails.driverPhone}`}
														className="text-blue-600 hover:underline"
													>
														{order.vehicleDetails.driverPhone}
													</a>
												</p>
											</div>
											<div>
												<h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
													<FontAwesomeIcon
														icon={faCalendar}
														className="text-blue-600"
													/>
													Pickup Schedule
												</h4>
												<p className="text-sm">
													<strong>Date:</strong>{" "}
													{new Date(
														order.pickupSchedule.date
													).toLocaleDateString("en-IN")}
												</p>
												<p className="text-sm capitalize">
													<strong>Time:</strong> {order.pickupSchedule.timeSlot}
												</p>
												<p className="text-sm mt-2">
													<strong>Payment:</strong>{" "}
													<span
														className={`font-semibold ${
															order.paymentStatus === "completed"
																? "text-green-600"
																: "text-orange-600"
														}`}
													>
														{order.paymentMethod === "razorpay"
															? "Paid Online"
															: "Pay After Delivery"}{" "}
														({order.paymentStatus})
													</span>
												</p>
											</div>
										</div>
									)}

									{/* Delivery Address */}
									{order.deliveryAddress && (
										<div className="mb-4 p-4 bg-green-50 rounded-xl">
											<h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
												<FontAwesomeIcon
													icon={faMapMarkerAlt}
													className="text-green-600"
												/>
												Delivery Address
											</h4>
											<p className="text-sm">
												{order.deliveryAddress.fullAddress}
											</p>
										</div>
									)}

									{/* Order Total */}
									<div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl mb-4">
										<span className="text-lg font-semibold text-gray-800">
											Order Total
										</span>
										<span className="text-2xl font-bold text-green-600">
											₹{order.totalAmount.toLocaleString()}
										</span>
									</div>

									{/* Actions */}
									<div className="flex gap-3">
										{(order.status === "pending" ||
											order.status === "confirmed") && (
											<button
												onClick={() => handleCancelOrder(order._id)}
												className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
											>
												<FontAwesomeIcon icon={faTimesCircle} />
												Cancel Order
											</button>
										)}
										{order.status === "picked" && (
											<button
												onClick={() => handleCompleteOrder(order._id)}
												className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
											>
												<FontAwesomeIcon icon={faCheckCircle} />
												Mark as Received
											</button>
										)}
									</div>
								</div>
							))
						)}
					</div>
				) : (
					// Cart Tab
					<div className="bg-white rounded-2xl shadow-lg p-8">
						{cart.length === 0 ? (
							<div className="text-center py-16">
								<div className="bg-gray-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
									<FontAwesomeIcon
										icon={faShoppingBag}
										className="text-gray-400"
										size="4x"
									/>
								</div>
								<h3 className="text-2xl font-bold text-gray-800 mb-3">
									Your cart is empty
								</h3>
								<p className="text-gray-600 mb-8">
									Discover fresh crops from local farmers
								</p>
								<button
									onClick={() => navigate("/crops")}
									className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-10 py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-semibold text-lg"
								>
									Start Shopping
								</button>
							</div>
						) : (
							<div>
								<h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
									<FontAwesomeIcon
										icon={faShoppingBag}
										className="text-green-600"
									/>
									Shopping Cart
									<span className="text-gray-500 text-lg">
										({cart.length} items)
									</span>
								</h3>

								<div className="space-y-4 mb-8">
									{cart.map((item) => {
										const itemId = getItemId(item);
										const itemName = getItemName(item);
										const unitPrice = getUnitPrice(item);
										const quantity = getQuantity(item);
										const unit = getItemUnit(item);
										const availableQty = getAvailableQuantity(item);
										const lineTotal = unitPrice * quantity;
										const isAtMaxQuantity = quantity >= availableQty;
										const isAtMinQuantity = quantity <= 1;

										return (
											<div
												key={itemId}
												className="flex flex-col md:flex-row items-center justify-between border-2 border-gray-200 p-5 rounded-2xl hover:border-green-300 hover:shadow-lg transition-all duration-200 relative bg-gradient-to-r from-white to-gray-50"
											>
												<div className="flex-1 mb-4 md:mb-0">
													<h4 className="font-bold text-gray-900 text-xl mb-2">
														{itemName}
													</h4>
													<p className="text-lg text-gray-700 mb-2">
														₹{unitPrice.toLocaleString()}
														<span className="text-gray-500">/{unit}</span>
													</p>
													<div className="flex items-center gap-2">
														<span
															className={`inline-block w-3 h-3 rounded-full ${
																availableQty > 5
																	? "bg-green-500"
																	: "bg-orange-500"
															}`}
														></span>
														<p className="text-sm text-gray-600">
															Available:{" "}
															<span className="font-bold text-gray-800">
																{availableQty} {unit}
															</span>
														</p>
													</div>
												</div>

												<div className="flex items-center gap-6">
													{/* Quantity Controls */}
													<div className="flex flex-col items-center gap-2">
														<div className="flex items-center gap-2 border-2 border-gray-300 rounded-xl bg-white shadow-sm">
															<button
																onClick={() =>
																	handleUpdateQuantity(
																		itemId,
																		quantity - 1,
																		availableQty
																	)
																}
																disabled={isAtMinQuantity}
																className="px-4 py-3 hover:bg-green-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-l-xl"
																title={
																	isAtMinQuantity
																		? "Minimum quantity is 1"
																		: "Decrease quantity"
																}
															>
																<FontAwesomeIcon
																	icon={faMinus}
																	className="text-gray-700"
																/>
															</button>

															<span className="px-6 font-bold text-xl min-w-[50px] text-center text-gray-900">
																{quantity}
															</span>

															<button
																onClick={() =>
																	handleUpdateQuantity(
																		itemId,
																		quantity + 1,
																		availableQty
																	)
																}
																disabled={isAtMaxQuantity}
																className="px-4 py-3 hover:bg-green-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-r-xl"
																title={
																	isAtMaxQuantity
																		? `Maximum ${availableQty} ${unit} available`
																		: "Increase quantity"
																}
															>
																<FontAwesomeIcon
																	icon={faPlus}
																	className="text-gray-700"
																/>
															</button>
														</div>
														{isAtMaxQuantity && (
															<span className="text-xs text-orange-600 font-semibold bg-orange-100 px-3 py-1 rounded-full">
																Max stock reached
															</span>
														)}
													</div>

													{/* Line Total */}
													<div className="text-right min-w-[140px]">
														<p className="text-sm text-gray-500 mb-1">Total</p>
														<p className="font-bold text-gray-900 text-2xl">
															₹{lineTotal.toLocaleString()}
														</p>
													</div>

													{/* Remove Button */}
													<button
														onClick={() => handleRemoveFromCart(itemId)}
														className="text-red-600 hover:bg-red-50 p-3 rounded-xl transition-colors ml-2"
														title="Remove from cart"
													>
														<FontAwesomeIcon icon={faTrash} size="lg" />
													</button>
												</div>

												{isAtMaxQuantity && (
													<div className="absolute -top-3 -right-3">
														<span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
															MAX
														</span>
													</div>
												)}
											</div>
										);
									})}
								</div>

								{/* Cart Summary */}
								<div className="border-t-2 border-gray-300 pt-6 mb-8">
									<div className="flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl shadow-md">
										<span className="text-2xl font-bold text-gray-800">
											Cart Total:
										</span>
										<span className="text-4xl font-bold text-green-600">
											₹{cartTotal.toLocaleString()}
										</span>
									</div>
								</div>

								{/* Checkout Button */}
								<button
									onClick={() => setShowCheckoutModal(true)}
									className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-5 rounded-2xl transition-all duration-200 font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
								>
									<FontAwesomeIcon icon={faShoppingBag} size="lg" />
									Proceed to Checkout
								</button>
							</div>
						)}
					</div>
				)}

				{/* Checkout Modal */}
				{showCheckoutModal && (
					<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
						<div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
							{/* Modal Header */}
							<div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-3xl flex justify-between items-center shadow-lg z-10">
								<h2 className="text-3xl font-bold flex items-center gap-3">
									<FontAwesomeIcon icon={faShoppingBag} />
									Checkout
								</h2>
								<button
									onClick={() => setShowCheckoutModal(false)}
									className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-all"
								>
									<FontAwesomeIcon icon={faTimes} size="lg" />
								</button>
							</div>

							<div className="p-8">
								{/* Vehicle Details Section */}
								<div className="mb-8">
									<h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
										<FontAwesomeIcon
											icon={faTruckMoving}
											className="text-green-600"
										/>
										Vehicle Details
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-semibold mb-2 text-gray-700">
												Vehicle Type *
											</label>
											<select
												value={vehicleDetails.vehicleType}
												onChange={(e) =>
													setVehicleDetails({
														...vehicleDetails,
														vehicleType: e.target.value,
													})
												}
												className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
											>
												<option value="">Select Vehicle Type</option>
												<option value="Truck">Truck</option>
												<option value="Tempo">Tempo</option>
												<option value="Tractor">Tractor</option>
												<option value="Mini Truck">Mini Truck</option>
											</select>
										</div>
										<div>
											<label className="block text-sm font-semibold mb-2 text-gray-700">
												Vehicle Number *
											</label>
											<input
												type="text"
												value={vehicleDetails.vehicleNumber}
												onChange={(e) =>
													setVehicleDetails({
														...vehicleDetails,
														vehicleNumber: e.target.value,
													})
												}
												placeholder="e.g., MH12AB1234"
												className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
											/>
										</div>
										<div>
											<label className="block text-sm font-semibold mb-2 text-gray-700">
												Driver Name *
											</label>
											<input
												type="text"
												value={vehicleDetails.driverName}
												onChange={(e) =>
													setVehicleDetails({
														...vehicleDetails,
														driverName: e.target.value,
													})
												}
												placeholder="Driver's Full Name"
												className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
											/>
										</div>
										<div>
											<label className="block text-sm font-semibold mb-2 text-gray-700">
												Driver Phone *
											</label>
											<input
												type="tel"
												value={vehicleDetails.driverPhone}
												onChange={(e) =>
													setVehicleDetails({
														...vehicleDetails,
														driverPhone: e.target.value,
													})
												}
												placeholder="10-digit mobile number"
												className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
											/>
										</div>
									</div>
								</div>

								{/* Pickup Schedule Section */}
								<div className="mb-8">
									<h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
										<FontAwesomeIcon
											icon={faClock}
											className="text-green-600"
										/>
										Pickup Schedule
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-semibold mb-2 text-gray-700">
												Pickup Date *
											</label>
											<input
												type="date"
												value={pickupSchedule.date}
												onChange={(e) =>
													setPickupSchedule({
														...pickupSchedule,
														date: e.target.value,
													})
												}
												min={new Date().toISOString().split("T")[0]}
												className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
											/>
										</div>
										<div>
											<label className="block text-sm font-semibold mb-2 text-gray-700">
												Time Slot *
											</label>
											<select
												value={pickupSchedule.timeSlot}
												onChange={(e) =>
													setPickupSchedule({
														...pickupSchedule,
														timeSlot: e.target.value,
													})
												}
												className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
											>
												<option value="morning">
													🌅 Morning (6 AM - 12 PM)
												</option>
												<option value="afternoon">
													☀️ Afternoon (12 PM - 6 PM)
												</option>
												<option value="evening">
													🌆 Evening (6 PM - 9 PM)
												</option>
											</select>
										</div>
									</div>
								</div>

								{/* Payment Method Section */}
								<div className="mb-8">
									<h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
										<FontAwesomeIcon
											icon={faCreditCard}
											className="text-green-600"
										/>
										Payment Method
									</h3>
									<div className="space-y-3">
										<label className="flex items-center gap-3 p-5 border-2 border-gray-300 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all">
											<input
												type="radio"
												value="razorpay"
												checked={paymentMethod === "razorpay"}
												onChange={(e) => setPaymentMethod(e.target.value)}
												className="w-5 h-5 text-green-600"
											/>
											<div className="flex-1">
												<span className="font-semibold text-gray-800">
													Pay Online (Razorpay)
												</span>
												<p className="text-sm text-gray-600 mt-1">
													Secure payment via UPI, Cards, Net Banking
												</p>
											</div>
											<div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
												RECOMMENDED
											</div>
										</label>
										<label className="flex items-center gap-3 p-5 border-2 border-gray-300 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all">
											<input
												type="radio"
												value="payAfterDelivery"
												checked={paymentMethod === "payAfterDelivery"}
												onChange={(e) => setPaymentMethod(e.target.value)}
												className="w-5 h-5 text-green-600"
											/>
											<div className="flex-1">
												<span className="font-semibold text-gray-800">
													Pay After Delivery
												</span>
												<p className="text-sm text-gray-600 mt-1">
													Pay when you receive your order
												</p>
											</div>
										</label>
									</div>
								</div>

								{/* Order Summary Section */}
								<div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200">
									<h3 className="font-bold text-lg mb-4 text-gray-800">
										Order Summary
									</h3>
									<div className="space-y-3">
										{cart.map((item) => (
											<div
												key={getItemId(item)}
												className="flex justify-between text-sm text-gray-700"
											>
												<span>
													{getItemName(item)} × {getQuantity(item)}{" "}
													{getItemUnit(item)}
												</span>
												<span className="font-semibold">
													₹
													{(
														getUnitPrice(item) * getQuantity(item)
													).toLocaleString()}
												</span>
											</div>
										))}
										<div className="flex justify-between text-gray-700 pt-2 border-t border-green-300">
											<span className="font-medium">
												Items ({cart.length}):
											</span>
											<span className="font-semibold">
												₹{cartTotal.toLocaleString()}
											</span>
										</div>
										<div className="flex justify-between text-gray-700">
											<span className="font-medium">Delivery Charges:</span>
											<span className="font-semibold text-green-600">FREE</span>
										</div>
										<div className="border-t-2 border-green-300 pt-3 flex justify-between items-center">
											<span className="text-xl font-bold text-gray-800">
												Total Amount:
											</span>
											<span className="text-3xl font-bold text-green-600">
												₹{cartTotal.toLocaleString()}
											</span>
										</div>
									</div>
								</div>

								{/* Action Buttons */}
								<div className="flex gap-4">
									<button
										onClick={() => setShowCheckoutModal(false)}
										className="flex-1 border-2 border-gray-300 text-gray-700 py-4 rounded-xl hover:bg-gray-50 transition-all font-semibold text-lg"
										disabled={processing}
									>
										Cancel
									</button>
									<button
										onClick={
											paymentMethod === "razorpay"
												? handleRazorpayCheckout
												: handlePayAfterDeliveryCheckout
										}
										disabled={processing}
										className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all font-bold text-lg"
									>
										{processing ? (
											<>
												<FontAwesomeIcon icon={faSpinner} spin />
												Processing...
											</>
										) : paymentMethod === "razorpay" ? (
											<>
												<FontAwesomeIcon icon={faCreditCard} />
												Pay ₹{cartTotal.toLocaleString()}
											</>
										) : (
											<>
												<FontAwesomeIcon icon={faCheckCircle} />
												Place Order
											</>
										)}
									</button>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default BuyerDashboard;
