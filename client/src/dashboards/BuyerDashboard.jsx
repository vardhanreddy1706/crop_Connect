// src/pages/dashboards/BuyerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotificationContext } from "../context/NotificationContext";
import { io } from "socket.io-client";
import {
	ShoppingCart,
	Package,
	TrendingUp,
	Search,
	Trash2,
	Plus,
	Minus,
	Phone,
	Mail,
	Facebook,
	Instagram,
	Twitter,
} from "lucide-react";
import api from "../config/api";
import toast from "react-hot-toast";
import { NotificationBell } from "../components/NotificationBell";
import logo from "/cc.png";

// Safe helpers to normalize both flat and nested cart item shapes
const getUnitPrice = (item) =>
	Number(item?.price ?? item?.pricePerUnit ?? item?.crop?.pricePerUnit ?? 0);

const getQuantity = (item) => Number(item?.quantity ?? 1);

const getItemId = (item) =>
	(item?.itemId ?? item?.crop?._id ?? item?._id ?? "").toString();

const getItemName = (item) => item?.name ?? item?.crop?.cropName ?? "Unknown";

const getItemUnit = (item) => item?.unit ?? item?.crop?.unit ?? "unit";

const BuyerDashboard = () => {
	const { user } = useAuth();
	const { addNotification } = useNotificationContext();
	const navigate = useNavigate();

	const [orders, setOrders] = useState([]);
	const [cart, setCart] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [activeTab, setActiveTab] = useState("orders");

	const [stats, setStats] = useState({
		totalOrders: 0,
		activeOrders: 0,
		totalSpent: 0,
	});

	// Socket.io setup for real-time updates
	useEffect(() => {
		const socket = io(
			import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
		);

		if (user?._id) {
			socket.emit("join", user._id);
			socket.on("orderUpdate", (updatedOrder) => {
				setOrders((prev) =>
					prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
				);
				toast.success(
					`Order ${updatedOrder._id} status updated to ${updatedOrder.status}`
				);
			});
		}

		return () => {
			socket.disconnect();
		};
	}, [user?._id]);

	// Fetch all data on mount and when user changes
	useEffect(() => {
		if (user?._id) {
			fetchDashboardData();
		}
	}, [user?._id]);

	const fetchDashboardData = async () => {
		setLoading(true);
		try {
			if (!user || !localStorage.getItem("token")) {
				toast.error("Please log in to view your dashboard");
				navigate("/login");
				return;
			}

			const [ordersRes, cartRes] = await Promise.all([
				api.get("/orders/my-orders"),
				api.get("/cart"),
			]);

			if (ordersRes.data?.success) {
				const allOrders = ordersRes.data.orders || [];
				setOrders(allOrders);

				const activeOrders = allOrders.filter(
					(o) => !["delivered", "cancelled"].includes(o.status)
				);
				const totalSpent = activeOrders.reduce(
					(sum, order) => sum + Number(order?.totalAmount ?? 0),
					0
				);

				setStats({
					totalOrders: allOrders.length,
					activeOrders: activeOrders.length,
					totalSpent,
				});
			}

			if (cartRes.data?.success) {
				const cartItems = Array.isArray(cartRes.data.cart)
					? cartRes.data.cart
					: [];
				setCart(cartItems);
			}
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
			toast.error(
				error.response?.data?.message || "Failed to load dashboard data"
			);
		} finally {
			setLoading(false);
		}
	};

	// Add to cart
	const addToCart = async (cropId, quantity = 1) => {
		try {
			if (!user) {
				toast.error("Please login to add to cart");
				return;
			}
			const res = await api.post("/cart/add", {
				items: [{ itemId: cropId, quantity: Math.max(1, quantity) }],
			});
			if (res.data?.success) {
				toast.success("Added to cart successfully!");
				await fetchDashboardData();
				localStorage.setItem("cartCount", String((res.data.cart || []).length));
				setActiveTab("cart");
			}
		} catch (error) {
			console.error("Error adding to cart:", error);
			toast.error(error.response?.data?.message || "Failed to add to cart");
		}
	};

	// Update cart quantity (supports flat and nested ids)
	const updateCartQuantity = async (itemIdOrItem, quantity) => {
		try {
			const id =
				typeof itemIdOrItem === "string"
					? itemIdOrItem
					: getItemId(itemIdOrItem);
			const res = await api.put("/cart/update", {
				itemId: id,
				quantity: Math.max(1, quantity),
			});
			if (res.data?.success) {
				await fetchDashboardData();
				localStorage.setItem("cartCount", String((res.data.cart || []).length));
				toast.success("Cart updated successfully");
			}
		} catch (error) {
			console.error("Error updating cart:", error);
			toast.error(error.response?.data?.message || "Failed to update cart");
		}
	};

	// Remove item
	const removeFromCart = async (itemOrId) => {
		try {
			const id = typeof itemOrId === "string" ? itemOrId : getItemId(itemOrId);
			const res = await api.delete(`/cart/remove/${id}`);
			if (res.data?.success) {
				await fetchDashboardData();
				localStorage.setItem("cartCount", String((res.data.cart || []).length));
				toast.success("Item removed from cart");
			}
		} catch (error) {
			console.error("Error removing from cart:", error);
			toast.error(
				error.response?.data?.message || "Failed to remove from cart"
			);
		}
	};

	// Cancel order
	const cancelOrder = async (orderId) => {
		let originalOrderStatus = null;

		try {
			if (!orderId) {
				toast.error("Invalid order");
				return;
			}

			const orderToCancel = orders.find((order) => order._id === orderId);
			if (!orderToCancel) {
				toast.error("Order not found");
				return;
			}

			originalOrderStatus = orderToCancel.status;

			if (!["pending", "processing"].includes(originalOrderStatus)) {
				toast.error("This order cannot be cancelled at this time");
				return;
			}

			// Optimistic UI
			setOrders((prevOrders) =>
				prevOrders.map((order) =>
					order._id === orderId ? { ...order, status: "cancelled" } : order
				)
			);

			const newActiveOrders = orders.filter(
				(o) =>
					o._id !== orderId && !["delivered", "cancelled"].includes(o.status)
			);

			const newTotalSpent = newActiveOrders.reduce(
				(sum, order) => sum + Number(order?.totalAmount ?? 0),
				0
			);

			setStats((prevStats) => ({
				...prevStats,
				activeOrders: newActiveOrders.length,
				totalSpent: newTotalSpent,
			}));

			toast.success("Order cancelled successfully");

			await api.put(`/orders/${orderId}/cancel`);
		} catch (error) {
			console.error("Error cancelling order:", error);

			if (originalOrderStatus) {
				// Revert
				setOrders((prevOrders) =>
					prevOrders.map((order) =>
						order._id === orderId
							? { ...order, status: originalOrderStatus }
							: order
					)
				);

				const activeOrders = orders.filter(
					(o) => !["delivered", "cancelled"].includes(o.status)
				);
				const totalSpent = activeOrders.reduce(
					(sum, order) => sum + Number(order?.totalAmount ?? 0),
					0
				);

				setStats((prevStats) => ({
					...prevStats,
					activeOrders: activeOrders.length,
					totalSpent,
				}));
			}

			if (error.response?.status === 400) {
				toast.error(error.response.data.message || "Cannot cancel this order");
			} else if (error.response?.status === 403) {
				toast.error("You are not authorized to cancel this order");
			} else {
				toast.error("Failed to cancel order. Please try again.");
			}
		}
	};

	// Buy Crop Function (single)
	const buyCrop = async (crop, quantity = 1) => {
		try {
			if (!crop._id) {
				toast.error("Invalid crop data");
				return;
			}

			const total = Number(crop.pricePerUnit) * Number(quantity);

			await api.post("/orders/create", {
				orderType: "crop",
				items: [
					{
						itemId: crop._id.toString(),
						name: crop.cropName,
						quantity: Number(quantity),
						price: total,
					},
				],
				totalAmount: total,
			});

			toast.success("🎉 Thanks for buying! Order placed successfully.");

			fetchDashboardData();
			setActiveTab("orders");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to place order");
		}
	};

	// Checkout Cart: supports flat and nested shapes
	const checkoutCart = async () => {
		if (!Array.isArray(cart) || cart.length === 0) {
			toast.error("Cart is empty");
			return;
		}

		try {
			const items = cart.map((item) => ({
				itemId: getItemId(item),
				name: getItemName(item),
				quantity: getQuantity(item),
				price: getUnitPrice(item) * getQuantity(item),
			}));

			const totalAmount = cart.reduce(
				(sum, item) => sum + getUnitPrice(item) * getQuantity(item),
				0
			);

			await api.post("/orders/create", {
				orderType: "crop",
				items,
				totalAmount,
			});

			toast.success("🎉 Order placed successfully! Thanks for buying.");

			setCart([]);
			await fetchDashboardData();
			setActiveTab("orders");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to place order");
		}
	};

	// Filter and sort orders
	const filteredOrders = (orders || [])
		.filter((order) => {
			const matchesSearch = (order.items || []).some((item) =>
				(item.name || "").toLowerCase().includes(searchTerm.toLowerCase())
			);

			if (activeTab === "cancelled") {
				return matchesSearch && order.status === "cancelled";
			}

			if (activeTab === "orders") {
				if (order.status === "cancelled") {
					return false;
				}
				if (statusFilter !== "all") {
					return matchesSearch && order.status === statusFilter;
				}
				return matchesSearch;
			}

			return matchesSearch;
		})
		.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

	// Calculate cart total (safe)
	const cartTotal = (Array.isArray(cart) ? cart : []).reduce((sum, item) => {
		return sum + getUnitPrice(item) * getQuantity(item);
	}, 0);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm sticky top-0 z-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-6">
							<div>
								<h1 className="text-4xl font-bold text-gray-900">
									Buyer Dashboard
								</h1>
								<p className="text-sm text-gray-600">Welcome, {user?.name}</p>
							</div>
						</div>

						<div className="flex items-center gap-4">
							<button
								onClick={() => navigate("/crops")}
								className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
							>
								Buyer
							</button>

							<div className="relative">
								<button
									onClick={() => setActiveTab("cart")}
									className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
								>
									<ShoppingCart className="w-6 h-6" />
									{cart.length > 0 && (
										<span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-green-600 rounded-full">
											{cart.length}
										</span>
									)}
								</button>
							</div>

							<NotificationBell />

							<button
								onClick={() => {
									localStorage.removeItem("token");
									localStorage.removeItem("user");
									window.location.href = "/login";
								}}
								className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
							>
								<span>Logout</span>
							</button>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Statistics Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<StatCard
						title="Total Orders"
						value={stats.totalOrders}
						color="border-blue-500"
						icon={<Package className="w-8 h-8 text-blue-500" />}
					/>
					<StatCard
						title="Active Orders"
						value={stats.activeOrders}
						color="border-orange-500"
						icon={<TrendingUp className="w-8 h-8 text-orange-500" />}
					/>
					<StatCard
						title="Total Spent"
						value={`₹${stats.totalSpent.toLocaleString()}`}
						color="border-green-500"
						icon={<ShoppingCart className="w-8 h-8 text-green-500" />}
					/>
				</div>

				{/* Tabs */}
				<div className="bg-white rounded-lg shadow-md mb-6">
					<div className="flex border-b">
						<button
							onClick={() => setActiveTab("orders")}
							className={`px-6 py-3 font-medium transition ${
								activeTab === "orders"
									? "border-b-2 border-green-600 text-green-600"
									: "text-gray-600 hover:text-green-600"
							}`}
						>
							Orders ({orders.filter((o) => o.status !== "cancelled").length})
						</button>
						<button
							onClick={() => setActiveTab("cancelled")}
							className={`px-6 py-3 font-medium transition ${
								activeTab === "cancelled"
									? "border-b-2 border-red-600 text-red-600"
									: "text-gray-600 hover:text-red-600"
							}`}
						>
							Cancelled ({orders.filter((o) => o.status === "cancelled").length}
							)
						</button>
						<button
							onClick={() => setActiveTab("cart")}
							className={`px-6 py-3 font-medium transition ${
								activeTab === "cart"
									? "border-b-2 border-green-600 text-green-600"
									: "text-gray-600 hover:text-green-600"
							}`}
						>
							Cart ({cart.length})
						</button>
					</div>

					<div className="p-6">
						{/* Orders Tab */}
						{(activeTab === "orders" || activeTab === "cancelled") && (
							<>
								<div className="flex gap-4 mb-6">
									<div className="flex-1 relative">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
										<input
											type="text"
											placeholder="Search orders..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
										/>
									</div>

									{activeTab === "orders" && (
										<select
											value={statusFilter}
											onChange={(e) => setStatusFilter(e.target.value)}
											className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
										>
											<option value="all">All Status</option>
											<option value="pending">Pending</option>
											<option value="processing">Processing</option>
											<option value="in_transit">In Transit</option>
											<option value="delivered">Delivered</option>
										</select>
									)}
								</div>

								<div className="space-y-4">
									{activeTab === "orders" ? (
										orders.filter((order) => order.status !== "cancelled")
											.length === 0 ? (
											<div className="text-center py-12 text-gray-500">
												No active orders found
											</div>
										) : (
											filteredOrders
												.filter((order) => order.status !== "cancelled")
												.map((order) => (
													<OrderCard
														key={order._id}
														order={order}
														onCancel={cancelOrder}
													/>
												))
										)
									) : orders.filter((order) => order.status === "cancelled")
											.length === 0 ? (
										<div className="text-center py-12 text-gray-500">
											No cancelled orders found
										</div>
									) : (
										filteredOrders
											.filter((order) => order.status === "cancelled")
											.map((order) => (
												<OrderCard key={order._id} order={order} />
											))
									)}
								</div>
							</>
						)}

						{/* Cart Tab */}
						{activeTab === "cart" && (
							<>
								{cart.length === 0 ? (
									<div className="text-center py-12 text-gray-500">
										Your cart is empty
									</div>
								) : (
									<>
										<div className="space-y-4 mb-6">
											{cart.map((item) => (
												<CartItem
													key={getItemId(item)}
													item={item}
													onUpdateQuantity={(id, qty) =>
														updateCartQuantity(id, qty)
													}
													onRemove={(id) => removeFromCart(id)}
												/>
											))}
										</div>

										<div className="border-t pt-6">
											<div className="flex items-center justify-between mb-4">
												<span className="text-xl font-bold">Total:</span>
												<span className="text-2xl font-bold text-green-600">
													₹{cartTotal.toLocaleString()}
												</span>
											</div>
											<button
												onClick={checkoutCart}
												className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
											>
												Checkout
											</button>
										</div>
									</>
								)}
							</>
						)}
					</div>
				</div>
			</div>

			{/* Footer (new) */}
			<footer className="bg-gray-900 text-white py-12 px-4">
				<div className="max-w-7xl mx-auto">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
						{/* About Column */}
						<div>
							<div className="flex items-center space-x-3 mb-4">
								<img
									src={logo}
									alt="Crop Connect Logo"
									className="h-8 w-auto"
								/>
								<h3 className="text-2xl font-bold">Crop Connect</h3>
							</div>
							<p className="text-gray-400 leading-relaxed">
								Empowering farmers and transforming agriculture through
								technology. Building a sustainable and transparent agricultural
								ecosystem.
							</p>
						</div>

						{/* Contact Column */}
						<div>
							<h3 className="text-xl font-bold mb-4 flex items-center gap-2">
								<Phone className="w-5 h-5" />
								Contact Us
							</h3>
							<div className="space-y-3 text-gray-400">
								<div className="flex items-center gap-3">
									<Phone className="w-5 h-5 text-green-500" />
									<span>+91 98765 43210</span>
								</div>
								<div className="flex items-center gap-3">
									<Mail className="w-5 h-5 text-green-500" />
									<span>support@cropconnect.com</span>
								</div>
								<div className="flex items-center gap-3">
									<Mail className="w-5 h-5 text-green-500" />
									<span>info@cropconnect.com</span>
								</div>
							</div>
						</div>

						{/* Social Media Column */}
						<div>
							<h3 className="text-xl font-bold mb-4">Follow Us</h3>
							<p className="text-gray-400 mb-4">
								Stay connected on social media
							</p>
							<div className="flex gap-4">
								<a
									href="https://facebook.com"
									target="_blank"
									rel="noopener noreferrer"
									className="bg-blue-600 p-3 rounded-lg hover:bg-blue-700 transition-all"
								>
									<Facebook className="w-6 h-6" />
								</a>
								<a
									href="https://instagram.com"
									target="_blank"
									rel="noopener noreferrer"
									className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
								>
									<Instagram className="w-6 h-6" />
								</a>
								<a
									href="https://twitter.com"
									target="_blank"
									rel="noopener noreferrer"
									className="bg-sky-500 p-3 rounded-lg hover:bg-sky-600 transition-all"
								>
									<Twitter className="w-6 h-6" />
								</a>
								<a
									href="mailto:support@cropconnect.com"
									className="bg-green-600 p-3 rounded-lg hover:bg-green-700 transition-all"
								>
									<Mail className="w-6 h-6" />
								</a>
							</div>
						</div>
					</div>

					{/* Bottom Bar */}
					<div className="border-t border-gray-800 pt-8 text-center">
						<p className="text-gray-400">
							2025{" "}
							<span className="text-green-500 font-semibold">Crop Connect</span>
							. All rights reserved.
						</p>
						<p className="text-gray-500 text-sm mt-2">
							Made with love for Indian Farmers
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
};

// Stat Card Component
const StatCard = ({ title, value, color, icon }) => (
	<div className={`p-6 bg-white border-l-4 ${color} shadow-lg rounded-xl`}>
		<div className="flex items-center justify-between">
			<div>
				<p className="text-sm text-gray-600 mb-1">{title}</p>
				<p className="text-3xl font-bold text-gray-900">{value}</p>
			</div>
			<div>{icon}</div>
		</div>
	</div>
);

// Order Card Component
const OrderCard = ({ order, onCancel }) => {
	const statusColors = {
		pending: "bg-yellow-100 text-yellow-800",
		processing: "bg-blue-100 text-blue-800",
		in_transit: "bg-purple-100 text-purple-800",
		delivered: "bg-green-100 text-green-800",
		cancelled: "bg-red-100 text-red-800",
	};
	return (
		<div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
			<div className="flex items-center justify-between mb-3">
				<span className="text-sm text-gray-500">
					{new Date(order.createdAt).toLocaleDateString()}
				</span>
				<span
					className={`px-3 py-1 rounded-full text-xs font-medium ${
						statusColors[order.status]
					}`}
				>
					{order.status.replace("_", " ").toUpperCase()}
				</span>
			</div>

			{(order.items || []).map((item, idx) => (
				<div key={idx} className="mb-2">
					<p className="font-medium">{item.name}</p>
					<p className="text-sm text-gray-600">
						Quantity: {item.quantity} | Price: ₹{item.price}
					</p>
				</div>
			))}

			<div className="mt-3 pt-3 border-t flex justify-between items-center">
				<p className="font-bold text-lg">
					Total: ₹{Number(order.totalAmount || 0).toLocaleString()}
				</p>
				{onCancel && !["delivered", "cancelled"].includes(order.status) && (
					<button
						onClick={() => onCancel(order._id)}
						className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
						disabled={!["pending", "processing"].includes(order.status)}
					>
						Cancel Order
					</button>
				)}
			</div>
		</div>
	);
};

// Cart Item Component (supports flat and nested shapes)
const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
	const id = getItemId(item);
	const name = getItemName(item);
	const unit = getItemUnit(item);
	const qty = getQuantity(item);
	const unitPrice = getUnitPrice(item);
	const lineTotal = unitPrice * qty;

	return (
		<div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
			<div className="flex-1">
				<h3 className="font-bold">{name}</h3>
				<p className="text-lg font-bold text-green-600 mt-1">
					₹{unitPrice.toLocaleString()}/{unit}
				</p>
			</div>

			<div className="flex items-center gap-3">
				<button
					onClick={() => onUpdateQuantity(id, Math.max(1, qty - 1))}
					className="p-1 border rounded hover:bg-gray-100"
				>
					<Minus className="w-4 h-4" />
				</button>
				<span className="font-medium w-8 text-center">{qty}</span>
				<button
					onClick={() => onUpdateQuantity(id, qty + 1)}
					className="p-1 border rounded hover:bg-gray-100"
				>
					<Plus className="w-4 h-4" />
				</button>
			</div>

			<p className="font-bold text-lg w-24 text-right">
				₹{lineTotal.toLocaleString()}
			</p>

			<button
				onClick={() => onRemove(id)}
				className="text-red-500 hover:text-red-700"
			>
				<Trash2 className="w-5 h-5" />
			</button>
		</div>
	);
};

export default BuyerDashboard;
