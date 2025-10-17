import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import api from "../config/api";
import { toast } from "react-hot-toast";
import {
	Package,
	TrendingUp,
	ShoppingBag,
	CheckCircle,
	XCircle,
	Truck,
	Calendar,
	Phone,
	MapPin,
	DollarSign,
	User,
	Clock,
} from "lucide-react";

const FarmerCropStatus = () => {
	// const navigate = useNavigate();
	// const [activeTab, setActiveTab] = useState("orders");
	const [orders, setOrders] = useState([]);
	const [stats, setStats] = useState({
		totalSales: 0,
		pendingOrders: 0,
		completedOrders: 0,
		totalRevenue: 0,
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchSellerOrders();
	}, []);

	// ✅ Fetch farmer's orders (crops sold)
	const fetchSellerOrders = async () => {
		try {
			const { data } = await api.get("/orders/seller");
			setOrders(data.orders || []);
			calculateStats(data.orders || []);
		} catch (error) {
			console.error("Fetch seller orders error:", error);
			toast.error("Failed to fetch orders");
		} finally {
			setLoading(false);
		}
	};

	// ✅ Calculate dashboard statistics
	const calculateStats = (ordersList) => {
		const totalSales = ordersList.length;
		const pendingOrders = ordersList.filter(
			(o) => o.status === "pending" || o.status === "confirmed"
		).length;
		const completedOrders = ordersList.filter(
			(o) => o.status === "completed"
		).length;
		const totalRevenue = ordersList
			.filter((o) => o.paymentStatus === "completed")
			.reduce((sum, o) => sum + o.totalAmount, 0);

		setStats({
			totalSales,
			pendingOrders,
			completedOrders,
			totalRevenue,
		});
	};

	// ✅ Confirm order (farmer accepts)
	const handleConfirmOrder = async (orderId) => {
		if (!window.confirm("Confirm this order? Buyer will be notified.")) return;

		try {
			await api.put(`/orders/${orderId}/confirm`);
			toast.success("✅ Order confirmed!");
			fetchSellerOrders();
		} catch (error) {
			console.error("Confirm order error:", error);
			toast.error(error.response?.data?.message || "Failed to confirm");
		}
	};

	// ✅ Mark as picked (crops picked up by buyer)
	const handleMarkAsPicked = async (orderId) => {
		if (!window.confirm("Mark this order as picked up from your farm?")) return;

		try {
			await api.put(`/orders/${orderId}/picked`);
			toast.success("✅ Marked as picked up!");
			fetchSellerOrders();
		} catch (error) {
			console.error("Mark as picked error:", error);
			toast.error(error.response?.data?.message || "Failed to update");
		}
	};

	// ✅ Cancel order
	const handleCancelOrder = async (orderId) => {
		const reason = prompt("Enter cancellation reason:");
		if (!reason) return;

		try {
			await api.put(`/orders/${orderId}/cancel`, { reason });
			toast.success("Order cancelled");
			fetchSellerOrders();
		} catch (error) {
			console.error("Cancel order error:", error);
			toast.error(error.response?.data?.message || "Failed to cancel");
		}
	};

	// ✅ Get status badge color
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

	// ✅ Get payment status color
	const getPaymentColor = (status) => {
		return status === "completed"
			? "text-green-600"
			: status === "pending"
			? "text-orange-600"
			: "text-red-600";
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading orders...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900">
						Farmer Dashboard - Sales Management
					</h1>
					<p className="text-gray-600 mt-2">
						Manage your crop sales and orders
					</p>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-600 text-sm">Total Sales</p>
								<p className="text-2xl font-bold text-gray-900">
									{stats.totalSales}
								</p>
							</div>
							<ShoppingBag className="text-blue-600" size={32} />
						</div>
					</div>

					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-600 text-sm">Pending Orders</p>
								<p className="text-2xl font-bold text-orange-600">
									{stats.pendingOrders}
								</p>
							</div>
							<Clock className="text-orange-600" size={32} />
						</div>
					</div>

					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-600 text-sm">Completed</p>
								<p className="text-2xl font-bold text-green-600">
									{stats.completedOrders}
								</p>
							</div>
							<CheckCircle className="text-green-600" size={32} />
						</div>
					</div>

					<div className="bg-white rounded-lg shadow p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-600 text-sm">Total Revenue</p>
								<p className="text-2xl font-bold text-green-600">
									₹{stats.totalRevenue.toLocaleString()}
								</p>
							</div>
							<DollarSign className="text-green-600" size={32} />
						</div>
					</div>
				</div>

				{/* Orders Section */}
				<div className="bg-white rounded-lg shadow">
					<div className="border-b border-gray-200">
						<div className="p-6">
							<h2 className="text-2xl font-bold text-gray-900">
								Crop Sales Orders
							</h2>
						</div>
					</div>

					<div className="p-6">
						{orders.length === 0 ? (
							<div className="text-center py-12">
								<Package className="mx-auto text-gray-400 mb-4" size={48} />
								<p className="text-gray-600 text-lg">No sales orders yet</p>
								<p className="text-gray-500 text-sm mt-2">
									Orders from buyers will appear here
								</p>
							</div>
						) : (
							<div className="space-y-6">
								{orders.map((order) => (
									<div
										key={order._id}
										className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
									>
										{/* Order Header */}
										<div className="flex justify-between items-start mb-4">
											<div>
												<h3 className="text-lg font-bold text-gray-900">
													Order #{order._id.slice(-8).toUpperCase()}
												</h3>
												<p className="text-sm text-gray-600">
													{new Date(order.createdAt).toLocaleString("en-IN", {
														dateStyle: "medium",
														timeStyle: "short",
													})}
												</p>
											</div>
											<div className="text-right">
												<span
													className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
														order.status
													)}`}
												>
													{order.status.toUpperCase()}
												</span>
												<p className="text-sm text-gray-600 mt-2">
													Payment:{" "}
													<span
														className={`font-semibold ${getPaymentColor(
															order.paymentStatus
														)}`}
													>
														{order.paymentStatus}
													</span>
												</p>
											</div>
										</div>

										{/* Crop Items */}
										<div className="mb-4 border-t border-gray-200 pt-4">
											<h4 className="font-semibold mb-3 flex items-center gap-2">
												<Package size={18} />
												Crops Sold:
											</h4>
											<div className="space-y-2">
												{order.items.map((item, idx) => (
													<div
														key={idx}
														className="flex justify-between items-center bg-green-50 p-3 rounded"
													>
														<div className="flex items-center gap-3">
															{item.crop?.images?.[0] && (
																<img
																	src={item.crop.images[0]}
																	alt={item.crop.cropName}
																	className="w-12 h-12 object-cover rounded"
																/>
															)}
															<div>
																<p className="font-semibold text-gray-900">
																	{item.crop?.cropName || "Crop"}
																	{item.crop?.variety &&
																		` (${item.crop.variety})`}
																</p>
																<p className="text-sm text-gray-600">
																	{item.quantity} {item.crop?.unit} × ₹
																	{item.pricePerUnit}
																</p>
															</div>
														</div>
														<p className="font-bold text-green-600">
															₹{item.total.toLocaleString()}
														</p>
													</div>
												))}
											</div>
										</div>

										{/* Buyer Information */}
										<div className="mb-4 border-t border-gray-200 pt-4">
											<h4 className="font-semibold mb-3 flex items-center gap-2">
												<User size={18} />
												Buyer Details:
											</h4>
											<div className="bg-blue-50 p-4 rounded grid grid-cols-1 md:grid-cols-2 gap-3">
												<div className="flex items-start gap-2">
													<User size={16} className="mt-1 text-blue-600" />
													<div>
														<p className="text-xs text-gray-600">Name</p>
														<p className="font-semibold">{order.buyer?.name}</p>
													</div>
												</div>
												<div className="flex items-start gap-2">
													<Phone size={16} className="mt-1 text-blue-600" />
													<div>
														<p className="text-xs text-gray-600">Phone</p>
														<p className="font-semibold">
															{order.buyer?.phone}
														</p>
													</div>
												</div>
												<div className="flex items-start gap-2">
													<MapPin size={16} className="mt-1 text-blue-600" />
													<div>
														<p className="text-xs text-gray-600">Location</p>
														<p className="font-semibold">
															{order.buyer?.address?.village},{" "}
															{order.buyer?.address?.district},{" "}
															{order.buyer?.address?.state}{" "}
															{order.buyer?.address?.pincode}
														</p>
													</div>
												</div>
											</div>
										</div>

										{/* Pickup/Transportation Details */}
										{order.vehicleDetails && (
											<div className="mb-4 border-t border-gray-200 pt-4">
												<h4 className="font-semibold mb-3 flex items-center gap-2">
													<Truck size={18} />
													Transportation Details:
												</h4>
												<div className="bg-purple-50 p-4 rounded grid grid-cols-1 md:grid-cols-2 gap-3">
													<div className="flex items-start gap-2">
														<Calendar
															size={16}
															className="mt-1 text-purple-600"
														/>
														<div>
															<p className="text-xs text-gray-600">
																Pickup Date
															</p>
															<p className="font-semibold">
																{order.pickupSchedule?.date}
															</p>
														</div>
													</div>
													<div className="flex items-start gap-2">
														<User size={16} className="mt-1 text-purple-600" />
														<div>
															<p className="text-xs text-gray-600">
																Driver Name
															</p>
															<p className="font-semibold">
																{order.vehicleDetails.driverName}
															</p>
														</div>
													</div>
													<div className="flex items-start gap-2">
														<Phone size={16} className="mt-1 text-purple-600" />
														<div>
															<p className="text-xs text-gray-600">
																Driver Phone
															</p>
															<p className="font-semibold">
																{order.vehicleDetails.driverPhone}
															</p>
														</div>
													</div>
													<div className="flex items-start gap-2">
														<Truck size={16} className="mt-1 text-purple-600" />
														<div>
															<p className="text-xs text-gray-600">
																Vehicle Number
															</p>
															<p className="font-semibold">
																{order.vehicleDetails.vehicleNumber}
															</p>
														</div>
													</div>
												</div>
											</div>
										)}

										{/* Payment Details */}
										<div className="border-t border-gray-200 pt-4">
											<div className="flex justify-between items-center mb-2">
												<span className="text-lg font-semibold">
													Payment Method:
												</span>
												<span className="text-gray-700">
													{order.paymentMethod === "razorpay"
														? "Online (Razorpay)"
														: "Pay After Delivery"}
												</span>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-xl font-bold">Total Amount:</span>
												<span className="text-2xl font-bold text-green-600">
													₹{order.totalAmount.toLocaleString()}
												</span>
											</div>
										</div>

										{/* Action Buttons */}
										<div className="mt-6 flex gap-3 border-t border-gray-200 pt-4">
											{order.status === "pending" && (
												<>
													<button
														onClick={() => handleConfirmOrder(order._id)}
														className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold"
													>
														<CheckCircle size={20} />
														Confirm Order
													</button>
													<button
														onClick={() => handleCancelOrder(order._id)}
														className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 font-semibold"
													>
														<XCircle size={20} />
														Reject Order
													</button>
												</>
											)}

											{order.status === "confirmed" && (
												<button
													onClick={() => handleMarkAsPicked(order._id)}
													className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 font-semibold"
												>
													<Truck size={20} />
													Mark as Picked Up
												</button>
											)}

											{order.status === "picked" && (
												<div className="flex-1 bg-blue-100 text-blue-800 px-4 py-3 rounded-lg text-center font-semibold">
													⏳ Waiting for buyer to confirm delivery
												</div>
											)}

											{order.status === "completed" && (
												<div className="flex-1 bg-green-100 text-green-800 px-4 py-3 rounded-lg text-center font-semibold flex items-center justify-center gap-2">
													<CheckCircle size={20} />
													Order Completed
												</div>
											)}

											{order.status === "cancelled" && (
												<div className="flex-1 bg-red-100 text-red-800 px-4 py-3 rounded-lg text-center font-semibold">
													❌ Order Cancelled
													{order.cancellationReason && (
														<p className="text-xs mt-1">
															Reason: {order.cancellationReason}
														</p>
													)}
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default FarmerCropStatus;
