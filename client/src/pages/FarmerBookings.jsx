import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../config/api";
import toast from "react-hot-toast";
import {
	Calendar,
	Clock,
	MapPin,
	User,
	Tractor,
	CheckCircle,
	XCircle,
	AlertCircle,
	IndianRupee,
	Phone,
	CreditCard,
	Wallet,
	Ban,
	DollarSign,
} from "lucide-react";

function FarmerMyBookings() {
	const { user } = useAuth();
	const [bookings, setBookings] = useState([]);
	const [bids, setBids] = useState([]);
	const [loading, setLoading] = useState(true);
	const [paymentLoading, setPaymentLoading] = useState(null);
	const [actionLoading, setActionLoading] = useState(null);
	const [activeTab, setActiveTab] = useState("bookings"); // ← NEW: Tab state

	useEffect(() => {
		if (user) {
			fetchBookings();
			fetchBids(); // ← NEW: Fetch bids on mount
		}
	}, [user]);

	const fetchBookings = async () => {
		try {
			setLoading(true);
			const { data } = await api.get("/bookings/farmer");
			setBookings(data.bookings || []);
		} catch (error) {
			console.error("Fetch bookings error:", error);
			toast.error("Failed to load bookings");
		} finally {
			setLoading(false);
		}
	};

	// ← NEW: Fetch Bids Function
	const fetchBids = async () => {
		try {
			const { data } = await api.get("/bids/farmer");
			setBids(data.bids || []);
		} catch (error) {
			console.error("Fetch bids error:", error);
		}
	};

	// ← NEW: Accept Bid
	const handleAcceptBid = async (bidId) => {
		if (!window.confirm("Accept this bid and create booking?")) return;

		try {
			setActionLoading(bidId);
			await api.post(`/bids/${bidId}/accept`);
			toast.success("🎉 Bid accepted! Booking created successfully");
			fetchBids();
			fetchBookings();
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to accept bid");
		} finally {
			setActionLoading(null);
		}
	};

	// ← NEW: Reject Bid
	const handleRejectBid = async (bidId) => {
		if (!window.confirm("Reject this bid?")) return;

		try {
			setActionLoading(bidId);
			await api.post(`/bids/${bidId}/reject`);
			toast.success("Bid rejected");
			fetchBids();
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to reject bid");
		} finally {
			setActionLoading(null);
		}
	};

	// Load Razorpay script
	const loadRazorpayScript = () => {
		return new Promise((resolve) => {
			const script = document.createElement("script");
			script.src = "https://checkout.razorpay.com/v1/checkout.js";
			script.onload = () => resolve(true);
			script.onerror = () => resolve(false);
			document.body.appendChild(script);
		});
	};

	// Handle Pay Now (Razorpay)
	const handlePayNow = async (bookingId) => {
		try {
			setPaymentLoading(bookingId);

			const scriptLoaded = await loadRazorpayScript();
			if (!scriptLoaded) {
				toast.error("Failed to load payment gateway");
				return;
			}

			const { data } = await api.post(`/bookings/${bookingId}/create-order`);

			const options = {
				key: data.key,
				amount: data.order.amount,
				currency: "INR",
				name: "Crop Connect",
				description: "Tractor Booking Payment",
				order_id: data.order.id,
				handler: async (response) => {
					try {
						const verifyData = await api.post(
							`/bookings/${bookingId}/verify-payment`,
							{
								razorpay_order_id: response.razorpay_order_id,
								razorpay_payment_id: response.razorpay_payment_id,
								razorpay_signature: response.razorpay_signature,
							}
						);

						if (verifyData.data.success) {
							toast.success("🎉 Payment Successful!", { duration: 3000 });
							fetchBookings();
						}
					} catch (error) {
						console.error("Payment verification error:", error);
						toast.error("Payment verification failed");
					}
				},
				prefill: {
					name: user.name,
					email: user.email,
					contact: user.phone || "",
				},
				theme: {
					color: "#10B981",
				},
			};

			const razorpay = new window.Razorpay(options);
			razorpay.open();
		} catch (error) {
			console.error("Pay now error:", error);
			toast.error(error.response?.data?.message || "Payment failed");
		} finally {
			setPaymentLoading(null);
		}
	};

	// Handle Pay After Work
	const handlePayAfterWork = async (bookingId) => {
		try {
			setPaymentLoading(bookingId);
			const { data } = await api.post(`/bookings/${bookingId}/pay-after-work`);

			if (data.success) {
				toast.success("Payment method set to pay after work");
				fetchBookings();
			}
		} catch (error) {
			console.error("Pay after work error:", error);
			toast.error("Failed to set payment method");
		} finally {
			setPaymentLoading(null);
		}
	};

	// Handle Cancel Booking
	const handleCancelBooking = async (bookingId) => {
		if (!confirm("Are you sure you want to cancel this booking?")) return;

		try {
			const { data } = await api.post(`/bookings/${bookingId}/cancel`);

			if (data.success) {
				toast.success("Booking cancelled");
				fetchBookings();
			}
		} catch (error) {
			console.error("Cancel booking error:", error);
			toast.error(error.response?.data?.message || "Failed to cancel booking");
		}
	};

	const getStatusColor = (status) => {
		const colors = {
			pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
			confirmed: "bg-blue-100 text-blue-800 border-blue-300",
			in_progress: "bg-purple-100 text-purple-800 border-purple-300",
			completed: "bg-green-100 text-green-800 border-green-300",
			cancelled: "bg-red-100 text-red-800 border-red-300",
		};
		return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
	};

	const getPaymentStatusColor = (status) => {
		const colors = {
			pending: "bg-orange-100 text-orange-800",
			paid: "bg-green-100 text-green-800",
			failed: "bg-red-100 text-red-800",
		};
		return colors[status] || "bg-gray-100 text-gray-800";
	};

	// ← NEW: Get bid status badge
	const getBidStatusBadge = (status) => {
		const badges = {
			pending: "bg-yellow-100 text-yellow-800",
			accepted: "bg-green-100 text-green-800",
			rejected: "bg-red-100 text-red-800",
		};
		return badges[status] || "bg-gray-100 text-gray-800";
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 p-6">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
					<p className="text-gray-600">
						Manage your tractor bookings, bids, and payments
					</p>
				</div>

				{/* ← NEW: Tab Buttons */}
				<div className="flex gap-4 mb-6">
					<button
						onClick={() => setActiveTab("bookings")}
						className={`px-6 py-3 rounded-lg font-medium transition-colors ${
							activeTab === "bookings"
								? "bg-green-600 text-white shadow-lg"
								: "bg-white text-gray-700 hover:bg-gray-100"
						}`}
					>
						📋 My Bookings ({bookings.length})
					</button>
					<button
						onClick={() => setActiveTab("bids")}
						className={`px-6 py-3 rounded-lg font-medium transition-colors ${
							activeTab === "bids"
								? "bg-green-600 text-white shadow-lg"
								: "bg-white text-gray-700 hover:bg-gray-100"
						}`}
					>
						💰 Bids ({bids.length})
					</button>
				</div>

				{/* ← EXISTING: Bookings Tab Content */}
				{activeTab === "bookings" && (
					<>
						{/* Stats */}
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
							<div className="bg-white p-6 rounded-lg shadow">
								<p className="text-sm text-gray-600">Total Bookings</p>
								<p className="text-2xl font-bold text-gray-900">
									{bookings.length}
								</p>
							</div>
							<div className="bg-white p-6 rounded-lg shadow">
								<p className="text-sm text-gray-600">Confirmed</p>
								<p className="text-2xl font-bold text-blue-600">
									{bookings.filter((b) => b.status === "confirmed").length}
								</p>
							</div>
							<div className="bg-white p-6 rounded-lg shadow">
								<p className="text-sm text-gray-600">Completed</p>
								<p className="text-2xl font-bold text-green-600">
									{bookings.filter((b) => b.status === "completed").length}
								</p>
							</div>
							<div className="bg-white p-6 rounded-lg shadow">
								<p className="text-sm text-gray-600">Pending Payment</p>
								<p className="text-2xl font-bold text-orange-600">
									{bookings.filter((b) => b.paymentStatus === "pending").length}
								</p>
							</div>
						</div>

						{/* Bookings List */}
						{bookings.length === 0 ? (
							<div className="bg-white p-12 rounded-lg shadow text-center">
								<AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									No bookings yet
								</h3>
								<p className="text-gray-600">
									Start by posting a tractor requirement or booking a service
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{bookings.map((booking) => (
									<div
										key={booking._id}
										className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
									>
										<div className="flex flex-col lg:flex-row justify-between gap-6">
											{/* Left Section - Booking Details */}
											<div className="flex-1">
												<div className="flex items-center gap-3 mb-4">
													<Tractor className="w-6 h-6 text-green-600" />
													<div>
														<h3 className="text-lg font-semibold text-gray-900">
															{booking.workType || "Tractor Service"}
														</h3>
														<p className="text-sm text-gray-500">
															Booking ID: {booking._id.slice(-8)}
														</p>
													</div>
													<span
														className={`ml-auto px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
															booking.status
														)}`}
													>
														{booking.status}
													</span>
												</div>

												<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
													<div className="flex items-start gap-2">
														<Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
														<div>
															<p className="text-gray-600">Date</p>
															<p className="font-medium text-gray-900">
																{new Date(
																	booking.bookingDate
																).toLocaleDateString()}
															</p>
														</div>
													</div>

													<div className="flex items-start gap-2">
														<MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
														<div>
															<p className="text-gray-600">Location</p>
															<p className="font-medium text-gray-900">
																{booking.location?.district},{" "}
																{booking.location?.state}
															</p>
														</div>
													</div>

													<div className="flex items-start gap-2">
														<User className="w-4 h-4 text-gray-400 mt-0.5" />
														<div>
															<p className="text-gray-600">Tractor Owner</p>
															<p className="font-medium text-gray-900">
																{booking.tractorOwnerId?.name || "N/A"}
															</p>
														</div>
													</div>

													<div className="flex items-start gap-2">
														<IndianRupee className="w-4 h-4 text-gray-400 mt-0.5" />
														<div>
															<p className="text-gray-600">Total Cost</p>
															<p className="font-medium text-gray-900">
																₹{booking.totalCost}
															</p>
														</div>
													</div>
												</div>

												{/* Payment Status Badge */}
												<div className="mt-4">
													<span
														className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
															booking.paymentStatus
														)}`}
													>
														{booking.paymentStatus === "paid" ? (
															<CheckCircle className="w-3 h-3" />
														) : (
															<AlertCircle className="w-3 h-3" />
														)}
														Payment: {booking.paymentStatus}
													</span>
													{booking.paymentMethod && (
														<span className="ml-2 text-xs text-gray-500">
															(
															{booking.paymentMethod === "pay_now"
																? "Paid Online"
																: "Pay After Work"}
															)
														</span>
													)}
												</div>
											</div>

											{/* Right Section - Actions */}
											<div className="flex flex-col gap-3 lg:w-64">
												{/* Contact Button */}
												{booking.tractorOwnerId?.phone && (
													<a
														href={`tel:${booking.tractorOwnerId.phone}`}
														className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
													>
														<Phone className="w-4 h-4" />
														Call Owner
													</a>
												)}

												{/* Payment Buttons */}
												{booking.paymentStatus === "pending" &&
													booking.status !== "cancelled" && (
														<>
															{!booking.paymentMethod && (
																<button
																	onClick={() => handlePayNow(booking._id)}
																	disabled={paymentLoading === booking._id}
																	className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
																>
																	<CreditCard className="w-4 h-4" />
																	{paymentLoading === booking._id
																		? "Processing..."
																		: "Pay Now"}
																</button>
															)}

															{!booking.paymentMethod && (
																<button
																	onClick={() =>
																		handlePayAfterWork(booking._id)
																	}
																	disabled={paymentLoading === booking._id}
																	className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
																>
																	<Wallet className="w-4 h-4" />
																	{paymentLoading === booking._id
																		? "Setting..."
																		: "Pay After Work"}
																</button>
															)}

															{booking.paymentMethod === "pay_after_work" &&
																booking.status === "completed" && (
																	<button
																		onClick={() => handlePayNow(booking._id)}
																		disabled={paymentLoading === booking._id}
																		className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
																	>
																		<CreditCard className="w-4 h-4" />
																		Complete Payment
																	</button>
																)}
														</>
													)}

												{/* Payment Success Badge */}
												{booking.paymentStatus === "paid" && (
													<div className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 border-2 border-green-200 text-green-800 rounded-lg">
														<CheckCircle className="w-5 h-5" />
														<span className="font-medium">
															Payment Complete
														</span>
													</div>
												)}

												{/* Cancel Button */}
												{booking.status !== "cancelled" &&
													booking.paymentStatus !== "paid" && (
														<button
															onClick={() => handleCancelBooking(booking._id)}
															className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
														>
															<Ban className="w-4 h-4" />
															Cancel Booking
														</button>
													)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</>
				)}

				{/* ← NEW: Bids Tab Content */}
				{activeTab === "bids" && (
					<div className="space-y-6">
						{bids.length === 0 ? (
							<div className="bg-white p-12 rounded-lg shadow text-center">
								<DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									No bids received yet
								</h3>
								<p className="text-gray-600">
									Tractor owners will place bids on your requirements
								</p>
							</div>
						) : (
							bids.map((bid) => (
								<div
									key={bid._id}
									className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
								>
									<div className="flex justify-between items-start mb-4">
										<div>
											<h3 className="text-xl font-bold text-gray-800 mb-1">
												{bid.requirementId?.workType || "Work"}
											</h3>
											<span
												className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getBidStatusBadge(
													bid.status
												)}`}
											>
												{bid.status.charAt(0).toUpperCase() +
													bid.status.slice(1)}
											</span>
										</div>
										<div className="text-right">
											<p className="text-2xl font-bold text-green-600">
												₹{bid.proposedAmount}
											</p>
											<p className="text-sm text-gray-500">Proposed Amount</p>
										</div>
									</div>

									{/* Tractor Owner Info */}
									<div className="bg-blue-50 rounded-lg p-4 mb-4">
										<p className="text-sm text-gray-600 mb-2">Bid from:</p>
										<p className="font-semibold text-gray-800">
											{bid.tractorOwnerId?.name}
										</p>
										<p className="text-sm text-gray-600">
											📞 {bid.tractorOwnerId?.phone}
										</p>
									</div>

									{/* Bid Details */}
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
										<div className="flex items-center gap-2">
											<Clock className="w-4 h-4 text-gray-500" />
											<div>
												<p className="text-xs text-gray-500">Duration</p>
												<p className="font-medium text-gray-800">
													{bid.proposedDuration}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Calendar className="w-4 h-4 text-gray-500" />
											<div>
												<p className="text-xs text-gray-500">Proposed Date</p>
												<p className="font-medium text-gray-800">
													{new Date(bid.proposedDate).toLocaleDateString()}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<MapPin className="w-4 h-4 text-gray-500" />
											<div>
												<p className="text-xs text-gray-500">Land Size</p>
												<p className="font-medium text-gray-800">
													{bid.requirementId?.landSize} acres
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Calendar className="w-4 h-4 text-gray-500" />
											<div>
												<p className="text-xs text-gray-500">Bid Placed</p>
												<p className="font-medium text-gray-800">
													{new Date(bid.createdAt).toLocaleDateString()}
												</p>
											</div>
										</div>
									</div>

									{/* Message */}
									{bid.message && (
										<div className="bg-gray-50 rounded-lg p-3 mb-4">
											<p className="text-sm text-gray-700">
												<strong>Message:</strong> {bid.message}
											</p>
										</div>
									)}

									{/* Action Buttons */}
									<div className="flex gap-3">
										{bid.status === "pending" ? (
											<>
												<button
													onClick={() => handleAcceptBid(bid._id)}
													disabled={actionLoading === bid._id}
													className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
												>
													<CheckCircle className="w-5 h-5" />
													{actionLoading === bid._id
														? "Processing..."
														: "Accept Bid"}
												</button>
												<button
													onClick={() => handleRejectBid(bid._id)}
													disabled={actionLoading === bid._id}
													className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
												>
													<XCircle className="w-5 h-5" />
													{actionLoading === bid._id
														? "Processing..."
														: "Reject"}
												</button>
												<a
													href={`tel:${bid.tractorOwnerId?.phone}`}
													className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
												>
													<Phone className="w-5 h-5" />
													Call
												</a>
											</>
										) : bid.status === "accepted" ? (
											<div className="flex-1 bg-green-100 text-green-800 px-6 py-3 rounded-lg font-medium text-center">
												✅ Bid Accepted - Booking Created!
											</div>
										) : (
											<div className="flex-1 bg-gray-100 text-gray-600 px-6 py-3 rounded-lg font-medium text-center">
												❌ Bid {bid.status}
											</div>
										)}
									</div>
								</div>
							))
						)}
					</div>
				)}
			</div>
		</div>
	);
}

export default FarmerMyBookings;
