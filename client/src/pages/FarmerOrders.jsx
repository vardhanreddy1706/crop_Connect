import React, { useState, useEffect } from "react";

import api from "../config/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
	Package,
	Truck,
	CheckCircle,
	XCircle,
	Clock,
	Phone,
	MapPin,
	Calendar,
	Loader,
	ArrowLeft,
} from "lucide-react";

function FarmerOrders() {
	const navigate = useNavigate();
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState(null);

	useEffect(() => {
		fetchOrders();
	}, []);

	const fetchOrders = async () => {
		try {
			const { data } = await api.get("/orders/seller");
			setOrders(data.orders || []);
		} catch (error) {
			console.error("Fetch orders error:", error);
			toast.error("Failed to load orders");
		} finally {
			setLoading(false);
		}
	};

	const handleUpdateStatus = async (orderId, status) => {
		try {
			setProcessing(orderId);
			await api.put(`/orders/${orderId}/status`, { status });
			toast.success(`Order marked as ${status}`);
			fetchOrders();
		} catch (error) {
			console.error("Update status error:", error);
			toast.error("Failed to update status");
		} finally {
			setProcessing(null);
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
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-7xl mx-auto px-4">
				<div className="flex items-center gap-3 mb-8">
					<button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-200">
						<ArrowLeft className="w-6 h-6" />
					</button>
					<h1 className="text-3xl font-bold">Crop Orders</h1>
				</div>

				{orders.length === 0 ? (
					<div className="bg-white rounded-lg shadow p-12 text-center">
						<Package className="mx-auto text-gray-400 mb-4" size={48} />
						<p className="text-gray-600">No orders yet</p>
					</div>
				) : (
					<div className="space-y-6">
						{orders.map((order) => (
							<div
								key={order._id}
								className="bg-white rounded-lg shadow-lg p-6"
							>
								{/* Order Header */}
								<div className="flex justify-between items-start mb-4">
									<div>
										<h3 className="text-xl font-bold text-gray-900">
											Order #{order._id.substring(0, 8)}
										</h3>
										<p className="text-sm text-gray-600">
											Placed on {new Date(order.createdAt).toLocaleDateString()}
										</p>
										<p className="text-sm text-gray-600">
											Buyer: {order.buyer?.name} | {order.buyer?.phone}
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
										<h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
											<Truck size={16} />
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
										<h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
											<Calendar size={16} />
											Pickup Schedule
										</h4>
										<p className="text-sm">
											Date:{" "}
											{new Date(order.pickupSchedule.date).toLocaleDateString()}
										</p>
										<p className="text-sm capitalize">
											Time: {order.pickupSchedule.timeSlot}
										</p>
										<p className="text-sm mt-2 font-semibold">
											Payment:{" "}
											{order.paymentMethod === "razorpay"
												? "Paid Online ✅"
												: "Pay After Delivery"}
										</p>
									</div>
								</div>

								{/* Delivery Address */}
								<div className="mb-4 p-4 bg-gray-50 rounded-lg">
									<h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
										<MapPin size={16} />
										Delivery Address
									</h4>
									<p className="text-sm">
										{order.deliveryAddress?.fullAddress || "N/A"},{" "}
										{order.deliveryAddress?.district},{" "}
										{order.deliveryAddress?.state} -{" "}
										{order.deliveryAddress?.pincode}
									</p>
								</div>

								{/* Total */}
								<div className="flex justify-between items-center pt-4 border-t border-gray-200 mb-4">
									<p className="text-lg font-bold">Total Amount:</p>
									<p className="text-2xl font-bold text-green-600">
										₹{order.totalAmount.toLocaleString()}
									</p>
								</div>

								{/* Action Buttons */}
								{order.status === "confirmed" && (
									<div className="flex gap-3">
										<button
											onClick={() => handleUpdateStatus(order._id, "picked")}
											disabled={processing === order._id}
											className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-semibold"
										>
											{processing === order._id ? (
												<>
													<Loader className="animate-spin" size={18} />
													Processing...
												</>
											) : (
												<>
													<Truck size={18} />
													Mark as Picked
												</>
											)}
										</button>
									</div>
								)}

								{order.status === "picked" && (
									<div className="flex gap-3">
										<button
											onClick={() => handleUpdateStatus(order._id, "completed")}
											disabled={processing === order._id}
											className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold"
										>
											{processing === order._id ? (
												<>
													<Loader className="animate-spin" size={18} />
													Processing...
												</>
											) : (
												<>
													<CheckCircle size={18} />
													Mark as Completed
												</>
											)}
										</button>
									</div>
								)}

								{order.status === "completed" && (
									<div className="bg-green-50 p-4 rounded-lg text-center">
										<p className="text-green-700 font-semibold">
											✅ Order Completed Successfully!
										</p>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export default FarmerOrders;
