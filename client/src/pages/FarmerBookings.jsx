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
  Users,
  Briefcase,
  Star,
  Search,
  Filter,
  Mail,
  Loader,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function FarmerMyBookings() {
	const { user } = useAuth();

	// State management
	const [bookings, setBookings] = useState([]);
	const [bids, setBids] = useState([]);
	const [availableWorkers, setAvailableWorkers] = useState([]);
	const [hireRequests, setHireRequests] = useState([]); // Farmer to Worker requests
	const [workerApplications, setWorkerApplications] = useState([]); // Worker to Farmer applications

	const [loading, setLoading] = useState(true);
	const [paymentLoading, setPaymentLoading] = useState(null);
	const [actionLoading, setActionLoading] = useState(null);
	const [activeTab, setActiveTab] = useState("bookings");

	// Worker search filters
	const [workerSearch, setWorkerSearch] = useState({
		district: "",
		workerType: "",
		maxCharge: "",
		minExperience: "",
	});

	// Fetch all data on mount
	useEffect(() => {
		if (user) {
			fetchBookings();
			fetchBids();
			fetchHireRequests();
			if (activeTab === "workers") {
				fetchAvailableWorkers();
			}
		}
	}, [user, activeTab]);

	// ✅ Fetch bookings
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

	// ✅ Fetch bids
	const fetchBids = async () => {
		try {
			const { data } = await api.get("/bids/farmer");
			setBids(data.bids || []);
		} catch (error) {
			console.error("Fetch bids error:", error);
		}
	};

	// ✅ Fetch hire requests and applications
	const fetchHireRequests = async () => {
		try {
			const { data } = await api.get("/worker-hires/farmer-requests");

			// Separate into hire requests (farmer_to_worker) and applications (worker_to_farmer)
			const hired = data.hireRequests.filter(
				(r) => r.requestType === "farmer_to_worker"
			);
			const applications = data.hireRequests.filter(
				(r) => r.requestType === "worker_to_farmer"
			);

			setHireRequests(hired);
			setWorkerApplications(applications);
		} catch (error) {
			console.error("Fetch hire requests error:", error);
		}
	};

	// ✅ Fetch available workers
	const fetchAvailableWorkers = async () => {
		try {
			setLoading(true);
			const params = {};

			if (workerSearch.district) params.location = workerSearch.district;
			if (workerSearch.workerType) params.workerType = workerSearch.workerType;
			if (workerSearch.maxCharge) params.maxCharge = workerSearch.maxCharge;
			if (workerSearch.minExperience)
				params.minExperience = workerSearch.minExperience;

			const { data } = await api.get("/workers/available", { params });
			setAvailableWorkers(data.workers || []);
		} catch (error) {
			console.error("Fetch workers error:", error);
			toast.error("Failed to load available workers");
		} finally {
			setLoading(false);
		}
	};

	// ✅ Handle search button click
	const handleSearchWorkers = () => {
		fetchAvailableWorkers();
	};

	// ✅ Reset worker filters
	const handleResetFilters = () => {
		setWorkerSearch({
			district: "",
			workerType: "",
			maxCharge: "",
			minExperience: "",
		});
		fetchAvailableWorkers();
	};

	// ✅ Contact worker
	const handleContactWorker = (worker) => {
		const phoneNumber = worker.contactNumber || worker.worker?.phone;
		if (phoneNumber) {
			toast.success(`📞 Contact: ${phoneNumber}`, { duration: 5000 });
			window.location.href = `tel:${phoneNumber}`;
		} else {
			toast.error("Contact number not available");
		}
	};

	// ✅ Cancel booking handler
	const handleCancelBooking = async (bookingId) => {
		if (!window.confirm("Are you sure you want to cancel this booking?")) {
			return;
		}

		try {
			setActionLoading(bookingId);

			await api.post(`/bookings/${bookingId}/cancel`);

			toast.success("✅ Booking cancelled successfully");

			// Refresh bookings list
			fetchBookings();
		} catch (error) {
			console.error("Cancel booking error:", error);
			toast.error(error.response?.data?.message || "Failed to cancel booking");
		} finally {
			setActionLoading(null);
		}
	};

	// ✅ Hire worker (creates hire request - farmer to worker)
	const handleHireWorker = async (worker) => {
		// Check if worker is already booked
		if (worker.bookingStatus === "booked") {
			toast.error("This worker is already booked");
			return;
		}

		// Check if already requested
		const existingRequest = hireRequests.find(
			(r) =>
				r.workerService._id === worker._id &&
				(r.status === "pending" || r.status === "accepted")
		);

		if (existingRequest) {
			if (existingRequest.status === "pending") {
				toast.info("You already have a pending hire request for this worker");
			} else {
				toast.info("This worker has already accepted your request");
			}
			return;
		}

		if (
			!window.confirm(
				`Send hire request to ${worker.worker?.name} for ₹${worker.chargePerDay}/day?`
			)
		) {
			return;
		}

		try {
			setActionLoading(worker._id);

			const hireRequestData = {
				workerServiceId: worker._id,
				workDetails: {
					startDate: new Date(),
					duration: 1,
					workDescription: `Hire for ${worker.workerType}`,
					location: worker.location,
				},
				agreedAmount: worker.chargePerDay,
				notes: `Hired via Browse Workers`,
			};

			await api.post("/worker-hires/hire-worker", hireRequestData);

			toast.success(
				`🎉 Hire request sent to ${worker.worker?.name}! Waiting for confirmation...`
			);
			fetchHireRequests();
			setActiveTab("hire-requests"); // Switch to see the request
		} catch (error) {
			console.error("Hire worker error:", error);
			toast.error(
				error.response?.data?.message || "Failed to send hire request"
			);
		} finally {
			setActionLoading(null);
		}
	};

	// ✅ Accept worker application (worker applied to farmer's job)
	const handleAcceptApplication = async (applicationId) => {
		if (!window.confirm("Accept this worker's application and create booking?"))
			return;

		try {
			setActionLoading(applicationId);
			await api.post(`/worker-hires/${applicationId}/farmer-accept`);
			toast.success("🎉 Application accepted! Booking created successfully.");
			fetchHireRequests();
			fetchBookings();
			setActiveTab("bookings"); // Switch to bookings to see new booking
		} catch (error) {
			toast.error(
				error.response?.data?.message || "Failed to accept application"
			);
		} finally {
			setActionLoading(null);
		}
	};

	// ✅ Reject worker application
	const handleRejectApplication = async (applicationId) => {
		const reason = prompt("Reason for rejection (optional):");

		try {
			setActionLoading(applicationId);
			await api.post(`/worker-hires/${applicationId}/farmer-reject`, {
				reason,
			});
			toast.success("Application rejected");
			fetchHireRequests();
		} catch (error) {
			toast.error(
				error.response?.data?.message || "Failed to reject application"
			);
		} finally {
			setActionLoading(null);
		}
	};

	// ✅ Accept bid
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

	// ✅ Reject bid
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

	// ✅ FIXED: Make payment - Correct endpoint
	const handleMakePayment = async (bookingId) => {
		try {
			setPaymentLoading(bookingId);

			// Step 1: Create Razorpay order - ✅ FIXED ENDPOINT
			const { data: orderData } = await api.post(
				`/bookings/${bookingId}/create-order` // ✅ Changed from create-razorpay-order
			);

			console.log("Order created:", orderData);

			// If mock payment (development)
			if (orderData.isMock) {
				toast.info("Mock payment - Auto completing...");

				// Auto-verify mock payment
				await api.post(`/bookings/${bookingId}/verify-payment`, {
					razorpay_order_id: orderData.order.id,
					razorpay_payment_id: `pay_mock_${Date.now()}`,
					razorpay_signature: "mock_signature",
				});

				toast.success("✅ Payment successful!");
				fetchBookings();
				setPaymentLoading(null);
				return;
			}

			// Step 2: Initialize Razorpay payment
			const options = {
				key: orderData.key,
				amount: orderData.order.amount,
				currency: orderData.order.currency,
				name: "Crop Connect",
				description: "Booking Payment",
				order_id: orderData.order.id,
				handler: async function (response) {
					try {
						// Step 3: Verify payment on backend
						await api.post(`/bookings/${bookingId}/verify-payment`, {
							razorpay_order_id: response.razorpay_order_id,
							razorpay_payment_id: response.razorpay_payment_id,
							razorpay_signature: response.razorpay_signature,
						});

						toast.success("✅ Payment successful!");
						fetchBookings();
						setPaymentLoading(null);
					} catch (error) {
						console.error("Payment verification error:", error);
						toast.error(
							error.response?.data?.message || "Payment verification failed"
						);
						setPaymentLoading(null);
					}
				},
				prefill: {
					name: user.name,
					email: user.email,
					contact: user.phone,
				},
				theme: {
					color: "#10b981", // Green theme
				},
				modal: {
					ondismiss: function () {
						setPaymentLoading(null);
						toast.info("Payment cancelled");
					},
				},
			};

			const rzp = new window.Razorpay(options);

			rzp.on("payment.failed", function (response) {
				console.error("Payment failed:", response);
				toast.error("Payment failed! Please try again.");
				setPaymentLoading(null);
			});

			rzp.open();
		} catch (error) {
			console.error("Payment initialization error:", error);
			toast.error(
				error.response?.data?.message || "Payment initialization failed"
			);
			setPaymentLoading(null);
		}
	};

	// ✅ FIXED: Pay with wallet
	const handlePayWithWallet = async (bookingId, amount) => {
		if (!window.confirm(`Pay ₹${amount} from wallet?`)) return;

		try {
			setPaymentLoading(bookingId);

			// Create a wallet payment transaction
			await api.post(`/bookings/${bookingId}/verify-payment`, {
				razorpay_order_id: `wallet_order_${Date.now()}`,
				razorpay_payment_id: `wallet_payment_${Date.now()}`,
				razorpay_signature: "wallet_signature",
			});

			toast.success("✅ Payment successful from wallet!");
			fetchBookings();
		} catch (error) {
			console.error("Wallet payment error:", error);
			toast.error(error.response?.data?.message || "Wallet payment failed");
		} finally {
			setPaymentLoading(null);
		}
	};

	// ✅ Pay After Work Handler
	const handlePayAfterWork = async (bookingId) => {
		if (!window.confirm("Choose to pay after work is completed?")) return;

		try {
			setActionLoading(bookingId);

			// Call backend to set payment method
			await api.post(`/bookings/${bookingId}/pay-after-work`);

			toast.success("✅ Payment method set to 'Pay After Work'");
			fetchBookings(); // Refresh bookings
		} catch (error) {
			console.error("Pay after work error:", error);
			toast.error(
				error.response?.data?.message || "Failed to set payment method"
			);
		} finally {
			setActionLoading(null);
		}
	};

	// Utility functions
	const getStatusColor = (status) => {
		const colors = {
			pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
			confirmed: "bg-blue-100 text-blue-800 border-blue-300",
			in_progress: "bg-purple-100 text-purple-800 border-purple-300",
			completed: "bg-green-100 text-green-800 border-green-300",
			cancelled: "bg-red-100 text-red-800 border-red-300",
			accepted: "bg-green-100 text-green-800 border-green-300",
			rejected: "bg-red-100 text-red-800 border-red-300",
		};
		return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
	};

	const formatDate = (date) => {
		return new Date(date).toLocaleDateString("en-IN", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	};

	if (loading && bookings.length === 0 && availableWorkers.length === 0) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600 mx-auto mb-4"></div>
					<div className="text-xl text-gray-700">Loading...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						My Bookings & Services
					</h1>
					<p className="text-gray-600">
						Manage your bookings, worker hires, applications, and browse
						available workers
					</p>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
					<div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
						<div className="flex items-center justify-between">
							<div>
								<div className="text-sm text-gray-600">Total Bookings</div>
								<div className="text-2xl font-bold text-green-600">
									{bookings.length}
								</div>
							</div>
							<Tractor className="text-green-600" size={32} />
						</div>
					</div>

					<div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
						<div className="flex items-center justify-between">
							<div>
								<div className="text-sm text-gray-600">Pending Requests</div>
								<div className="text-2xl font-bold text-yellow-600">
									{hireRequests.filter((r) => r.status === "pending").length}
								</div>
							</div>
							<Clock className="text-yellow-600" size={32} />
						</div>
					</div>

					<div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
						<div className="flex items-center justify-between">
							<div>
								<div className="text-sm text-gray-600">Worker Applications</div>
								<div className="text-2xl font-bold text-blue-600">
									{
										workerApplications.filter((a) => a.status === "pending")
											.length
									}
								</div>
							</div>
							<Users className="text-blue-600" size={32} />
						</div>
					</div>

					<div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
						<div className="flex items-center justify-between">
							<div>
								<div className="text-sm text-gray-600">Available Workers</div>
								<div className="text-2xl font-bold text-purple-600">
									{availableWorkers.length}
								</div>
							</div>
							<Users className="text-purple-600" size={32} />
						</div>
					</div>
				</div>

				{/* Tab Navigation */}
				<div className="bg-white rounded-xl shadow-lg p-2 mb-6">
					<div className="flex gap-2 flex-wrap">
						<button
							onClick={() => setActiveTab("bookings")}
							className={`flex-1 min-w-[150px] py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center ${
								activeTab === "bookings"
									? "bg-green-600 text-white shadow-md"
									: "bg-gray-100 text-gray-600 hover:bg-gray-200"
							}`}
						>
							<Tractor className="mr-2" size={18} />
							My Bookings ({bookings.length})
						</button>

						<button
							onClick={() => setActiveTab("hire-requests")}
							className={`flex-1 min-w-[150px] py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center ${
								activeTab === "hire-requests"
									? "bg-green-600 text-white shadow-md"
									: "bg-gray-100 text-gray-600 hover:bg-gray-200"
							}`}
						>
							<Clock className="mr-2" size={18} />
							Hire Requests ({hireRequests.length})
						</button>

						<button
							onClick={() => setActiveTab("applications")}
							className={`flex-1 min-w-[150px] py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center ${
								activeTab === "applications"
									? "bg-green-600 text-white shadow-md"
									: "bg-gray-100 text-gray-600 hover:bg-gray-200"
							}`}
						>
							<Mail className="mr-2" size={18} />
							Applications ({workerApplications.length})
						</button>

						<button
							onClick={() => setActiveTab("bids")}
							className={`flex-1 min-w-[150px] py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center ${
								activeTab === "bids"
									? "bg-green-600 text-white shadow-md"
									: "bg-gray-100 text-gray-600 hover:bg-gray-200"
							}`}
						>
							<DollarSign className="mr-2" size={18} />
							Bids ({bids.length})
						</button>

						<button
							onClick={() => {
								setActiveTab("workers");
								fetchAvailableWorkers();
							}}
							className={`flex-1 min-w-[150px] py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center ${
								activeTab === "workers"
									? "bg-green-600 text-white shadow-md"
									: "bg-gray-100 text-gray-600 hover:bg-gray-200"
							}`}
						>
							<Users className="mr-2" size={18} />
							Browse Workers
						</button>
					</div>
				</div>

				{/* Content based on active tab */}
				{activeTab === "bookings" && (
					<div className="space-y-6">
						{bookings.length === 0 ? (
							<div className="bg-white rounded-xl shadow-lg p-12 text-center">
								<Tractor className="mx-auto mb-4 text-gray-400" size={64} />
								<h3 className="text-xl font-semibold text-gray-700 mb-2">
									No Bookings Yet
								</h3>
								<p className="text-gray-500 mb-4">
									Your bookings will appear here once confirmed
								</p>
								<button
									onClick={() => setActiveTab("workers")}
									className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
								>
									Browse Workers
								</button>
							</div>
						) : (
							bookings.map((booking) => (
								<div
									key={booking._id}
									className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
								>
									<div
										className={`p-6 bg-gradient-to-r ${
											booking.status === "confirmed"
												? "from-blue-500 to-blue-600"
												: booking.status === "completed"
												? "from-green-500 to-green-600"
												: booking.status === "cancelled"
												? "from-red-500 to-red-600"
												: "from-yellow-500 to-yellow-600"
										} text-white`}
									>
										<div className="flex justify-between items-start">
											<div>
												<h3 className="text-xl font-bold mb-1">
													{booking.workType || booking.serviceType}
												</h3>
												<p className="text-sm opacity-90">
													Booking ID: {booking._id.slice(-8).toUpperCase()}
												</p>
											</div>
											<span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
												{booking.status.toUpperCase()}
											</span>
										</div>
									</div>

									<div className="p-6">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
											<div className="flex items-center text-gray-700">
												<Calendar className="mr-2 text-green-600" size={18} />
												<span className="font-semibold">Date:</span>
												<span className="ml-2">
													{formatDate(booking.bookingDate)}
												</span>
											</div>

											<div className="flex items-center text-gray-700">
												<IndianRupee
													className="mr-2 text-green-600"
													size={18}
												/>
												<span className="font-semibold">Amount:</span>
												<span className="ml-2 font-bold text-green-600">
													₹{booking.totalCost}
												</span>
											</div>

											<div className="flex items-center text-gray-700">
												<MapPin className="mr-2 text-green-600" size={18} />
												<span className="font-semibold">Location:</span>
												<span className="ml-2 text-sm">
													{booking.location?.district ||
														booking.location?.village ||
														"N/A"}
												</span>
											</div>

											<div className="flex items-center text-gray-700">
												<Clock className="mr-2 text-green-600" size={18} />
												<span className="font-semibold">Duration:</span>
												<span className="ml-2">{booking.duration} day(s)</span>
											</div>
										</div>
										{/* Payment Actions - COMPLETE WITH PAY AFTER WORK */}
										{booking.status === "confirmed" &&
											booking.paymentStatus !== "paid" &&
											!booking.paymentCompleted &&
											booking.paymentMethod !== "pay-after-work" && (
												<div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
													<p className="text-yellow-800 font-semibold mb-3 flex items-center">
														<AlertCircle className="mr-2" size={20} />
														💳 Payment Required: ₹{booking.totalCost}
													</p>
													<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
														{/* Pay Online Button */}
														<button
															onClick={() =>
																handleMakePayment(
																	booking._id,
																	booking.totalCost
																)
															}
															disabled={paymentLoading === booking._id}
															className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
														>
															{paymentLoading === booking._id ? (
																<>
																	<Loader
																		className="animate-spin mr-2"
																		size={16}
																	/>
																	Processing...
																</>
															) : (
																<>
																	<CreditCard className="mr-2" size={16} />
																	Pay Online
																</>
															)}
														</button>

														{/* Pay with Wallet Button */}
														<button
															onClick={() =>
																handlePayWithWallet(
																	booking._id,
																	booking.totalCost
																)
															}
															disabled={paymentLoading === booking._id}
															className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
														>
															<Wallet className="mr-2" size={16} />
															Wallet
														</button>

														{/* Pay After Work Button */}
														<button
															onClick={() => handlePayAfterWork(booking._id)}
															disabled={actionLoading === booking._id}
															className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
														>
															<Clock className="mr-2" size={16} />
															Pay Later
														</button>

														{/* Cancel Button */}
														<button
															onClick={() => handleCancelBooking(booking._id)}
															disabled={actionLoading === booking._id}
															className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
														>
															{actionLoading === booking._id ? (
																<Loader className="animate-spin" size={16} />
															) : (
																<>
																	<Ban className="mr-2" size={16} />
																	Cancel
																</>
															)}
														</button>
													</div>
												</div>
											)}

										{/* Pay After Work Selected */}
										{booking.status === "confirmed" &&
											booking.paymentMethod === "pay-after-work" &&
											booking.paymentStatus === "pending" && (
												<div className="mt-4 bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
													<p className="text-blue-800 font-semibold flex items-center mb-2">
														<Clock className="mr-2 text-blue-600" size={20} />
														💰 Payment Method: Pay After Work Completion
													</p>
													<p className="text-sm text-blue-600">
														You'll pay ₹{booking.totalCost} after the work is
														completed
													</p>
												</div>
											)}

										{/* Payment Completed - Check both fields */}
										{(booking.paymentStatus === "paid" ||
											booking.paymentCompleted) && (
											<div className="mt-4 bg-green-50 p-4 rounded-lg border-2 border-green-200">
												<p className="text-green-800 font-semibold flex items-center mb-2">
													<CheckCircle
														className="mr-2 text-green-600"
														size={20}
													/>
													✅ Payment Completed Successfully
												</p>
												{booking.paidAt && (
													<p className="text-sm text-green-600 mt-1">
														Paid on: {formatDate(booking.paidAt)}
													</p>
												)}
												{booking.razorpayPaymentId && (
													<p className="text-xs text-green-500 mt-1">
														Payment ID: {booking.razorpayPaymentId}
													</p>
												)}
											</div>
										)}
									</div>
								</div>
							))
						)}
					</div>
				)}

				{/* HIRE REQUESTS TAB */}
				{activeTab === "hire-requests" && (
					<div className="space-y-6">
						{hireRequests.length === 0 ? (
							<div className="bg-white rounded-xl shadow-lg p-12 text-center">
								<Clock className="mx-auto mb-4 text-gray-400" size={64} />
								<h3 className="text-xl font-semibold text-gray-700 mb-2">
									No Hire Requests
								</h3>
								<p className="text-gray-500 mb-4">
									Your worker hire requests will appear here
								</p>
								<button
									onClick={() => setActiveTab("workers")}
									className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
								>
									Browse Workers
								</button>
							</div>
						) : (
							hireRequests.map((request) => (
								<div
									key={request._id}
									className="bg-white rounded-xl shadow-lg overflow-hidden p-6"
								>
									<div className="flex justify-between items-start mb-4">
										<div>
											<h3 className="text-xl font-bold text-gray-900 mb-1">
												Hire Request to {request.worker?.name}
											</h3>
											<p className="text-sm text-gray-600">
												{request.workerService?.workerType} •{" "}
												{request.workerService?.experience} years experience
											</p>
										</div>
										<span
											className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(
												request.status
											)}`}
										>
											{request.status.toUpperCase()}
										</span>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
										<div className="flex items-center text-gray-700">
											<IndianRupee className="mr-2 text-green-600" size={18} />
											<span className="font-semibold">Amount:</span>
											<span className="ml-2 font-bold text-green-600">
												₹{request.agreedAmount}/day
											</span>
										</div>

										<div className="flex items-center text-gray-700">
											<Clock className="mr-2 text-green-600" size={18} />
											<span className="font-semibold">Sent:</span>
											<span className="ml-2">
												{formatDate(request.createdAt)}
											</span>
										</div>

										<div className="flex items-center text-gray-700">
											<Phone className="mr-2 text-green-600" size={18} />
											<span className="font-semibold">Worker Contact:</span>
											<span className="ml-2">
												{request.worker?.phone || "N/A"}
											</span>
										</div>
									</div>

									{request.status === "pending" && (
										<div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
											<p className="text-yellow-800 font-semibold flex items-center">
												<Clock className="mr-2" size={20} />⏳ Waiting for
												worker to accept your request...
											</p>
										</div>
									)}

									{request.status === "accepted" && request.bookingId && (
										<div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
											<p className="text-green-800 font-semibold flex items-center mb-2">
												<CheckCircle className="mr-2" size={20} />✅ Worker
												accepted! Booking created successfully.
											</p>
											<button
												onClick={() => setActiveTab("bookings")}
												className="text-green-600 font-semibold underline hover:text-green-700"
											>
												View Booking →
											</button>
										</div>
									)}

									{request.status === "rejected" && (
										<div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
											<p className="text-red-800 font-semibold flex items-center">
												<XCircle className="mr-2" size={20} />❌ Worker declined
												your request
											</p>
											{request.rejectionReason && (
												<p className="text-red-600 text-sm mt-2">
													Reason: {request.rejectionReason}
												</p>
											)}
										</div>
									)}
								</div>
							))
						)}
					</div>
				)}

				{/* WORKER APPLICATIONS TAB */}
				{activeTab === "applications" && (
					<div className="space-y-6">
						{workerApplications.length === 0 ? (
							<div className="bg-white rounded-xl shadow-lg p-12 text-center">
								<Mail className="mx-auto mb-4 text-gray-400" size={64} />
								<h3 className="text-xl font-semibold text-gray-700 mb-2">
									No Applications
								</h3>
								<p className="text-gray-500">
									Worker applications for your job postings will appear here
								</p>
							</div>
						) : (
							workerApplications.map((application) => (
								<div
									key={application._id}
									className="bg-white rounded-xl shadow-lg overflow-hidden p-6"
								>
									<div className="flex justify-between items-start mb-4">
										<div>
											<h3 className="text-xl font-bold text-gray-900 mb-1">
												Application from {application.worker?.name}
											</h3>
											<p className="text-sm text-gray-600">
												{application.workerService?.workerType} •{" "}
												{application.workerService?.experience} years exp
											</p>
										</div>
										<span
											className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(
												application.status
											)}`}
										>
											{application.status.toUpperCase()}
										</span>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
										<div className="flex items-center text-gray-700">
											<IndianRupee className="mr-2 text-green-600" size={18} />
											<span className="font-semibold">Proposed Rate:</span>
											<span className="ml-2 font-bold text-green-600">
												₹{application.workerService?.chargePerDay}/day
											</span>
										</div>

										<div className="flex items-center text-gray-700">
											<Clock className="mr-2 text-green-600" size={18} />
											<span className="font-semibold">Applied:</span>
											<span className="ml-2">
												{formatDate(application.createdAt)}
											</span>
										</div>

										<div className="flex items-center text-gray-700">
											<Phone className="mr-2 text-green-600" size={18} />
											<span className="font-semibold">Contact:</span>
											<span className="ml-2">
												{application.worker?.phone || "N/A"}
											</span>
										</div>

										<div className="flex items-center text-gray-700">
											<Mail className="mr-2 text-green-600" size={18} />
											<span className="font-semibold">Email:</span>
											<span className="ml-2 text-sm">
												{application.worker?.email || "N/A"}
											</span>
										</div>
									</div>

									{application.notes && (
										<div className="bg-blue-50 p-4 rounded-lg mb-4">
											<p className="text-sm text-gray-700">
												<span className="font-semibold">Message:</span>{" "}
												{application.notes}
											</p>
										</div>
									)}

									{application.status === "pending" && (
										<div className="flex gap-2 pt-4 border-t-2">
											<button
												onClick={() => handleAcceptApplication(application._id)}
												disabled={actionLoading === application._id}
												className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center disabled:opacity-50"
											>
												{actionLoading === application._id ? (
													<Loader className="animate-spin mr-2" size={16} />
												) : (
													<CheckCircle className="mr-2" size={16} />
												)}
												Accept & Book
											</button>
											<button
												onClick={() => handleRejectApplication(application._id)}
												disabled={actionLoading === application._id}
												className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold flex items-center justify-center disabled:opacity-50"
											>
												<XCircle className="mr-2" size={16} />
												Reject
											</button>
										</div>
									)}

									{application.status === "accepted" && (
										<div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
											<p className="text-green-800 font-semibold flex items-center">
												<CheckCircle className="mr-2" size={20} />✅ Application
												accepted! Booking created.
											</p>
										</div>
									)}

									{application.status === "rejected" && (
										<div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
											<p className="text-red-800 font-semibold flex items-center">
												<XCircle className="mr-2" size={20} />❌ Application
												rejected
											</p>
										</div>
									)}
								</div>
							))
						)}
					</div>
				)}

				{/* BIDS TAB */}
				{activeTab === "bids" && (
					<div className="space-y-6">
						{bids.length === 0 ? (
							<div className="bg-white rounded-xl shadow-lg p-12 text-center">
								<DollarSign className="mx-auto mb-4 text-gray-400" size={64} />
								<h3 className="text-xl font-semibold text-gray-700 mb-2">
									No Bids Yet
								</h3>
								<p className="text-gray-500">
									Bids from service providers will appear here
								</p>
							</div>
						) : (
							bids.map((bid) => (
								<div
									key={bid._id}
									className="bg-white rounded-xl shadow-lg overflow-hidden p-6"
								>
									<div className="flex justify-between items-start mb-4">
										<div>
											<h3 className="text-xl font-bold text-gray-900 mb-1">
												Bid from {bid.tractorOwner?.name || bid.worker?.name}
											</h3>
											<p className="text-sm text-gray-600">
												{bid.requirement?.workType ||
													bid.requirement?.serviceType}
											</p>
										</div>
										<span
											className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(
												bid.status
											)}`}
										>
											{bid.status.toUpperCase()}
										</span>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
										<div className="flex items-center text-gray-700">
											<IndianRupee className="mr-2 text-green-600" size={18} />
											<span className="font-semibold">Bid Amount:</span>
											<span className="ml-2 font-bold text-green-600">
												₹{bid.bidAmount}
											</span>
										</div>

										<div className="flex items-center text-gray-700">
											<Clock className="mr-2 text-green-600" size={18} />
											<span className="font-semibold">Submitted:</span>
											<span className="ml-2">{formatDate(bid.createdAt)}</span>
										</div>
									</div>

									{bid.message && (
										<div className="bg-blue-50 p-4 rounded-lg mb-4">
											<p className="text-sm text-gray-700">
												<span className="font-semibold">Message:</span>{" "}
												{bid.message}
											</p>
										</div>
									)}

									{bid.status === "pending" && (
										<div className="flex gap-2 pt-4 border-t-2">
											<button
												onClick={() => handleAcceptBid(bid._id)}
												disabled={actionLoading === bid._id}
												className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center disabled:opacity-50"
											>
												{actionLoading === bid._id ? (
													<Loader className="animate-spin mr-2" size={16} />
												) : (
													<CheckCircle className="mr-2" size={16} />
												)}
												Accept Bid
											</button>
											<button
												onClick={() => handleRejectBid(bid._id)}
												disabled={actionLoading === bid._id}
												className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold flex items-center justify-center disabled:opacity-50"
											>
												<XCircle className="mr-2" size={16} />
												Reject
											</button>
										</div>
									)}

									{bid.status === "accepted" && (
										<div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
											<p className="text-green-800 font-semibold flex items-center">
												<CheckCircle className="mr-2" size={20} />✅ Bid
												accepted! Booking created.
											</p>
										</div>
									)}

									{bid.status === "rejected" && (
										<div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
											<p className="text-red-800 font-semibold flex items-center">
												<XCircle className="mr-2" size={20} />❌ Bid rejected
											</p>
										</div>
									)}
								</div>
							))
						)}
					</div>
				)}

				{/* BROWSE WORKERS TAB - CONTINUED IN NEXT PART */}
				{/* BROWSE WORKERS TAB */}
				{activeTab === "workers" && (
					<div className="space-y-6">
						{/* Search and Filters */}
						<div className="bg-white rounded-xl shadow-lg p-6">
							<h3 className="text-xl font-bold mb-4 flex items-center text-gray-800">
								<Search className="mr-2 text-green-600" size={24} />
								Find Workers
							</h3>

							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
								<input
									type="text"
									placeholder="Search by District"
									value={workerSearch.district}
									onChange={(e) =>
										setWorkerSearch({
											...workerSearch,
											district: e.target.value,
										})
									}
									className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
								/>

								<select
									value={workerSearch.workerType}
									onChange={(e) =>
										setWorkerSearch({
											...workerSearch,
											workerType: e.target.value,
										})
									}
									className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
								>
									<option value="">All Work Types</option>
									<option value="Farm Labor">Farm Labor</option>
									<option value="Harvester">Harvester</option>
									<option value="Irrigator">Irrigator</option>
									<option value="Sprayer">Sprayer</option>
									<option value="General Helper">General Helper</option>
									<option value="Ploughing">Ploughing</option>
									<option value="Seeding">Seeding</option>
									<option value="Pesticide Application">
										Pesticide Application
									</option>
								</select>

								<input
									type="number"
									placeholder="Max ₹/Day"
									value={workerSearch.maxCharge}
									onChange={(e) =>
										setWorkerSearch({
											...workerSearch,
											maxCharge: e.target.value,
										})
									}
									className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
								/>

								<input
									type="number"
									placeholder="Min Experience (years)"
									value={workerSearch.minExperience}
									onChange={(e) =>
										setWorkerSearch({
											...workerSearch,
											minExperience: e.target.value,
										})
									}
									className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
								/>

								<div className="flex gap-2">
									<button
										onClick={handleSearchWorkers}
										disabled={loading}
										className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
									>
										<Search className="mr-2" size={18} />
										{loading ? "Searching..." : "Search"}
									</button>

									<button
										onClick={handleResetFilters}
										className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
									>
										<Filter size={18} />
									</button>
								</div>
							</div>
						</div>

						{/* Workers Grid */}
						{loading ? (
							<div className="flex justify-center py-12">
								<div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-600"></div>
							</div>
						) : availableWorkers.length === 0 ? (
							<div className="bg-white rounded-xl shadow-lg p-12 text-center">
								<Users className="mx-auto mb-4 text-gray-400" size={64} />
								<h3 className="text-xl font-semibold text-gray-700 mb-2">
									No Workers Available
								</h3>
								<p className="text-gray-500 mb-4">
									Try adjusting your search filters or check back later
								</p>
								<button
									onClick={handleResetFilters}
									className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
								>
									Reset Filters
								</button>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{availableWorkers.map((worker) => {
									// Check if this worker has pending/accepted request
									const existingRequest = hireRequests.find(
										(r) =>
											r.workerService?._id === worker._id &&
											(r.status === "pending" || r.status === "accepted")
									);

									return (
										<div
											key={worker._id}
											className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-500"
										>
											{/* Worker Header */}
											<div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 text-white">
												<div className="flex items-center justify-between mb-2">
													<h3 className="text-xl font-bold flex items-center">
														<User className="mr-2" size={20} />
														{worker.worker?.name || "Worker"}
													</h3>
													{worker.bookingStatus === "available" && (
														<span className="px-3 py-1 bg-white text-green-600 rounded-full text-xs font-bold shadow">
															✓ Available
														</span>
													)}
													{worker.bookingStatus === "booked" && (
														<span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold shadow">
															✗ Booked
														</span>
													)}
												</div>
												<p className="text-green-100 text-sm font-semibold">
													{worker.workerType}
												</p>
											</div>

											{/* Worker Details */}
											<div className="p-6 space-y-4">
												<div className="flex items-center text-gray-700">
													<Briefcase
														className="mr-3 text-green-600"
														size={20}
													/>
													<span className="font-semibold">Experience:</span>
													<span className="ml-2">
														{worker.experience} years
													</span>
												</div>

												<div className="flex items-center text-gray-700">
													<IndianRupee
														className="mr-3 text-green-600"
														size={20}
													/>
													<span className="font-semibold">Charge:</span>
													<span className="ml-2 text-lg font-bold text-green-600">
														₹{worker.chargePerDay}/day
													</span>
												</div>

												<div className="flex items-center text-gray-700">
													<Clock className="mr-3 text-green-600" size={20} />
													<span className="font-semibold">Hours:</span>
													<span className="ml-2">
														{worker.workingHours}hrs/day
													</span>
												</div>

												<div className="flex items-center text-gray-700">
													<MapPin className="mr-3 text-green-600" size={20} />
													<span className="font-semibold">Location:</span>
													<span className="ml-2 text-sm">
														{worker.location?.district},{" "}
														{worker.location?.state}
													</span>
												</div>

												{worker.skills && worker.skills.length > 0 && (
													<div>
														<p className="font-semibold text-gray-700 mb-2">
															Skills:
														</p>
														<div className="flex flex-wrap gap-2">
															{worker.skills.map((skill, idx) => (
																<span
																	key={idx}
																	className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold"
																>
																	{skill}
																</span>
															))}
														</div>
													</div>
												)}

												{worker.rating && worker.rating.count > 0 && (
													<div className="flex items-center text-gray-700 bg-yellow-50 p-2 rounded-lg">
														<Star
															className="mr-2 text-yellow-500"
															size={20}
															fill="currentColor"
														/>
														<span className="font-bold text-yellow-600">
															{worker.rating.average.toFixed(1)}
														</span>
														<span className="ml-1 text-sm text-gray-600">
															({worker.rating.count} reviews)
														</span>
													</div>
												)}

												{/* Status Messages */}
												{existingRequest &&
													existingRequest.status === "pending" && (
														<div className="bg-yellow-50 p-3 rounded-lg border-2 border-yellow-200">
															<p className="text-yellow-800 text-sm font-semibold flex items-center">
																<Clock className="mr-2" size={16} />⏳ Request
																Pending...
															</p>
														</div>
													)}

												{existingRequest &&
													existingRequest.status === "accepted" && (
														<div className="bg-green-50 p-3 rounded-lg border-2 border-green-200">
															<p className="text-green-800 text-sm font-semibold flex items-center">
																<CheckCircle className="mr-2" size={16} />✅
																Request Accepted!
															</p>
														</div>
													)}

												{/* Action Buttons */}
												<div className="flex gap-2 mt-6 pt-4 border-t-2">
													<button
														onClick={() => handleContactWorker(worker)}
														className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center shadow hover:shadow-lg"
													>
														<Phone className="mr-2" size={16} />
														Contact
													</button>

													{existingRequest ? (
														existingRequest.status === "pending" ? (
															<button
																disabled
																className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold flex items-center justify-center cursor-not-allowed"
															>
																<Clock className="mr-2" size={16} />
																Pending
															</button>
														) : (
															<button
																onClick={() => setActiveTab("bookings")}
																className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center shadow hover:shadow-lg"
															>
																<CheckCircle className="mr-2" size={16} />
																View Booking
															</button>
														)
													) : (
														<button
															onClick={() => handleHireWorker(worker)}
															disabled={
																worker.bookingStatus === "booked" ||
																actionLoading === worker._id
															}
															className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center shadow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
														>
															{actionLoading === worker._id ? (
																<Loader
																	className="animate-spin mr-2"
																	size={16}
																/>
															) : (
																<CheckCircle className="mr-2" size={16} />
															)}
															{worker.bookingStatus === "booked"
																? "Booked"
																: "Hire Now"}
														</button>
													)}
												</div>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

export default FarmerMyBookings;
