// src/pages/dashboards/BuyerDashboard.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faShoppingBag,
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
	faStar,
} from "@fortawesome/free-solid-svg-icons";
import Calculator from "../components/Calculator";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import DashboardNavbar from "../components/DashboardNavbar";
import DashboardFooter from "../components/DashboardFooter";
import api from "../config/api";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import RatingModal from "../components/RatingModal";
import MyRatingsTab from "../components/MyRatingsTab";
import RatingsReceivedTab from "../components/RatingsReceived";

// Helper functions
const getAvailableQuantity = (item) => {
	const v =
		item?.availableQuantity ?? item?.crop?.quantity ?? item?.available ?? 0;
	return Number(v);
};
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
	const { tr } = useLanguage();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	// State
	const [activeTab, setActiveTab] = useState("orders");
	const [orders, setOrders] = useState([]);
	const [cart, setCart] = useState([]);
	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState(false);
	const [isConnected, setIsConnected] = useState(false);

	// Pagination states
	const itemsPerPage = 3;
	const [pageOrders, setPageOrders] = useState(0);
	const [pageTransactions, setPageTransactions] = useState(0);

	// Rating modal state
	const [ratingModal, setRatingModal] = useState({ isOpen: false, data: null });

	// Check if already rated helper function
	const checkIfRated = async (rateeId, transactionRef) => {
		try {
			const response = await api.get("/ratings/can-rate", {
				params: { rateeId, ...transactionRef },
			});
			return response.data;
		} catch (error) {
			console.error("Check if rated error:", error);
			return { canRate: true };
		}
	};

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
					<p>{tr("Loading user data...")}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex flex-col">
			<DashboardNavbar role="Buyer" userName={user?.name} onLogout={logout} />
			<div className="pt-28 flex-1 pb-8">
				{/* Connection Status Banner */}
				{!isConnected && (
					<div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white py-3 px-4 text-center shadow-md">
						<FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
						<span className="font-medium">
							{tr("Real-time updates disconnected. Reconnecting...")}
						</span>
					</div>
				)}

				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					{/* Header Section replaced by DashboardNavbar */}

					{/* Stats Cards */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
						{/* Total Orders */}
						<div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-white hover:shadow-xl transition-shadow duration-200">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-blue-100 text-xs sm:text-sm font-medium mb-1">
										{tr("Total Orders")} 📦
									</p>
									<p className="text-2xl sm:text-3xl lg:text-4xl font-bold">
										{orders.length}
									</p>
									<p className="text-blue-100 text-xs mt-1">
										{tr("All time orders")}
									</p>
								</div>
								<div
									className="bg-white/25 p-2 sm:p-4 rounded-lg sm:rounded-xl ring-1 ring-white/30 shadow-inner"
									aria-hidden
								>
									<FontAwesomeIcon
										icon={faBoxOpen}
										size="lg"
										className="drop-shadow"
									/>
								</div>
							</div>
						</div>

						{/* Active Orders */}
						<div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-white hover:shadow-xl transition-shadow duration-200">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-purple-100 text-xs sm:text-sm font-medium mb-1">
										{tr("Active Orders")} 🚚
									</p>
									<p className="text-2xl sm:text-3xl lg:text-4xl font-bold">
										{
											orders.filter((o) =>
												["confirmed", "picked"].includes(o.status)
											).length
										}
									</p>
									<p className="text-purple-100 text-xs mt-1">
										{tr("In progress")}
									</p>
								</div>
								<div
									className="bg-white/25 p-2 sm:p-4 rounded-lg sm:rounded-xl ring-1 ring-white/30 shadow-inner"
									aria-hidden
								>
									<FontAwesomeIcon
										icon={faTruckMoving}
										size="lg"
										className="drop-shadow"
									/>
								</div>
							</div>
						</div>

						{/* Total Spent */}
						<div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-white hover:shadow-xl transition-shadow duration-200 sm:col-span-2 lg:col-span-1">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-green-100 text-xs sm:text-sm font-medium mb-1">
										{tr("Total Spent")} 💳
									</p>
									<p className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold">
										₹
										{orders
											.filter((o) => o.status !== "cancelled")
											.reduce((sum, o) => sum + o.totalAmount, 0)
											.toLocaleString()}
									</p>
									<p className="text-blue-100 text-xs mt-1">
										{tr("Successful orders")}
									</p>
								</div>
								<div
									className="bg-white/25 p-2 sm:p-4 rounded-lg sm:rounded-xl ring-1 ring-white/30 shadow-inner"
									aria-hidden
								>
									<FontAwesomeIcon
										icon={faCreditCard}
										size="lg"
										className="drop-shadow"
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Tabs */}
					<div className="bg-white rounded-xl sm:rounded-2xl shadow-lg mb-6 sm:mb-8 overflow-hidden">
						<div className="flex flex-col sm:flex-row border-b border-gray-200">
							<button
								onClick={() => setActiveTab("orders")}
								className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 text-center font-semibold transition-all duration-200 ${
									activeTab === "orders"
										? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-b-4 border-green-600"
										: "text-gray-600 hover:bg-gray-50"
								}`}
							>
								<FontAwesomeIcon icon={faBoxOpen} className="mr-1 sm:mr-2" />
								<span className="hidden sm:inline">
									{tr("My Orders")} ({orders.length})
								</span>
								<span className="sm:hidden">
									{tr("Orders")} ({orders.length})
								</span>
							</button>
							<button
								onClick={() => setActiveTab("cart")}
								className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 text-center font-semibold transition-all duration-200 relative ${
									activeTab === "cart"
										? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-b-4 border-green-600"
										: "text-gray-600 hover:bg-gray-50"
								}`}
							>
								<FontAwesomeIcon
									icon={faShoppingBag}
									className="mr-1 sm:mr-2"
								/>
								<span className="hidden sm:inline">{tr("My Cart")}</span>
								<span className="sm:hidden">{tr("Cart")}</span>
								{cart.length > 0 && (
									<span className="ml-1 sm:ml-2 bg-red-500 text-white text-xs font-bold px-1 sm:px-2 py-0.5 sm:py-1 rounded-full">
										{cart.length}
									</span>
								)}
							</button>
							<button
								onClick={() => setActiveTab("transactions")}
								className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 text-center font-semibold transition-all duration-200 ${
									activeTab === "transactions"
										? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-b-4 border-green-600"
										: "text-gray-600 hover:bg-gray-50"
								}`}
							>
								<FontAwesomeIcon icon={faCreditCard} className="mr-1 sm:mr-2" />
								<span className="hidden sm:inline">
									{tr("Transaction History")}
								</span>
								<span className="sm:hidden">{tr("Transactions")}</span>
							</button>
							<button
								onClick={() => setActiveTab("my-ratings")}
								className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 text-center font-semibold transition-all duration-200 ${
									activeTab === "my-ratings"
										? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-b-4 border-green-600"
										: "text-gray-600 hover:bg-gray-50"
								}`}
							>
								<FontAwesomeIcon icon={faStar} className="mr-1 sm:mr-2" />
								<span className="hidden sm:inline">{tr("My Ratings")}</span>
								<span className="sm:hidden">{tr("Ratings")}</span>
							</button>
							<button
								onClick={() => setActiveTab("ratings-received")}
								className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 text-center font-semibold transition-all duration-200 ${
									activeTab === "ratings-received"
										? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-b-4 border-green-600"
										: "text-gray-600 hover:bg-gray-50"
								}`}
							>
								<FontAwesomeIcon icon={faStar} className="mr-1 sm:mr-2" />
								<span className="hidden sm:inline">{tr("Reviews")}</span>
								<span className="sm:hidden">{tr("Reviews")}</span>
							</button>
						</div>
					</div>

					{/* Tab Content */}
					{activeTab === "orders" ? (
						<div className="space-y-4 sm:space-y-6">
							{orders.length === 0 ? (
								<div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-8 sm:p-12 text-center">
									<div className="bg-gray-100 w-20 sm:w-24 h-20 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-4">
										<FontAwesomeIcon
											icon={faBoxOpen}
											size="2x"
											className="text-gray-400"
										/>
									</div>
									<h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
										{tr("No orders yet")}
									</h3>
									<p className="text-gray-600 mb-6 text-sm sm:text-base">
										{tr("Start shopping to see your orders here")}
									</p>
									<button
										onClick={() => navigate("/crops")}
										className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm sm:text-base"
									>
										{tr("Browse Crops")}
									</button>
								</div>
							) : (
								<>
									{orders
										.slice(
											pageOrders * itemsPerPage,
											pageOrders * itemsPerPage + itemsPerPage
										)
										.map((order) => (
											<div
												key={order._id}
												className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-200 border-l-4 border-green-500"
											>
												{/* Order Header */}
												<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200">
													<div>
														<h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">
															Order #{order._id?.slice(-8).toUpperCase()}
														</h3>
														<p className="text-xs sm:text-sm text-gray-500 flex items-center gap-2">
															<FontAwesomeIcon
																icon={faClock}
																className="text-gray-400"
															/>
															{new Date(order.createdAt).toLocaleDateString(
																"en-IN",
																{ dateStyle: "long" }
															)}
														</p>
														<p className="text-xs sm:text-sm text-gray-600 mt-1">
															<strong>Seller:</strong> {order.seller?.name} |{" "}
															<a
																href={`tel:${order.seller?.phone}`}
																className="text-blue-600 hover:underline"
															>
																{order.seller?.phone}
															</a>
														</p>
														{order.seller?.address && (
															<p className="text-xs text-gray-500 mt-1">
																<strong>Seller Location:</strong>{" "}
																{order.seller.address.village || ""}
																{order.seller.address.village ? ", " : ""}
																{order.seller.address.district || ""}
																{order.seller.address.district ? ", " : ""}
																{order.seller.address.state || ""}{" "}
																{order.seller.address.pincode || ""}
															</p>
														)}
													</div>
													<div className="flex items-center gap-2 sm:gap-3">
														{order.status === "pending" && (
															<div className="flex items-center gap-1 sm:gap-2 bg-yellow-100 text-yellow-800 px-3 sm:px-4 py-1 sm:py-2 rounded-full">
																<FontAwesomeIcon icon={faClock} />
																<span className="font-semibold text-xs sm:text-sm">
																	PENDING
																</span>
															</div>
														)}
														{order.status === "confirmed" && (
															<div className="flex items-center gap-1 sm:gap-2 bg-blue-100 text-blue-800 px-3 sm:px-4 py-1 sm:py-2 rounded-full">
																<FontAwesomeIcon icon={faCheckCircle} />
																<span className="font-semibold text-xs sm:text-sm">
																	CONFIRMED
																</span>
															</div>
														)}
														{order.status === "picked" && (
															<div className="flex items-center gap-1 sm:gap-2 bg-purple-100 text-purple-800 px-3 sm:px-4 py-1 sm:py-2 rounded-full">
																<FontAwesomeIcon icon={faTruckMoving} />
																<span className="font-semibold text-xs sm:text-sm">
																	IN TRANSIT
																</span>
															</div>
														)}
														{order.status === "completed" && (
															<div className="flex items-center gap-1 sm:gap-2 bg-green-100 text-green-800 px-3 sm:px-4 py-1 sm:py-2 rounded-full">
																<FontAwesomeIcon icon={faCheckCircle} />
																<span className="font-semibold text-xs sm:text-sm">
																	COMPLETED
																</span>
															</div>
														)}
														{order.status === "cancelled" && (
															<div className="flex items-center gap-1 sm:gap-2 bg-red-100 text-red-800 px-3 sm:px-4 py-1 sm:py-2 rounded-full">
																<FontAwesomeIcon icon={faTimesCircle} />
																<span className="font-semibold text-xs sm:text-sm">
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
																		{item.quantity}{" "}
																		{item.crop?.unit || "quintal"} × ₹
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
													<div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 p-3 sm:p-4 bg-blue-900 border-2 border-blue-200 rounded-lg sm:rounded-xl">
														<div>
															<h4 className="font-semibold text-xs sm:text-sm mb-2 flex items-center gap-2 text-white">
																<FontAwesomeIcon
																	icon={faTruck}
																	className="text-blue-400"
																/>
																{tr("Vehicle Details")}
															</h4>
															<p className="text-xs sm:text-sm text-gray-300">
																<strong className="text-white">
																	{tr("Type:")}
																</strong>{" "}
																{order.vehicleDetails.vehicleType}
															</p>
															<p className="text-xs sm:text-sm text-gray-300">
																<strong className="text-white">
																	{tr("Number:")}
																</strong>{" "}
																{order.vehicleDetails.vehicleNumber}
															</p>
															<p className="text-xs sm:text-sm text-gray-300">
																<strong className="text-white">
																	{tr("Driver:")}
																</strong>{" "}
																{order.vehicleDetails.driverName}
															</p>
															<p className="text-xs sm:text-sm text-gray-300">
																<strong className="text-white">
																	{tr("Phone:")}
																</strong>{" "}
																<a
																	href={`tel:${order.vehicleDetails.driverPhone}`}
																	className="text-blue-400 hover:underline font-semibold"
																>
																	{order.vehicleDetails.driverPhone}
																</a>
															</p>
														</div>
														<div>
															<h4 className="font-semibold text-xs sm:text-sm mb-2 flex items-center gap-2 text-white">
																<FontAwesomeIcon
																	icon={faCalendar}
																	className="text-blue-400"
																/>
																{tr("Pickup Schedule")}
															</h4>
															<p className="text-xs sm:text-sm text-gray-300">
																<strong className="text-white">
																	{tr("Date:")}
																</strong>{" "}
																{new Date(
																	order.pickupSchedule.date
																).toLocaleDateString("en-IN")}
															</p>
															<p className="text-xs sm:text-sm capitalize text-gray-300">
																<strong className="text-white">
																	{tr("Time:")}
																</strong>{" "}
																{order.pickupSchedule.timeSlot}
															</p>
															<p className="text-xs sm:text-sm mt-2 text-gray-300">
																<strong className="text-white">
																	{tr("Payment:")}
																</strong>{" "}
																<span
																	className={`font-semibold ${
																		order.paymentStatus === "completed"
																			? "text-green-400"
																			: "text-orange-400"
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

												{/* Pick-up Address (Farmer/Seller) */}
												<div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-green-900 border-2 border-green-200 rounded-lg sm:rounded-xl">
													<h4 className="font-semibold text-xs sm:text-sm mb-2 flex items-center gap-2 text-white">
														<FontAwesomeIcon
															icon={faMapMarkerAlt}
															className="text-green-400"
														/>
														{tr("Pick-up Address (Farmer)")}
													</h4>
													{order.seller?.address ? (
														<p className="text-xs sm:text-sm text-gray-200">
															{order.seller.address.village || ""}
															{order.seller.address.village ? ", " : ""}
															{order.seller.address.district || ""}
															{order.seller.address.district ? ", " : ""}
															{order.seller.address.state || ""}{" "}
															{order.seller.address.pincode || ""}
														</p>
													) : (
														<p className="text-xs sm:text-sm text-gray-300">
															{order.deliveryAddress?.fullAddress ||
																tr("Address not available")}
														</p>
													)}
												</div>

												{/* Order Total */}
												<div className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-xl mb-3 sm:mb-4">
													<span className="text-base sm:text-lg font-semibold text-gray-800">
														{tr("Order Total")}
													</span>
													<span className="text-xl sm:text-2xl font-bold text-green-600">
														₹{order.totalAmount.toLocaleString()}
													</span>
												</div>

												{/* Actions */}
												<div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
													{(order.status === "pending" ||
														order.status === "confirmed") && (
														<button
															onClick={() => handleCancelOrder(order._id)}
															className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm sm:text-base"
														>
															<FontAwesomeIcon icon={faTimesCircle} />
															{tr("Cancel Order")}
														</button>
													)}
													{order.status === "picked" && (
														<button
															onClick={() => handleCompleteOrder(order._id)}
															className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm sm:text-base"
														>
															<FontAwesomeIcon icon={faCheckCircle} />
															{tr("Mark as Received")}
														</button>
													)}
													{order.status === "completed" && (
														<button
															onClick={async () => {
																const sellerId =
																	typeof order.seller === "string"
																		? order.seller
																		: order.seller?._id;
																if (!sellerId) {
																	toast.error("Seller information missing");
																	return;
																}
																const canRateData = await checkIfRated(
																	sellerId,
																	{ relatedOrder: order._id }
																);
																if (canRateData.canRate) {
																	setRatingModal({
																		isOpen: true,
																		data: {
																			rateeId: sellerId,
																			rateeName: order.seller?.name || "Farmer",
																			rateeRole: "farmer",
																			ratingType: "buyer_to_farmer",
																			relatedOrder: order._id,
																		},
																	});
																} else {
																	toast.info(
																		"You have already rated this farmer"
																	);
																}
															}}
															className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm sm:text-base"
														>
															<FontAwesomeIcon icon={faStar} />
															{tr("Rate Farmer")}
														</button>
													)}
												</div>
											</div>
										))}
									{/* Pagination */}
									{orders.length > itemsPerPage && (
										<div className="flex justify-end items-center gap-2 mt-6">
											<button
												onClick={() =>
													setPageOrders(Math.max(0, pageOrders - 1))
												}
												disabled={pageOrders === 0}
												className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
											>
												{tr("Prev")}
											</button>
											<button
												onClick={() =>
													setPageOrders(
														(pageOrders + 1) %
															Math.ceil(orders.length / itemsPerPage)
													)
												}
												disabled={
													pageOrders >=
													Math.ceil(orders.length / itemsPerPage) - 1
												}
												className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
											>
												{tr("Next")}
											</button>
										</div>
									)}
								</>
							)}
						</div>
					) : activeTab === "transactions" ? (
						<div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
							<h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
								Transaction History
							</h3>
							{(() => {
								const transactions = orders
									.filter(
										(o) =>
											(o.paymentMethod === "razorpay" && o.razorpayPaymentId) ||
											(o.paymentMethod === "payAfterDelivery" &&
												o.paymentStatus === "completed")
									)
									.sort(
										(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
									);

								return transactions.length === 0 ? (
									<p className="text-gray-500 text-sm sm:text-base">
										No transactions yet.
									</p>
								) : (
									<>
										<div className="space-y-3">
											{transactions
												.slice(
													pageTransactions * itemsPerPage,
													pageTransactions * itemsPerPage + itemsPerPage
												)
												.map((o) => (
													<div
														key={o._id}
														className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-sm"
													>
														<div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4">
															<div className="flex-1">
																<p className="font-semibold text-gray-800 text-sm sm:text-base">
																	{o.paymentMethod === "razorpay"
																		? "Online (Razorpay)"
																		: "Pay After Delivery"}
																</p>
																<p className="text-xs text-gray-500">
																	Order #{o._id.slice(-8).toUpperCase()} •{" "}
																	{new Date(o.createdAt).toLocaleString(
																		"en-IN"
																	)}
																</p>
																<p className="text-xs text-gray-500">
																	Seller: {o.seller?.name || "Farmer"}
																</p>
															</div>
															<div className="text-right">
																<p className="text-lg font-bold text-green-600">
																	₹{o.totalAmount.toLocaleString()}
																</p>
																<p
																	className={`text-xs font-semibold ${
																		(o.paymentMethod === "razorpay" &&
																			o.razorpayPaymentId) ||
																		o.paymentStatus === "completed"
																			? "text-green-600"
																			: "text-orange-600"
																	}`}
																>
																	{(o.paymentMethod === "razorpay" &&
																		o.razorpayPaymentId) ||
																	o.paymentStatus === "completed"
																		? "COMPLETED"
																		: "PENDING"}
																</p>
															</div>
														</div>
														{/* Items purchased */}
														{Array.isArray(o.items) && o.items.length > 0 && (
															<div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
																{o.items.map((it, idx) => (
																	<div
																		key={idx}
																		className="flex justify-between text-xs sm:text-sm text-gray-700"
																	>
																		<span>
																			{it.crop?.cropName || "Crop"} •{" "}
																			{it.quantity} {it.crop?.unit || "quintal"}{" "}
																			× ₹
																			{Number(
																				it.pricePerUnit || 0
																			).toLocaleString()}
																		</span>
																		<span className="font-semibold">
																			₹{Number(it.total || 0).toLocaleString()}
																		</span>
																	</div>
																))}
															</div>
														)}
													</div>
												))}
										</div>
										{/* Pagination */}
										{transactions.length > itemsPerPage && (
											<div className="flex justify-end items-center gap-2 mt-4">
												<button
													onClick={() =>
														setPageTransactions(
															Math.max(0, pageTransactions - 1)
														)
													}
													disabled={pageTransactions === 0}
													className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base"
												>
													{tr("Prev")}
												</button>
												<button
													onClick={() =>
														setPageTransactions(
															(pageTransactions + 1) %
																Math.ceil(transactions.length / itemsPerPage)
														)
													}
													disabled={
														pageTransactions >=
														Math.ceil(transactions.length / itemsPerPage) - 1
													}
													className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base"
												>
													{tr("Next")}
												</button>
											</div>
										)}
									</>
								);
							})()}
						</div>
					) : activeTab === "my-ratings" ? (
						<MyRatingsTab />
					) : activeTab === "ratings-received" ? (
						<RatingsReceivedTab />
					) : (
						<div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-8">
							{cart.length === 0 ? (
								<div className="text-center py-8 sm:py-16">
									<div className="bg-gray-100 w-20 sm:w-32 h-20 sm:h-32 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
										<FontAwesomeIcon
											icon={faShoppingBag}
											className="text-gray-400"
											size="3x"
										/>
									</div>
									<h3 className="text-lg sm:text-2xl font-bold text-gray-800 mb-3">
										{tr("Your cart is empty")}
									</h3>
									<p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
										{tr("Discover fresh crops from local farmers")}
									</p>
									<button
										onClick={() => navigate("/crops")}
										className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 sm:px-10 py-2 sm:py-4 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-semibold text-sm sm:text-lg"
									>
										{tr("Start Shopping")}
									</button>
								</div>
							) : (
								<div>
									<h3 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 flex items-center gap-2 sm:gap-3">
										<FontAwesomeIcon
											icon={faShoppingBag}
											className="text-green-600"
										/>
										{tr("Shopping Cart")}
										<span className="text-gray-500 text-sm sm:text-lg">
											({cart.length} {tr("items")})
										</span>
									</h3>

									<div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
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
													className="flex flex-col sm:flex-row items-center justify-between border-2 border-gray-200 p-3 sm:p-5 rounded-lg sm:rounded-2xl hover:border-green-300 hover:shadow-lg transition-all duration-200 relative bg-gradient-to-r from-white to-gray-50"
												>
													<div className="flex-1 mb-3 sm:mb-4 md:mb-0">
														<h4 className="font-bold text-gray-900 text-lg sm:text-xl mb-2">
															{itemName}
														</h4>
														<p className="text-base sm:text-lg text-gray-700 mb-2">
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
															<p className="text-xs sm:text-sm text-gray-600">
																{tr("Available:")}{" "}
																<span className="font-bold text-gray-800">
																	{availableQty} {unit}
																</span>
															</p>
														</div>
													</div>

													<div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 w-full sm:w-auto">
														{/* Quantity Controls */}
														<div className="flex flex-col items-center gap-2">
															<div className="flex items-center gap-2 border-2 border-gray-300 rounded-lg sm:rounded-xl bg-white shadow-sm">
																<button
																	onClick={() =>
																		handleUpdateQuantity(
																			itemId,
																			quantity - 1,
																			availableQty
																		)
																	}
																	disabled={isAtMinQuantity}
																	className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-green-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-l-lg sm:rounded-l-xl"
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

																<span className="px-4 sm:px-6 font-bold text-lg sm:text-xl min-w-[40px] sm:min-w-[50px] text-center text-gray-900">
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
																	className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-green-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-r-lg sm:rounded-r-xl"
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
																<span className="text-xs text-orange-600 font-semibold bg-orange-100 px-2 sm:px-3 py-1 rounded-full">
																	Max stock reached
																</span>
															)}
														</div>

														{/* Line Total */}
														<div className="text-right min-w-[120px] sm:min-w-[140px]">
															<p className="text-xs sm:text-sm text-gray-500 mb-1">
																Total
															</p>
															<p className="font-bold text-gray-900 text-xl sm:text-2xl">
																₹{lineTotal.toLocaleString()}
															</p>
														</div>

														{/* Remove Button */}
														<button
															onClick={() => handleRemoveFromCart(itemId)}
															className="text-red-600 hover:bg-red-50 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors ml-2"
															title="Remove from cart"
														>
															<FontAwesomeIcon icon={faTrash} size="lg" />
														</button>
													</div>

													{isAtMaxQuantity && (
														<div className="absolute -top-3 -right-3">
															<span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full shadow-lg">
																MAX
															</span>
														</div>
													)}
												</div>
											);
										})}
									</div>

									{/* Cart Summary */}
									<div className="border-t-2 border-gray-300 pt-4 sm:pt-6 mb-6 sm:mb-8">
										<div className="flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-lg sm:rounded-2xl shadow-md">
											<span className="text-lg sm:text-2xl font-bold text-gray-800">
												Cart Total:
											</span>
											<span className="text-2xl sm:text-4xl font-bold text-green-600">
												₹{cartTotal.toLocaleString()}
											</span>
										</div>
									</div>

									{/* Checkout Button */}
									<button
										onClick={() => setShowCheckoutModal(true)}
										className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 sm:px-8 py-3 sm:py-5 rounded-lg sm:rounded-2xl transition-all duration-200 font-bold text-sm sm:text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
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
													className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
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
													className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
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
													className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
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
													className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
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
													className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
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
													className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
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
												<span className="font-semibold text-green-600">
													FREE
												</span>
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
													{tr("Mark as Received")}
												</>
											)}
										</button>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				<DashboardFooter
					actions={
						activeTab === "transactions"
							? []
							: [
									{
										label: tr("Browse Crops"),
										onClick: () => navigate("/crops"),
									},
									{ label: tr("My Cart"), onClick: () => setActiveTab("cart") },
									{
										label: tr("My Orders"),
										onClick: () => setActiveTab("orders"),
									},
							  ]
					}
					role="Buyer"
					fullWidth
				/>

				{/* Rating Modal */}
				<RatingModal
					isOpen={ratingModal.isOpen}
					onClose={() => setRatingModal({ isOpen: false, data: null })}
					{...ratingModal.data}
					onRatingSubmitted={() => {
						fetchOrders();
					}}
				/>
				<Calculator />
			</div>
		</div>
	);
}

export default BuyerDashboard;
