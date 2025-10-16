import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../config/api";
import toast from "react-hot-toast";


import {
	ShoppingCart,
	Package,
	Truck,
	Calendar,
	XCircle,
	CheckCircle,
	Clock,
	CreditCard,
	Loader,
	Trash2,
	Plus,
	Minus,
	LogOut,
} from "lucide-react";

// ✅ ADD THESE HELPER FUNCTIONS BEFORE function BuyerDashboard()

// Safe helpers to normalize cart item data

// ✅ NEW: Get available quantity from crop
const getAvailableQuantity = (item) => {
    return Number(item?.availableQuantity || item?.crop?.quantity || 999);
};

const getItemId = (item) => {
    return item?.itemId?.toString() || item?._id?.toString() || item?.crop?._id?.toString() || "";
};

const getItemName = (item) => {
    return item?.name || item?.cropName || item?.crop?.cropName || "Unknown Item";
};

const getUnitPrice = (item) => {
    return Number(item?.price || item?.pricePerUnit || item?.crop?.pricePerUnit || 0);
};

const getQuantity = (item) => {
    return Number(item?.quantity || 1);
};

const getItemUnit = (item) => {
    return item?.unit || item?.crop?.unit || "quintal";
};


function BuyerDashboard() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const [activeTab, setActiveTab] = useState("orders");
	const [orders, setOrders] = useState([]);
	const [cart, setCart] = useState([]);
	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState(false);
	const [searchParams] = useSearchParams();



	// Checkout Modal State
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

	useEffect(() => {
		// Get tab from URL query params
		const params = new URLSearchParams(location.search);
		const tab = params.get("tab");
		if (tab) setActiveTab(tab);

		fetchOrders();
		fetchCart();
	}, [location]);

	useEffect(() => {
		const tabParam = searchParams.get("tab");
		if (tabParam) {
			setActiveTab(tabParam);
		}
	}, [searchParams]);

	const fetchOrders = async () => {
		try {
			const { data } = await api.get("/orders/buyer");
			setOrders(data.orders || []);
		} catch (error) {
			console.error("Fetch orders error:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchCart = async () => {
		try {
			const { data } = await api.get("/cart");
			// ✅ FIXED: Backend returns data.cart, not data.cartItems
			setCart(data.cart || []);
			console.log("Cart fetched:", data.cart); // Debug log
		} catch (error) {
			console.error("Fetch cart error:", error);
		}
	};

	// ✅ UPDATED: Remove from cart
	const handleRemoveFromCart = async (itemId) => {
		if (!window.confirm("Remove this item from cart?")) return;

		try {
			// ✅ FIXED: Correct API endpoint
			await api.delete(`/cart/remove/${itemId}`);
			toast.success("Removed from cart");
			fetchCart();
		} catch (error) {
			console.error("Remove cart error:", error);
			toast.error("Failed to remove item");
		}
	};

	// ✅ UPDATED: Handle quantity update with strict validation
	const handleUpdateQuantity = async (itemId, newQuantity, maxAvailable) => {
		// ✅ Validate minimum
		if (newQuantity < 1) {
			toast.error("Quantity cannot be less than 1");
			return;
		}

		// ✅ STRICT: Validate maximum against available stock
		if (newQuantity > maxAvailable) {
			toast.error(
				`⚠️ Only ${maxAvailable} ${getItemUnit(
					cart.find((item) => getItemId(item) === itemId)
				)} available!`
			);
			return;
		}

		try {
			const response = await api.put("/cart/update", {
				itemId: itemId,
				quantity: newQuantity,
			});

			if (response.data.success) {
				toast.success("✅ Quantity updated");
				fetchCart(); // Refresh cart
			}
		} catch (error) {
			console.error("Update quantity error:", error);

			// ✅ Show backend error message if stock validation fails
			const errorMsg =
				error.response?.data?.message || "Failed to update quantity";
			toast.error(errorMsg);

			// ✅ If backend returns available quantity, refresh cart
			if (error.response?.data?.availableQuantity) {
				fetchCart();
			}
		}
	};

	// ✅ UPDATED: Calculate cart total using helper functions
	const cartTotal = cart.reduce(
		(sum, item) => sum + getUnitPrice(item) * getQuantity(item),
		0
	);

	// ✅ FIXED: Razorpay checkout with proper key validation
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
			// ✅ Check if Razorpay key exists
			const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

			if (!razorpayKey) {
				console.error("Razorpay Key ID is missing!");
				toast.error("Payment configuration error. Please contact support.");
				setProcessing(false);
				return;
			}

			console.log("Using Razorpay Key:", razorpayKey); // Debug log

			// Create Razorpay order
			const { data: orderData } = await api.post(
				"/orders/create-razorpay-order",
				{ amount: cartTotal }
			);

			console.log("Razorpay Order Created:", orderData.order); // Debug log

			// ✅ Check if Razorpay script is loaded
			if (typeof window.Razorpay === "undefined") {
				console.error("Razorpay script not loaded!");
				toast.error("Payment gateway not loaded. Please refresh the page.");
				setProcessing(false);
				return;
			}

			// Open Razorpay checkout
			const options = {
				key: razorpayKey, // ✅ Use validated key
				amount: orderData.order.amount,
				currency: orderData.order.currency || "INR",
				name: "Crop Connect",
				description: "Cart Checkout",
				order_id: orderData.order.id,
				handler: async function (response) {
					console.log("Payment Success:", response);
					await createOrderFromCart({
						razorpayOrderId: response.razorpay_order_id,
						razorpayPaymentId: response.razorpay_payment_id,
						razorpaySignature: response.razorpay_signature,
					});
				},
				prefill: {
					name: user.name || "",
					email: user.email || "",
					contact: user.phone || "",
				},
				theme: { color: "#10b981" },
				modal: {
					ondismiss: function () {
						console.log("Payment modal closed");
						setProcessing(false);
					},
				},
			};

			const razorpayInstance = new window.Razorpay(options);

			razorpayInstance.on("payment.failed", function (response) {
				console.error("Payment Failed:", response.error);
				toast.error("Payment failed! Please try again.");
				setProcessing(false);
			});

			razorpayInstance.open();
		} catch (error) {
			console.error("Razorpay checkout error:", error);
			toast.error(error.response?.data?.message || "Checkout failed");
			setProcessing(false);
		}
	};

	// Checkout with Pay After Delivery
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

	// ✅ FIXED: Create Order from Cart
	const createOrderFromCart = async (paymentDetails) => {
		try {
			setProcessing(true);

			// ✅ FIX 1: Format fullAddress as STRING (not object)
			const fullAddress = `${user.village || ""}, ${user.district || ""}, ${
				user.state || ""
			}, ${user.pincode || ""}`.trim();

			const orderData = {
				items: cart.map((item) => ({
					crop: getItemId(item), // ✅ This is the crop ID
					quantity: getQuantity(item),
					pricePerUnit: getUnitPrice(item),
					total: getUnitPrice(item) * getQuantity(item),
				})),
				totalAmount: cartTotal,
				paymentMethod,
				vehicleDetails,
				pickupSchedule,
				// ✅ FIX 2: deliveryAddress with STRING fullAddress
				deliveryAddress: {
					village: user.village || "",
					district: user.district || "",
					state: user.state || "",
					pincode: user.pincode || "",
					fullAddress: fullAddress, // ✅ NOW IT'S A STRING
				},
				// ✅ Payment details from Razorpay
				...paymentDetails,
			};

			console.log("Creating order with data:", orderData); // Debug

			const response = await api.post("/orders/create", orderData);

			if (response.data.success) {
				toast.success("🎉 Order placed successfully!");
				setShowCheckoutModal(false);
				fetchOrders();
				fetchCart();
				setActiveTab("orders");
			}
		} catch (error) {
			console.error("Create order error:", error);
			toast.error(error.response?.data?.message || "Order creation failed");
		} finally {
			setProcessing(false);
		}
	};

	// Cancel Order
	const handleCancelOrder = async (orderId) => {
		const reason = prompt("Reason for cancellation:");
		if (!reason) return;

		try {
			await api.put(`/orders/${orderId}/cancel`, { reason });
			toast.success("Order cancelled");
			fetchOrders();
		} catch (error) {
			console.error("Cancel order error:", error);
			toast.error(error.response?.data?.message || "Failed to cancel");
		}
	};

	const getStatusColor = (status) => {
		const colors = {
			pending: "bg-yellow-100 text-yellow-800",
			confirmed: "bg-blue-100 text-blue-800",
			picked: "bg-purple-100 text-purple-800",
			completed: "bg-green-100 text-green-800",
			cancelled: "bg-red-100 text-red-800",
		};
		return colors[status] || "bg-gray-100 text-gray-800";
	};

	const getStatusIcon = (status) => {
		const icons = {
			pending: <Clock className="text-yellow-600" size={20} />,
			confirmed: <CheckCircle className="text-blue-600" size={20} />,
			picked: <Truck className="text-purple-600" size={20} />,
			completed: <CheckCircle className="text-green-600" size={20} />,
			cancelled: <XCircle className="text-red-600" size={20} />,
		};
		return icons[status] || <Package size={20} />;
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader className="animate-spin text-green-600" size={40} />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white shadow">
				<div className="max-w-7xl mx-auto px-4 py-6">
					<div className="flex justify-between items-center">
						<div>
							<h1 className="text-3xl font-bold text-gray-900">
								Buyer Dashboard
							</h1>
							<p className="text-gray-600">Welcome, {user?.name}</p>
						</div>
						<div className="flex gap-4">
							<button
								onClick={() => navigate("/crops")}
								className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
							>
								Browse Crops
							</button>
							<button
								onClick={logout}
								className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
							>
								Logout
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Stats */}
			<div className="max-w-7xl mx-auto px-4 py-8">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<div className="bg-white p-6 rounded-lg shadow">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-600">Total Orders</p>
								<p className="text-3xl font-bold text-gray-900">
									{orders.length}
								</p>
							</div>
							<Package className="text-blue-600" size={40} />
						</div>
					</div>

					<div className="bg-white p-6 rounded-lg shadow">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-600">Active Orders</p>
								<p className="text-3xl font-bold text-gray-900">
									{
										orders.filter(
											(o) => o.status === "confirmed" || o.status === "picked"
										).length
									}
								</p>
							</div>
							<Truck className="text-orange-600" size={40} />
						</div>
					</div>

					<div className="bg-white p-6 rounded-lg shadow">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-600">Total Spent</p>
								<p className="text-3xl font-bold text-green-600">
									₹
									{orders
										.filter((o) => o.status !== "cancelled")
										.reduce((sum, o) => sum + o.totalAmount, 0)
										.toLocaleString()}
								</p>
							</div>
							<ShoppingCart className="text-green-600" size={40} />
						</div>
					</div>
				</div>

				{/* Tabs */}
				<div className="bg-white rounded-lg shadow mb-6">
					<div className="border-b border-gray-200">
						<div className="flex gap-4 px-6">
							<button
								onClick={() => setActiveTab("orders")}
								className={`py-4 px-6 font-semibold border-b-2 transition-colors ${
									activeTab === "orders"
										? "border-green-600 text-green-600"
										: "border-transparent text-gray-600 hover:text-gray-900"
								}`}
							>
								Orders ({orders.length})
							</button>

							<button
								onClick={() => setActiveTab("cart")}
								className={`py-4 px-6 font-semibold border-b-2 transition-colors ${
									activeTab === "cart"
										? "border-green-600 text-green-600"
										: "border-transparent text-gray-600 hover:text-gray-900"
								}`}
							>
								Cart ({cart.length})
							</button>
						</div>
					</div>

					<div className="p-6">
						{/* Orders Tab */}
						{activeTab === "orders" && (
							<div className="space-y-6">
								{orders.length === 0 ? (
									<div className="text-center py-12">
										<Package className="mx-auto text-gray-400 mb-4" size={48} />
										<p className="text-gray-600">No orders yet</p>
									</div>
								) : (
									orders.map((order) => (
										<div
											key={order._id}
											className="border border-gray-200 rounded-lg p-6"
										>
											{/* Order Header */}
											<div className="flex justify-between items-start mb-4">
												<div>
													<h3 className="text-lg font-bold text-gray-900">
														Order #{order._id.substring(0, 8)}
													</h3>
													<p className="text-sm text-gray-600">
														Placed on{" "}
														{new Date(order.createdAt).toLocaleDateString()}
													</p>
													<p className="text-sm text-gray-600">
														Seller: {order.seller?.name} | {order.seller?.phone}
													</p>
												</div>
												<div className="flex items-center gap-2">
													{getStatusIcon(order.status)}
													<span
														className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
															order.status
														)}`}
													>
														{order.status.toUpperCase()}
													</span>
												</div>
											</div>

											{/* Order Items */}
											<div className="space-y-2 mb-4">
												{order.items.map((item, idx) => (
													<div
														key={idx}
														className="flex justify-between items-center bg-gray-50 p-3 rounded"
													>
														<div>
															<p className="font-medium">
																{item.crop?.cropName || "Crop"}
															</p>
															<p className="text-sm text-gray-600">
																{item.quantity} quintal × ₹{item.pricePerUnit}
															</p>
														</div>
														<p className="font-bold">
															₹{item.total.toLocaleString()}
														</p>
													</div>
												))}
											</div>

											{/* Vehicle & Pickup Details */}
											<div className="grid md:grid-cols-2 gap-4 mb-4 p-4 bg-blue-50 rounded-lg">
												<div>
													<h4 className="font-semibold text-sm mb-2">
														Vehicle Details
													</h4>
													<p className="text-sm">
														Type: {order.vehicleDetails.vehicleType}
													</p>
													<p className="text-sm">
														Number: {order.vehicleDetails.vehicleNumber}
													</p>
													<p className="text-sm">
														Driver: {order.vehicleDetails.driverName}
													</p>
													<p className="text-sm">
														Phone: {order.vehicleDetails.driverPhone}
													</p>
												</div>
												<div>
													<h4 className="font-semibold text-sm mb-2">
														Pickup Schedule
													</h4>
													<p className="text-sm">
														Date:{" "}
														{new Date(
															order.pickupSchedule.date
														).toLocaleDateString()}
													</p>
													<p className="text-sm capitalize">
														Time: {order.pickupSchedule.timeSlot}
													</p>
													<p className="text-sm mt-2 font-semibold">
														Payment:{" "}
														{order.paymentMethod === "razorpay"
															? "Paid Online"
															: "Pay After Delivery"}
													</p>
												</div>
											</div>

											{/* Total */}
											<div className="flex justify-between items-center pt-4 border-t border-gray-200">
												<p className="text-lg font-bold">Total Amount:</p>
												<p className="text-2xl font-bold text-green-600">
													₹{order.totalAmount.toLocaleString()}
												</p>
											</div>

											{/* Actions */}
											{order.status === "pending" ||
											order.status === "confirmed" ? (
												<div className="mt-4 flex gap-3">
													<button
														onClick={() => handleCancelOrder(order._id)}
														className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
													>
														<XCircle size={18} />
														Cancel Order
													</button>
												</div>
											) : null}
										</div>
									))
								)}
							</div>
						)}

						{/* Cart Tab */}
						{activeTab === "cart" && (
							<div className="bg-white rounded-lg shadow-md p-6">
								{cart.length === 0 ? (
									<div className="text-center py-12">
										<ShoppingCart
											className="mx-auto text-gray-400 mb-4"
											size={48}
										/>
										<p className="text-gray-600 text-lg">Your cart is empty</p>
										<button
											onClick={() => navigate("/crops")}
											className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
										>
											Browse Crops
										</button>
									</div>
								) : (
									<div>
										<h3 className="text-xl font-bold mb-4">
											Shopping Cart ({cart.length})
										</h3>

										<div className="space-y-4 mb-6">
											{cart.map((item, index) => {
												const itemId = getItemId(item);
												const itemName = getItemName(item);
												const unitPrice = getUnitPrice(item);
												const quantity = getQuantity(item);
												const unit = getItemUnit(item);
												const availableQty = getAvailableQuantity(item);
												const lineTotal = unitPrice * quantity;

												// ✅ Check if at max quantity
												const isAtMaxQuantity = quantity >= availableQty;
												const isAtMinQuantity = quantity <= 1;

												return (
													<div
														key={index}
														className="flex items-center justify-between border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow relative"
													>
														<div className="flex-1">
															<h4 className="font-semibold text-gray-900 text-lg">
																{itemName}
															</h4>
															<p className="text-sm text-gray-600">
																₹{unitPrice.toLocaleString()}/{unit}
															</p>
															{/* ✅ Show available stock */}
															<p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
																<span
																	className={`inline-block w-2 h-2 rounded-full ${
																		availableQty > 5
																			? "bg-green-500"
																			: "bg-orange-500"
																	}`}
																></span>
																Available:{" "}
																<span className="font-semibold">
																	{availableQty} {unit}
																</span>
															</p>
														</div>

														<div className="flex items-center gap-4">
															{/* ✅ Quantity Controls with strict validation */}
															<div className="flex flex-col items-center gap-1">
																<div className="flex items-center gap-2 border border-gray-300 rounded-lg">
																	<button
																		onClick={() =>
																			handleUpdateQuantity(
																				itemId,
																				quantity - 1,
																				availableQty
																			)
																		}
																		disabled={isAtMinQuantity}
																		className="px-3 py-2 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
																		title={
																			isAtMinQuantity
																				? "Minimum quantity is 1"
																				: "Decrease quantity"
																		}
																	>
																		<Minus size={16} />
																	</button>

																	<span className="px-4 font-bold text-lg min-w-[40px] text-center">
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
																		className="px-3 py-2 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
																		title={
																			isAtMaxQuantity
																				? `Maximum ${availableQty} ${unit} available`
																				: "Increase quantity"
																		}
																	>
																		<Plus size={16} />
																	</button>
																</div>

																{/* ✅ Show max quantity warning */}
																{isAtMaxQuantity && (
																	<span className="text-xs text-orange-600 font-medium">
																		Max stock
																	</span>
																)}
															</div>

															<p className="font-bold text-gray-900 w-32 text-right text-lg">
																₹{lineTotal.toLocaleString()}
															</p>

															<button
																onClick={() => handleRemoveFromCart(itemId)}
																className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
																title="Remove from cart"
															>
																<Trash2 size={20} />
															</button>
														</div>

														{/* ✅ Visual indicator when at max quantity */}
														{isAtMaxQuantity && (
															<div className="absolute -top-2 -right-2">
																<span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full shadow-md">
																	Max
																</span>
															</div>
														)}
													</div>
												);
											})}
										</div>

										{/* Cart Total */}
										<div className="border-t border-gray-300 pt-4 mb-6">
											<div className="flex justify-between items-center text-xl font-bold">
												<span>Total:</span>
												<span className="text-green-600">
													₹{cartTotal.toLocaleString()}
												</span>
											</div>
										</div>

										{/* Checkout Button */}
										<button
											onClick={() => setShowCheckoutModal(true)}
											className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
										>
											<ShoppingCart size={20} />
											Proceed to Checkout
										</button>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Checkout Modal - Same as CropDetails */}
			{showCheckoutModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						<div className="p-6">
							<h2 className="text-2xl font-bold mb-6">Complete Your Order</h2>

							{/* Vehicle Details Form */}
							<div className="mb-6">
								<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
									<Truck className="text-green-600" size={20} />
									Vehicle Details
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium mb-2">
											Vehicle Type
										</label>
										<select
											value={vehicleDetails.vehicleType}
											onChange={(e) =>
												setVehicleDetails({
													...vehicleDetails,
													vehicleType: e.target.value,
												})
											}
											className="w-full border border-gray-300 rounded-lg px-4 py-2"
										>
											<option value="">Select Type</option>
											<option value="Truck">Truck</option>
											<option value="Tempo">Tempo</option>
											<option value="Tractor">Tractor</option>
											<option value="Mini Truck">Mini Truck</option>
										</select>
									</div>
									<div>
										<label className="block text-sm font-medium mb-2">
											Vehicle Number
										</label>
										<input
											type="text"
											placeholder="AP09XX1234"
											value={vehicleDetails.vehicleNumber}
											onChange={(e) =>
												setVehicleDetails({
													...vehicleDetails,
													vehicleNumber: e.target.value,
												})
											}
											className="w-full border border-gray-300 rounded-lg px-4 py-2"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-2">
											Driver Name
										</label>
										<input
											type="text"
											placeholder="Driver name"
											value={vehicleDetails.driverName}
											onChange={(e) =>
												setVehicleDetails({
													...vehicleDetails,
													driverName: e.target.value,
												})
											}
											className="w-full border border-gray-300 rounded-lg px-4 py-2"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-2">
											Driver Phone
										</label>
										<input
											type="tel"
											placeholder="Phone number"
											value={vehicleDetails.driverPhone}
											onChange={(e) =>
												setVehicleDetails({
													...vehicleDetails,
													driverPhone: e.target.value,
												})
											}
											className="w-full border border-gray-300 rounded-lg px-4 py-2"
										/>
									</div>
								</div>
							</div>

							{/* Pickup Schedule */}
							<div className="mb-6">
								<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
									<Calendar className="text-green-600" size={20} />
									Pickup Schedule
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium mb-2">
											Pickup Date
										</label>
										<input
											type="date"
											min={new Date().toISOString().split("T")[0]}
											value={pickupSchedule.date}
											onChange={(e) =>
												setPickupSchedule({
													...pickupSchedule,
													date: e.target.value,
												})
											}
											className="w-full border border-gray-300 rounded-lg px-4 py-2"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium mb-2">
											Time Slot
										</label>
										<select
											value={pickupSchedule.timeSlot}
											onChange={(e) =>
												setPickupSchedule({
													...pickupSchedule,
													timeSlot: e.target.value,
												})
											}
											className="w-full border border-gray-300 rounded-lg px-4 py-2"
										>
											<option value="morning">Morning (6 AM - 12 PM)</option>
											<option value="afternoon">
												Afternoon (12 PM - 4 PM)
											</option>
											<option value="evening">Evening (4 PM - 7 PM)</option>
										</select>
									</div>
								</div>
							</div>

							{/* Payment Method */}
							<div className="mb-6">
								<h3 className="text-lg font-semibold mb-4">Payment Method</h3>
								      <div className="space-y-3">
    <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
        <input
            type="radio"
            name="paymentMethod"
            value="razorpay"
            checked={paymentMethod === "razorpay"}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-4 h-4"
        />
        <span className="font-medium">Pay with Razorpay (Online)</span>
    </label>

    <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
        <input
            type="radio"
            name="paymentMethod"
            value="payAfterDelivery" 
            checked={paymentMethod === "payAfterDelivery"}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-4 h-4"
        />
        <span className="font-medium">Pay After Delivery (Cash on Delivery)</span>
    </label>
</div>
							</div>

							{/* Cart Summary */}
							<div className="bg-green-50 p-4 rounded-lg mb-6">
								<h3 className="font-semibold mb-2">Order Summary</h3>
								{cart.map((item) => (
									<div
										key={item._id}
										className="flex justify-between text-sm mb-1"
									>
										<span>
											{item.crop?.cropName} × {item.quantity}
										</span>
										<span>
											₹{(item.quantity * item.pricePerUnit).toLocaleString()}
										</span>
									</div>
								))}
								<div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-green-200">
									<span>Total:</span>
									<span>₹{cartTotal.toLocaleString()}</span>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-4">
								<button
									onClick={() => setShowCheckoutModal(false)}
									disabled={processing}
									className="flex-1 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 font-semibold"
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
									className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
								>
									{processing ? (
										<>
											<Loader className="animate-spin" size={20} />
											Processing...
										</>
									) : (
										<>
											{paymentMethod === "razorpay" ? "Pay Now" : "Place Order"}
										</>
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default BuyerDashboard;
