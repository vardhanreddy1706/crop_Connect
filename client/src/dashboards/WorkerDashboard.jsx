/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../config/api";
import toast from "react-hot-toast";
import RatingModal from "../components/RatingModal";
import RatingStars from "../components/RatingStars";
import MyRatingsTab from "../components/MyRatingsTab";
import RatingsReceivedTab from "../components/RatingsRecieved";
import {
	TrendingUp,
	Users,
	Briefcase,
	CheckCircle,
	XCircle,
	Clock,
	IndianRupee,
	MapPin,
	Calendar,
	Phone,
	Mail,
	Edit,
	Trash2,
	Plus,
	Search,
	Filter,
	Star,
	Loader,
	AlertCircle,
	X,
	LogOut,
} from "lucide-react";
import DashboardNavbar from "../components/DashboardNavbar";
import DashboardFooter from "../components/DashboardFooter";
import { useLanguage } from "../context/LanguageContext";

function WorkerDashboard() {
	const { user, logout } = useAuth();
	const { tr } = useLanguage();

	// State management
	const [workOrders, setWorkOrders] = useState([]);
	const [myServices, setMyServices] = useState([]);
	const [hireRequests, setHireRequests] = useState([]); // Requests from farmers
	const [availableJobs, setAvailableJobs] = useState([]); // Jobs posted by farmers
	const [appliedJobs, setAppliedJobs] = useState([]); // Jobs I applied for
	const [transactions, setTransactions] = useState([]);

	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(null);
	const [activeTab, setActiveTab] = useState("overview");
	const [activeWorkSubTab, setActiveWorkSubTab] = useState("accepted");
	const [ratingModal, setRatingModal] = useState({ isOpen: false, data: null });
	const [ratingStats, setRatingStats] = useState({ averageRating: 0, totalRatings: 0, distribution: {} });

	// Check if already rated helper function
	const checkIfRated = async (rateeId, transactionRef) => {
		try {
			const response = await api.get('/ratings/can-rate', {
				params: { rateeId, ...transactionRef }
			});
			return response.data;
		} catch (error) {
			return { canRate: true };
		}
	};

	// Service Modal State
	const [showServiceModal, setShowServiceModal] = useState(false);
	const [editingService, setEditingService] = useState(null);
	const [serviceFormData, setServiceFormData] = useState({
		workerType: "",
		chargePerDay: "",
		experience: "",
		workingHours: "8",
		location: {
			district: "",
			state: "",
			pincode: "",
		},
		skills: "",
		description: "",
		contactNumber: "",
	});

	// Job search filters
	const [jobSearch, setJobSearch] = useState({
		district: "",
		workType: "",
		maxBudget: "",
	});

	// ✅ Fetch all data on mount
	useEffect(() => {
		if (user) {
			fetchAllData();
		}
	}, [user]);

	// ✅ Fetch data when tab changes
	useEffect(() => {
		if (user && activeTab === "available") {
			fetchAvailableJobs();
		}
	}, [activeTab]);

	// ✅ CORRECTED: Fetch all data at once
	const fetchAllData = async () => {
		setLoading(true);
		await Promise.all([
			fetchWorkOrders(),
			fetchHireRequests(),
			fetchMyServices(),
			fetchAvailableJobs(),
			fetchRatingStats(),
		]);
		setLoading(false);
	};

	// Fetch rating stats
	const fetchRatingStats = async () => {
		try {
			const response = await api.get(`/ratings/user/${user._id}`);
			if (response.data.success) {
				setRatingStats(response.data.data.stats);
			}
		} catch (error) {
			console.error('Fetch rating stats error:', error);
		}
	};

	// ✅ CORRECTED: Fetch work orders (bookings where worker is hired)
	const fetchWorkOrders = async () => {
		try {
			const { data } = await api.get("/bookings/worker"); // ✅ This route EXISTS
			setWorkOrders(data.bookings || []);
			console.log("✅ Work orders loaded:", data.bookings?.length || 0);
		} catch (error) {
			console.error("Fetch work orders error:", error);
		}
	};

	const fetchHireRequests = async () => {
		try {
			const { data } = await api.get("/worker-hires/worker-requests"); // ✅ Plural "hires"
			setHireRequests(data.hireRequests || []);
			console.log("✅ Hire requests loaded:", data.hireRequests?.length || 0);
		} catch (error) {
			console.error("Fetch hire requests error:", error);
		}
	};

	// ✅ CORRECTED: Fetch my posted services
	const fetchMyServices = async () => {
		try {
			const { data } = await api.get("/workers/my-posts"); // ✅ Correct: "my-posts" not "my-services"
			setMyServices(data.workerPosts || data.services || []);
			console.log("✅ Services loaded:", data.workerPosts?.length || 0);
		} catch (error) {
			console.error("Fetch my services error:", error);
		}
	};

	// ✅ Helper: filter out expired requirements (startDate before today or not open)
	const isRequirementActive = (req) => {
		try {
			if (req.status && req.status !== "open") return false;
			if (!req.startDate) return true;
			const start = new Date(req.startDate);
			const today = new Date();
			start.setHours(0, 0, 0, 0);
			today.setHours(0, 0, 0, 0);
			return start >= today; // hide past-dated posts
		} catch {
			return true;
		}
	};

	// ✅ CORRECTED: Fetch available jobs (farmer requirements)
	const fetchAvailableJobs = async () => {
		try {
			const params = {};
			if (jobSearch.district) params.district = jobSearch.district;
			if (jobSearch.workType) params.workType = jobSearch.workType;
			if (jobSearch.maxBudget) params.maxBudget = jobSearch.maxBudget;

			const { data } = await api.get("/worker-requirements", { params });
			const list = (data.workerRequirements || []).filter(isRequirementActive);
			setAvailableJobs(list);
			console.log("✅ Available jobs loaded:", list.length);
		} catch (error) {
			console.error("Fetch available jobs error:", error);
		}
	};

	// ✅ Fetch transactions
	const fetchTransactions = async () => {
		try {
			const { data } = await api.get("/transactions/worker");
			setTransactions(data.transactions || []);
		} catch (error) {
			console.error("Fetch transactions error:", error);
		}
	};

	// ✅ Handle search button click
	const handleSearchJobs = () => {
		fetchAvailableJobs();
	};

	// ✅ Reset job filters
	const handleResetFilters = () => {
		setJobSearch({
			district: "",
			workType: "",
			maxBudget: "",
		});
		fetchAvailableJobs();
	};

	const handleAcceptHireRequest = async (requestId) => {
		if (!window.confirm("Accept this hire request and create booking?")) return;

		try {
			setActionLoading(requestId);
			await api.post(`/worker-hires/${requestId}/worker-accept`); // ✅ Plural "hires"
			toast.success("🎉 Hire request accepted! Booking created.");
			await fetchAllData();
			setActiveTab("work");
		} catch (error) {
			console.error("Accept hire request error:", error);
			toast.error(error.response?.data?.message || "Failed to accept request");
		} finally {
			setActionLoading(null);
		}
	};
	// ✅ Reject hire request
	const handleRejectHireRequest = async (requestId) => {
		const reason = prompt("Reason for rejection (optional):");

		try {
			setActionLoading(requestId);
			await api.post(`/worker-hires/${requestId}/worker-reject`, { reason }); // ✅ Plural "hires"
			toast.success("Hire request rejected");
			fetchHireRequests();
		} catch (error) {
			console.error("Reject hire request error:", error);
			toast.error(error.response?.data?.message || "Failed to reject request");
		} finally {
			setActionLoading(null);
		}
	};

	// ✅ CORRECTED: Apply for job
	const handleApplyForJob = async (requirement) => {
		// Enforce gender restriction on client for fast feedback
		if (
			requirement.preferredGender &&
			requirement.preferredGender !== "any" &&
			requirement.preferredGender !== user?.gender
		) {
			const msg =
				requirement.preferredGender === "female"
					? "This job is for female workers only"
					: requirement.preferredGender === "male"
					? "This job is for male workers only"
					: "You are not eligible for this job";
			toast.error(msg);
			return;
		}

		// Check if already applied
		if (requirement.hasApplied) {
			toast.info("You have already applied for this job");
			return;
		}

		if (
			!window.confirm(
				`Apply for ${requirement.workType} job at ₹${requirement.wagesOffered}/day?`
			)
		) {
			return;
		}

		try {
			setActionLoading(requirement._id);
			await api.post(`/worker-requirements/${requirement._id}/apply`);
			toast.success("✅ Application sent! Farmer will be notified.");
			fetchAvailableJobs();
		} catch (error) {
			console.error("Apply for job error:", error);
			toast.error(error.response?.data?.message || "Failed to apply for job");
		} finally {
			setActionLoading(null);
		}
	};

	// ✅ Handle opening service modal for new service
	const handleOpenServiceModal = () => {
		setEditingService(null);
		setServiceFormData({
			workerType: "",
			chargePerDay: "",
			experience: "",
			workingHours: "8",
			location: {
				district: "",
				state: "",
				pincode: "",
			},
			skills: "",
			description: "",
			contactNumber: user?.phone || "",
		});
		setShowServiceModal(true);
	};

	// ✅ Handle opening service modal for editing
	const handleEditService = (service) => {
		setEditingService(service);
		setServiceFormData({
			workerType: service.serviceType || service.workerType,
			chargePerDay:
				service.dailyWage?.toString() || service.chargePerDay?.toString() || "",
			experience: service.experience?.toString() || "",
			workingHours: service.workingHours?.replace("hrs/day", "") || "8",
			location: {
				district: service.location?.district || "",
				state: service.location?.state || "",
				pincode: service.location?.pincode || "",
			},
			skills: service.skills?.join(", ") || "",
			description: service.description || "",
			contactNumber: service.contactNumber || user?.phone || "",
		});
		setShowServiceModal(true);
	};

	// ✅ Handle closing service modal
	const handleCloseServiceModal = () => {
		setShowServiceModal(false);
		setEditingService(null);
	};

	// ✅ Handle form input changes
	const handleServiceFormChange = (e) => {
		const { name, value } = e.target;

		if (name.startsWith("location.")) {
			const locationField = name.split(".")[1];
			setServiceFormData({
				...serviceFormData,
				location: {
					...serviceFormData.location,
					[locationField]: value,
				},
			});
		} else {
			setServiceFormData({
				...serviceFormData,
				[name]: value,
			});
		}
	};

	// ✅ Handle complete work
	const handleCompleteWork = async (bookingId) => {
		if (!window.confirm("Mark this work as completed?")) return;

		try {
			setActionLoading(bookingId);
			await api.post(`/bookings/${bookingId}/complete`);
			toast.success("Work marked as completed!");
			await fetchWorkOrders();
			await fetchMyServices();
			setActiveWorkSubTab("completed");
		} catch (error) {
			const msg = error.response?.data?.message || "Failed to complete work";
			if (
				error.response?.status === 400 &&
				/already marked as completed/i.test(msg)
			) {
				toast.success("Already completed");
				await fetchWorkOrders();
				setActiveWorkSubTab("completed");
			} else {
				toast.error(msg);
			}
		} finally {
			setActionLoading(null);
		}
	};

	const handlePostService = async (e) => {
		e.preventDefault();

		if (
			!serviceFormData.workerType ||
			!serviceFormData.chargePerDay ||
			!serviceFormData.experience
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		try {
			setActionLoading("posting");

			const postData = {
				workerType: serviceFormData.workerType,
				chargePerDay: parseInt(serviceFormData.chargePerDay),
				experience: parseInt(serviceFormData.experience),
				workingHours: parseInt(serviceFormData.workingHours),
				skills: serviceFormData.skills
					? serviceFormData.skills.split(",").map((s) => s.trim())
					: [],
				location: serviceFormData.location,
				description: serviceFormData.description,
				contactNumber: serviceFormData.contactNumber,
			};

			if (editingService) {
				await api.put(`/workers/availability/${editingService._id}`, postData); // ✅ Correct
				toast.success("✅ Service updated!");
			} else {
				await api.post("/workers/post-availability", postData); // ✅ Correct
				toast.success("🎉 Service posted!");
			}

			handleCloseServiceModal();
			fetchMyServices();
		} catch (error) {
			console.error("Post service error:", error);
			toast.error(error.response?.data?.message || "Failed to post service");
		} finally {
			setActionLoading(null);
		}
	};

	// ✅ Delete service
	const handleDeleteService = async (serviceId) => {
		if (!window.confirm("Delete this service?")) return;

		try {
			setActionLoading(serviceId);
			await api.delete(`/workers/availability/${serviceId}`); // ✅ Correct
			toast.success("Service deleted");
			fetchMyServices();
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to delete");
		} finally {
			setActionLoading(null);
		}
	};

	// ✅ Filter out expired services for display
	const isServiceExpired = (s) =>
		s?.availableDates?.length > 0 &&
		s.availableDates.every(
			(r) => r.endDate && new Date(r.endDate) < new Date()
		);
	const visibleServices = myServices.filter((s) => {
		const notExpired = !isServiceExpired(s);
		const isAvailable =
			(s.bookingStatus || "available") === "available" &&
			s.availability !== false;
		return notExpired && isAvailable;
	});

	// ✅ Calculate stats dynamically
	const stats = {
		totalWork: workOrders.length,
		pending: hireRequests.filter((r) => r.status === "pending").length,
		accepted: workOrders.filter(
			(w) => w.status === "confirmed" || w.status === "accepted"
		).length,
		completed: workOrders.filter((w) => w.status === "completed").length,
		rejected: hireRequests.filter((r) => r.status === "rejected").length,
		totalEarnings: workOrders
			.filter((w) => w.paymentStatus === "paid" || w.paymentCompleted)
			.reduce((sum, w) => sum + (w.totalCost || 0), 0),
		postedServices: visibleServices.length,
		availableServices: visibleServices.filter(
			(s) => s.availability !== false && !s.isBooked
		).length,
	};

	// Pagination state for overview lists
	const [pageAvailable, setPageAvailable] = useState(0);
	const [pageActive, setPageActive] = useState(0);
	const [pageServices, setPageServices] = useState(0);
	const [pageTx, setPageTx] = useState(0);
	const [pageActivity, setPageActivity] = useState(0);
	const [pageHireRequests, setPageHireRequests] = useState(0);
	const [pageWork, setPageWork] = useState(0);
	const [pageEarnings, setPageEarnings] = useState(0);

	// Utility functions
	const itemsPerPage = 3;

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
		return new Date(date).toLocaleString("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// derive helpers
	const dayDiff = (start, days) => {
		const d = new Date(start);
		return new Date(
			d.getTime() + (Number(days || 0) || 0) * 24 * 60 * 60 * 1000
		);
	};
	const isPast = (date) => new Date(date) < new Date();

	if (loading && myServices.length === 0 && workOrders.length === 0) {
			return (
			<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
				<div className="text-center">
					<Loader
						className="animate-spin mx-auto mb-4 text-green-600"
						size={48}
					/>
					<div className="text-xl text-gray-700">Loading...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white flex flex-col">
			<DashboardNavbar role="Worker" userName={user?.name} onLogout={logout} />
			<div className="pt-28 pb-8 px-4 flex-1">
				<div className="max-w-7xl mx-auto">
					{/* Header replaced by DashboardNavbar */}

					{/* Stats Cards */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
						<div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300">
							<div className="flex items-center justify-between mb-2">
								<Briefcase size={32} className="opacity-80" />
								<span className="text-3xl font-bold">{stats.totalWork}</span>
							</div>
							<p className="text-blue-100 font-semibold">{tr("Total Work")}</p>
						</div>

						<div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300">
							<div className="flex items-center justify-between mb-2">
								<CheckCircle size={32} className="opacity-80" />
								<span className="text-3xl font-bold">{stats.accepted}</span>
							</div>
							<p className="text-green-100 font-semibold">{tr("Accepted")}</p>
						</div>

						<div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300">
							<div className="flex items-center justify-between mb-2">
								<Clock size={32} className="opacity-80" />
								<span className="text-3xl font-bold">{stats.pending}</span>
							</div>
							<p className="text-yellow-100 font-semibold">
								{tr("Pending Requests")}
							</p>
						</div>

						<div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300">
							<div className="flex items-center justify-between mb-2">
								<IndianRupee size={32} className="opacity-80" />
								<span className="text-3xl font-bold">
									₹{stats.totalEarnings}
								</span>
							</div>
							<p className="text-purple-100 font-semibold">
								{tr("Total Earnings")}
							</p>
						</div>
					</div>

					{/* Tab Navigation */}
					<div className="bg-white rounded-2xl shadow-xl p-2 mb-8">
						<div className="flex flex-wrap gap-2">
							<button
								onClick={() => setActiveTab("overview")}
								className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center ${
									activeTab === "overview"
										? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105"
										: "bg-gray-100 text-gray-600 hover:bg-gray-200"
								}`}
							>
								<TrendingUp className="mr-2" size={20} />
								{tr("Overview")}
							</button>

							<button
								onClick={() => setActiveTab("services")}
								className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center ${
									activeTab === "services"
										? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105"
										: "bg-gray-100 text-gray-600 hover:bg-gray-200"
								}`}
							>
								<Briefcase className="mr-2" size={20} />
								{tr("My Services")} ({visibleServices.length})
							</button>

							<button
								onClick={() => setActiveTab("hire-requests")}
								className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center ${
									activeTab === "hire-requests"
										? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105"
										: "bg-gray-100 text-gray-600 hover:bg-gray-200"
								}`}
							>
								<Mail className="mr-2" size={20} />
								{tr("Hire Requests")} (
								{hireRequests.filter((r) => r.status === "pending").length})
							</button>

							<button
								onClick={() => setActiveTab("work")}
								className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center ${
									activeTab === "work"
										? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105"
										: "bg-gray-100 text-gray-600 hover:bg-gray-200"
								}`}
							>
								<Users className="mr-2" size={20} />
								{tr("My Work")} ({workOrders.length})
							</button>

							<button
								onClick={() => {
									setActiveTab("available");
									fetchAvailableJobs();
								}}
								className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center ${
									activeTab === "available"
										? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105"
										: "bg-gray-100 text-gray-600 hover:bg-gray-200"
								}`}
							>
								<Search className="mr-2" size={20} />
								{tr("Available Work")}
							</button>

							<button
								onClick={() => {
									setActiveTab("earnings");
									fetchTransactions();
								}}
								className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center ${
									activeTab === "earnings"
										? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105"
										: "bg-gray-100 text-gray-600 hover:bg-gray-200"
								}`}
							>
								<IndianRupee className="mr-2" size={20} />
								{tr("Earnings")}
							</button>

							<button
								onClick={() => setActiveTab("my-ratings")}
								className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center ${
									activeTab === "my-ratings"
										? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105"
										: "bg-gray-100 text-gray-600 hover:bg-gray-200"
								}`}
							>
								<Star className="mr-2" size={20} />
								{tr("My Ratings")}
							</button>
						</div>
					</div>

					{/* OVERVIEW TAB */}
					{activeTab === "overview" && (
						<div className="space-y-6">
							{/* Quick Stats Grid */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
								<div className="bg-white rounded-xl shadow-lg p-6">
									<h3 className="text-lg font-bold text-gray-800 mb-4">
										{tr("Work Status")}
									</h3>
									<div className="space-y-3">
										<div className="flex justify-between items-center">
											<span className="text-gray-600">{tr("Completed:")}</span>
											<span className="font-bold text-green-600">
												{stats.completed}
											</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-gray-600">
												{tr("In Progress:")}
											</span>
											<span className="font-bold text-blue-600">
												{
													workOrders.filter((w) => w.status === "confirmed")
														.length
												}
											</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-gray-600">{tr("Pending:")}</span>
											<span className="font-bold text-yellow-600">
												{stats.pending}
											</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-gray-600">{tr("Rejected:")}</span>
											<span className="font-bold text-red-600">
												{stats.rejected}
											</span>
										</div>
									</div>
								</div>

								<div className="bg-white rounded-xl shadow-lg p-6">
									<h3 className="text-lg font-bold text-gray-800 mb-4">
										{tr("My Services")}
									</h3>
									<div className="space-y-3">
										<div className="flex justify-between items-center">
											<span className="text-gray-600">
												{tr("Total Services:")}
											</span>
											<span className="font-bold text-green-600">
												{myServices.length}
											</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-gray-600">{tr("Available:")}</span>
											<span className="font-bold text-blue-600">
												{
													myServices.filter(
														(s) => s.bookingStatus === "available"
													).length
												}
											</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-gray-600">{tr("Booked:")}</span>
											<span className="font-bold text-yellow-600">
												{
													myServices.filter((s) => s.bookingStatus === "booked")
														.length
												}
											</span>
										</div>
									</div>
								</div>

								<div className="bg-white rounded-xl shadow-lg p-6">
									<h3 className="text-lg font-bold text-gray-800 mb-4">
										{tr("Earnings Summary")}
									</h3>
									<div className="space-y-3">
										<div className="flex justify-between items-center">
											<span className="text-gray-600">
												{tr("Total Earned:")}
											</span>
											<span className="font-bold text-green-600">
												₹{stats.totalEarnings}
											</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-gray-600">
												{tr("Pending Payment:")}
											</span>
											<span className="font-bold text-yellow-600">
												₹
												{workOrders
													.filter(
														(w) =>
															w.paymentStatus !== "paid" &&
															w.status === "completed"
													)
													.reduce((sum, w) => sum + w.totalCost, 0)}
											</span>
										</div>
									</div>
								</div>

								<div className="bg-white rounded-xl shadow-lg p-6">
									<h3 className="text-lg font-bold text-gray-800 mb-4">
										{tr("My Ratings")}
									</h3>
									<div className="space-y-3">
										<div className="flex items-center justify-center py-3">
											<div className="text-center">
												<div className="flex items-center justify-center gap-2 mb-2">
													<Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
													<span className="text-4xl font-bold text-gray-900">
														{ratingStats.averageRating > 0 ? ratingStats.averageRating.toFixed(1) : '0.0'}
													</span>
												</div>
												<p className="text-sm text-gray-600">
													{ratingStats.totalRatings} {ratingStats.totalRatings === 1 ? tr('Review') : tr('Reviews')}
												</p>
											</div>
										</div>
										<button
											onClick={() => setActiveTab('ratings-received')}
											className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-4 py-2 rounded-lg transition-all font-medium flex items-center justify-center gap-2"
										>
											<Star className="w-4 h-4" />
											{tr('View All Reviews')}
										</button>
									</div>
								</div>
							</div>

							{/* Top 3 panels */}
							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
								{/* Available Work */}
								<div className="bg-white rounded-xl shadow-lg p-6">
									<h3 className="text-lg font-bold text-gray-800 mb-3">
										{tr("Top Available Work")}
									</h3>
									<ul className="space-y-2">
										{availableJobs
											.slice(
												pageAvailable * itemsPerPage,
												pageAvailable * itemsPerPage + itemsPerPage
											)
											.map((j) => (
												<li
													key={j._id}
													className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
												>
													<span className="text-sm font-semibold">
														{j.workType}
													</span>
													<span className="text-xs text-gray-600">
														{formatDate(j.startDate)}
													</span>
												</li>
											))}
									</ul>
									{availableJobs.length > itemsPerPage && (
										<div className="text-right mt-3">
											<button
												onClick={() =>
													setPageAvailable(
														(pageAvailable + 1) %
															Math.ceil(availableJobs.length / itemsPerPage)
													)
												}
												className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
											>
												Next
											</button>
										</div>
									)}
								</div>

								{/* Active Work */}
								<div className="bg-white rounded-xl shadow-lg p-6">
									<h3 className="text-lg font-bold text-gray-800 mb-3">
										{tr("Top Active Work")}
									</h3>
									{workOrders.filter((w) => w.status === "confirmed").length ===
									0 ? (
										<p className="text-gray-500">{tr("No active work")}</p>
									) : (
										<>
											<ul className="space-y-2">
												{workOrders
													.filter((w) => w.status === "confirmed")
													.slice(
														pageActive * itemsPerPage,
														pageActive * itemsPerPage + itemsPerPage
													)
													.map((w) => (
														<li
															key={w._id}
															className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
														>
															<span className="text-sm font-semibold">
																{w.workType || w.serviceType}
															</span>
															<span className="text-xs text-gray-600">
																{formatDate(w.bookingDate)}
															</span>
														</li>
													))}
											</ul>
											{workOrders.filter((w) => w.status === "confirmed")
												.length > itemsPerPage && (
												<div className="text-right mt-3">
													<button
														onClick={() =>
															setPageActive(
																(pageActive + 1) %
																	Math.ceil(
																		workOrders.filter(
																			(w) => w.status === "confirmed"
																		).length / itemsPerPage
																	)
															)
														}
														className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
													>
														Next
													</button>
												</div>
											)}
										</>
									)}
								</div>

								{/* Transactions */}
								<div className="bg-white rounded-xl shadow-lg p-6">
									<h3 className="text-lg font-bold text-gray-800 mb-3">
										{tr("Top Transactions")}
									</h3>
									{workOrders.filter((w) => w.paymentStatus === "paid")
										.length === 0 ? (
										<p className="text-gray-500">{tr("No transactions yet")}</p>
									) : (
										<>
											<ul className="space-y-2">
												{workOrders
													.filter((w) => w.paymentStatus === "paid")
													.slice(
														pageTx * itemsPerPage,
														pageTx * itemsPerPage + itemsPerPage
													)
													.map((w) => (
														<li
															key={w._id}
															className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
														>
															<span className="text-sm font-semibold">
																{w.workType || w.serviceType}
															</span>
															<span className="text-xs text-gray-600">
																₹{w.totalCost}
															</span>
														</li>
													))}
											</ul>
											{workOrders.filter((w) => w.paymentStatus === "paid")
												.length > itemsPerPage && (
												<div className="text-right mt-3">
													<button
														onClick={() =>
															setPageTx(
																(pageTx + 1) %
																	Math.ceil(
																		workOrders.filter(
																			(w) => w.paymentStatus === "paid"
																		).length / itemsPerPage
																	)
															)
														}
														className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
													>
														Next
													</button>
												</div>
											)}
										</>
									)}
								</div>
							</div>

							{/* Recent Activity */}
							<div className="bg-white rounded-xl shadow-lg p-6">
								<h3 className="text-xl font-bold text-gray-800 mb-4">
									{tr("Recent Activity")}
								</h3>
								{workOrders.length === 0 && hireRequests.length === 0 ? (
									<div className="text-center py-12">
										<AlertCircle
											className="mx-auto mb-4 text-gray-400"
											size={64}
										/>
										<p className="text-gray-500">{tr("No recent activity")}</p>
									</div>
								) : (
									<>
										<div className="space-y-4">
											{[...hireRequests, ...workOrders]
												.sort(
													(a, b) =>
														new Date(b.createdAt) - new Date(a.createdAt)
												)
												.slice(
													pageActivity * itemsPerPage,
													pageActivity * itemsPerPage + itemsPerPage
												)
												.map((item, index) => (
													<div
														key={index}
														className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
													>
														<div className="flex items-center">
															{item.status === "pending" ? (
																<Clock
																	className="mr-3 text-yellow-600"
																	size={24}
																/>
															) : item.status === "accepted" ||
															  item.status === "confirmed" ? (
																<CheckCircle
																	className="mr-3 text-green-600"
																	size={24}
																/>
															) : (
																<XCircle
																	className="mr-3 text-red-600"
																	size={24}
																/>
															)}
															<div>
																<p className="font-semibold text-gray-800">
																	{item.workerService?.workerType ||
																		item.workType ||
																		"Work Request"}
																</p>
																<p className="text-sm text-gray-600">
																	{formatDate(item.createdAt)}
																</p>
															</div>
														</div>
														<span
															className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
																item.status
															)}`}
														>
															{item.status.toUpperCase()}
														</span>
													</div>
												))}
										</div>
										<div className="flex justify-end items-center gap-2 mt-4">
											<button
												onClick={() =>
													setPageActivity(Math.max(0, pageActivity - 1))
												}
												className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
											>
												Prev
											</button>
											<button
												onClick={() =>
													setPageActivity(
														(pageActivity + 1) %
															Math.max(
																1,
																Math.ceil(
																	(hireRequests.length + workOrders.length) /
																		itemsPerPage
																)
															)
													)
												}
												className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
											>
												Next
											</button>
										</div>
									</>
								)}
							</div>
						</div>
					)}

					{/* MY SERVICES TAB */}
					{activeTab === "services" && (
						<div className="space-y-6">
							<div className="bg-white rounded-xl shadow-lg p-6">
								<div className="flex justify-between items-center mb-4">
									<h3 className="text-xl font-bold text-gray-800">
										{tr("My Posted Services")} ({visibleServices.length})
									</h3>
									<button
										onClick={handleOpenServiceModal}
										className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center shadow hover:shadow-lg"
									>
										<Plus className="mr-2" size={16} />
										{tr("Post New Service")}
									</button>
								</div>

								{visibleServices.length === 0 ? (
									<div className="text-center py-12">
										<Briefcase
											className="mx-auto mb-4 text-gray-400"
											size={64}
										/>
										<h3 className="text-xl font-semibold text-gray-700 mb-2">
											{tr("No Services Posted")}
										</h3>
										<p className="text-gray-500 mb-4">
											{tr("Post your services to get hired by farmers")}
										</p>
										<button
											onClick={handleOpenServiceModal}
											className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
										>
											{tr("Post Your First Service")}
										</button>
									</div>
								) : (
									<>
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
											{visibleServices
												.slice(
													pageServices * itemsPerPage,
													pageServices * itemsPerPage + itemsPerPage
												)
												.map((service) => (
													<div
														key={service._id}
														className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200 hover:border-green-500 transition-all"
													>
														<div className="bg-gradient-to-r from-green-500 to-blue-500 p-4 text-white">
															<div className="flex justify-between items-start">
																<h3 className="text-lg font-bold">
																	{tr(service.workerType)}
																</h3>
																{/* ✅ FIXED: Check bookingStatus or availability */}
																{service.bookingStatus === "booked" ? (
																	<span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
																		⏳ {tr("Booked")}
																	</span>
																) : service.bookingStatus === "completed" ? (
																	<span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
																		✅ {tr("Completed")}
																	</span>
																) : (
																	<span className="px-3 py-1 bg-white text-green-600 rounded-full text-xs font-bold">
																		✓ {tr("Available")}
																	</span>
																)}
															</div>
														</div>

														<div className="p-4 space-y-3">
															<div className="flex items-center text-gray-700">
																<IndianRupee
																	className="mr-2 text-green-600"
																	size={18}
																/>
																<span className="font-semibold">
																	{tr("Rate:")}
																</span>
																<span className="ml-2 font-bold text-green-600">
																	₹{service.chargePerDay}/day
																</span>
															</div>

															<div className="flex items-center text-gray-700">
																<Briefcase
																	className="mr-2 text-green-600"
																	size={18}
																/>
																<span className="font-semibold">
																	{tr("Experience:")}
																</span>
																<span className="ml-2">
																	{service.experience} years
																</span>
															</div>

															<div className="flex items-center text-gray-700">
																<Clock
																	className="mr-2 text-green-600"
																	size={18}
																/>
																<span className="font-semibold">
																	{tr("Hours:")}
																</span>
																<span className="ml-2">
																	{service.workingHours}hrs/day
																</span>
															</div>

															<div className="flex items-center text-gray-700">
																<MapPin
																	className="mr-2 text-green-600"
																	size={18}
																/>
																<span className="font-semibold">
																	{tr("Location:")}
																</span>
																<span className="ml-2 text-sm">
																	{service.location?.district || "N/A"}
																</span>
															</div>

															{service.skills && service.skills.length > 0 && (
																<div>
																	<p className="font-semibold text-gray-700 mb-2 text-sm">
																		{tr("Skills:")}
																	</p>
																	<div className="flex flex-wrap gap-1">
																		{service.skills
																			.slice(0, 3)
																			.map((skill, idx) => (
																				<span
																					key={idx}
																					className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold"
																				>
																					{skill}
																				</span>
																			))}
																		{service.skills.length > 3 && (
																			<span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
																				+{service.skills.length - 3}
																			</span>
																		)}
																	</div>
																</div>
															)}

															{service.bookingStatus === "booked" &&
																service.currentBookingId && (
																	<div className="bg-yellow-50 p-3 rounded-lg border-2 border-yellow-200 mt-3">
																		<p className="text-yellow-800 text-sm font-semibold">
																			⏳ {tr("Currently Booked")}
																		</p>
																		<button
																			onClick={() => setActiveTab("work")}
																			className="text-yellow-600 text-sm underline mt-1"
																		>
																			{tr("View Booking →")}
																		</button>
																	</div>
																)}

															{/* Action Buttons */}
															<div className="flex gap-2 pt-3 border-t-2">
																<button
																	onClick={() => handleEditService(service)}
																	disabled={service.bookingStatus === "booked"}
																	className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
																>
																	<Edit className="mr-1" size={14} />
																	{tr("Edit")}
																</button>
																<button
																	onClick={() =>
																		handleDeleteService(service._id)
																	}
																	disabled={
																		service.bookingStatus === "booked" ||
																		actionLoading === service._id
																	}
																	className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
																>
																	{actionLoading === service._id ? (
																		<Loader
																			className="animate-spin"
																			size={14}
																		/>
																	) : (
																		<Trash2 size={14} />
																	)}
																</button>
															</div>
														</div>
													</div>
												))}
										</div>
										{/* Pagination */}
										{visibleServices.length > itemsPerPage && (
											<div className="flex justify-end items-center gap-2 mt-4">
												<button
													onClick={() =>
														setPageServices(Math.max(0, pageServices - 1))
													}
													className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
												>
													{tr("Prev")}
												</button>
												<button
													onClick={() =>
														setPageServices(
															(pageServices + 1) %
																Math.ceil(visibleServices.length / itemsPerPage)
														)
													}
													className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
												>
													{tr("Next")}
												</button>
											</div>
										)}
									</>
								)}
							</div>
						</div>
					)}

					{/* HIRE REQUESTS TAB */}
					{activeTab === "hire-requests" && (
						<div className="space-y-6">
							<div className="bg-white rounded-xl shadow-lg p-6">
								<h3 className="text-xl font-bold text-gray-800 mb-4">
									{tr("Hire Requests from Farmers")} ({hireRequests.length})
								</h3>

								{hireRequests.length === 0 ? (
									<div className="text-center py-12">
										<Mail className="mx-auto mb-4 text-gray-400" size={64} />
										<h3 className="text-xl font-semibold text-gray-700 mb-2">
											{tr("No Hire Requests")}
										</h3>
										<p className="text-gray-500">
											{tr("Farmers' hire requests will appear here")}
										</p>
									</div>
								) : (
									<>
										<div className="space-y-4">
											{hireRequests
												.slice(
													pageHireRequests * itemsPerPage,
													pageHireRequests * itemsPerPage + itemsPerPage
												)
												.map((request) => (
											<div
												key={request._id}
												className="bg-white rounded-xl shadow-lg overflow-hidden p-6 border-2 border-gray-200 hover:border-green-500 transition"
											>
												<div className="flex justify-between items-start mb-4">
													<div>
														<h3 className="text-xl font-bold text-gray-900 mb-1">
															Hire Request from{" "}
															{request.farmer?.name || "Farmer"}
														</h3>
														<p className="text-sm text-gray-600">
															{request.workerService?.workerType || "Service"}
														</p>
													</div>
													<span
														className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
															request.status
														)}`}
													>
														{request.status?.toUpperCase() || "PENDING"}
													</span>
												</div>

												<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
													<div className="flex items-center text-gray-700">
														<IndianRupee
															className="mr-2 text-green-600"
															size={18}
														/>
														<span className="font-semibold">
															{tr("Amount:")}
														</span>
														<span className="ml-2 font-bold text-green-600">
															₹{request.agreedAmount || 0}/day
														</span>
													</div>

													<div className="flex items-center text-gray-700">
														<Clock className="mr-2 text-green-600" size={18} />
														<span className="font-semibold">
															{tr("Received:")}
														</span>
														<span className="ml-2">
															{formatDate(request.createdAt)}
														</span>
													</div>

													<div className="flex items-center text-gray-700">
														<Phone className="mr-2 text-green-600" size={18} />
														<span className="font-semibold">
															{tr("Contact:")}
														</span>
														<span className="ml-2">
															{request.farmer?.phone || "N/A"}
														</span>
													</div>

													<div className="flex items-center text-gray-700">
														<Mail className="mr-2 text-green-600" size={18} />
														<span className="font-semibold">
															{tr("Email:")}
														</span>
														<span className="ml-2 text-sm">
															{request.farmer?.email || "N/A"}
														</span>
													</div>
												</div>

												{request.notes && (
													<div className="bg-blue-50 p-4 rounded-lg mb-4">
														<p className="text-sm text-gray-700">
															<span className="font-semibold">
																{tr("Notes:")}
															</span>{" "}
															{request.notes}
														</p>
													</div>
												)}

												{request.workDetails && (
													<div className="bg-gray-50 p-4 rounded-lg mb-4">
														<p className="font-semibold text-gray-700 mb-2">
															{tr("Work Details:")}
														</p>
														<div className="text-sm text-gray-600 space-y-1">
															{request.workDetails.startDate && (
																<p>
																	{tr("Start Date:")}{" "}
																	{formatDate(request.workDetails.startDate)}
																</p>
															)}
															{request.workDetails.duration && (
																<p>
																	{tr("Duration:")}{" "}
																	{request.workDetails.duration} {tr("day(s)")}
																</p>
															)}
															{request.workDetails.workDescription && (
																<p>
																	{tr("Work:")}{" "}
																	{request.workDetails.workDescription}
																</p>
															)}
															{request.workDetails.location?.district && (
																<p>
																	{tr("Location:")}{" "}
																	{request.workDetails.location.district}
																</p>
															)}
														</div>
													</div>
												)}

												{request.status === "pending" && (
													<div className="flex gap-2 pt-4 border-t-2">
														<button
															onClick={() =>
																handleAcceptHireRequest(request._id)
															}
															disabled={actionLoading === request._id}
															className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center disabled:opacity-50"
														>
															{actionLoading === request._id ? (
																<Loader
																	className="animate-spin mr-2"
																	size={16}
																/>
															) : (
																<CheckCircle className="mr-2" size={16} />
															)}
															{tr("Accept & Book")}
														</button>
														<button
															onClick={() =>
																handleRejectHireRequest(request._id)
															}
															disabled={actionLoading === request._id}
															className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold flex items-center justify-center disabled:opacity-50"
														>
															<XCircle className="mr-2" size={16} />
															{tr("Reject")}
														</button>
													</div>
												)}

												{request.status === "accepted" && (
													<div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
														<p className="text-green-800 font-semibold flex items-center mb-2">
															<CheckCircle className="mr-2" size={20} />✅{" "}
															{tr("Request accepted! Booking created.")}
														</p>
														<button
															onClick={() => setActiveTab("work")}
															className="text-green-600 font-semibold underline"
														>
															{tr("View Booking →")}
														</button>
													</div>
												)}

												{request.status === "rejected" && (
													<div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
														<p className="text-red-800 font-semibold flex items-center">
															<XCircle className="mr-2" size={20} />❌{" "}
															{tr("Request rejected")}
														</p>
														{request.rejectionReason && (
															<p className="text-red-600 text-sm mt-2">
																{tr("Reason:")} {request.rejectionReason}
															</p>
														)}
													</div>
												)}
											</div>
										))}
										</div>
										{/* Pagination */}
										{hireRequests.length > itemsPerPage && (
											<div className="flex justify-end items-center gap-2 mt-4">
												<button
													onClick={() =>
														setPageHireRequests(Math.max(0, pageHireRequests - 1))
													}
													disabled={pageHireRequests === 0}
													className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
												>
													{tr("Prev")}
												</button>
												<button
													onClick={() =>
														setPageHireRequests(
															(pageHireRequests + 1) %
																Math.ceil(hireRequests.length / itemsPerPage)
														)
													}
													disabled={
														pageHireRequests >=
														Math.ceil(hireRequests.length / itemsPerPage) - 1
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
						</div>
					)}

					{/* MY WORK TAB */}
					{activeTab === "work" && (
						<div className="space-y-6">
							{/* Sub-tabs for My Work */}
							<div className="bg-white rounded-xl shadow-lg p-2">
								<div className="flex gap-2">
									<button
										onClick={() => setActiveWorkSubTab("accepted")}
										className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
											activeWorkSubTab === "accepted"
												? "bg-green-600 text-white"
												: "bg-gray-100 text-gray-600 hover:bg-gray-200"
										}`}
									>
										{tr("Active Work")} (
										{workOrders.filter((w) => w.status === "confirmed").length})
									</button>
									<button
										onClick={() => setActiveWorkSubTab("completed")}
										className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
											activeWorkSubTab === "completed"
												? "bg-green-600 text-white"
												: "bg-gray-100 text-gray-600 hover:bg-gray-200"
										}`}
									>
										{tr("Completed")} (
										{workOrders.filter((w) => w.status === "completed").length})
									</button>
									<button
										onClick={() => setActiveWorkSubTab("cancelled")}
										className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
											activeWorkSubTab === "cancelled"
												? "bg-green-600 text-white"
												: "bg-gray-100 text-gray-600 hover:bg-gray-200"
										}`}
									>
										{tr("Cancelled")} (
										{workOrders.filter((w) => w.status === "cancelled").length})
									</button>
								</div>
							</div>

							{/* Work Orders List */}
							{(() => {
								const filteredWork = workOrders.filter((w) => {
									if (activeWorkSubTab === "accepted")
										return w.status === "confirmed";
									if (activeWorkSubTab === "completed")
										return w.status === "completed";
									if (activeWorkSubTab === "cancelled")
										return w.status === "cancelled";
									return false;
								});
								const paginatedWork = filteredWork.slice(
									pageWork * itemsPerPage,
									pageWork * itemsPerPage + itemsPerPage
								);

								return (
									<>
										{filteredWork.length === 0 ? (
											<div className="bg-white rounded-xl shadow-lg p-12 text-center">
												<Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
												<h3 className="text-xl font-semibold text-gray-900 mb-2">
													{activeWorkSubTab === "accepted" && tr("No Active Work")}
													{activeWorkSubTab === "completed" && tr("No Completed Work")}
													{activeWorkSubTab === "cancelled" && tr("No Cancelled Work")}
												</h3>
												<p className="text-gray-600 mb-6">
													{activeWorkSubTab === "accepted" && tr("You don't have any active work assignments at the moment.")}
													{activeWorkSubTab === "completed" && tr("You haven't completed any work yet.")}
													{activeWorkSubTab === "cancelled" && tr("No work has been cancelled.")}
												</p>
												{activeWorkSubTab === "accepted" && (
													<button
														onClick={() => setActiveTab("available")}
														className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2"
													>
														<Search className="h-5 w-5" />
														<span>{tr("Find Work")}</span>
													</button>
												)}
											</div>
										) : (
											<>
										{paginatedWork.map((work) => (
									<div
										key={work._id}
										className="bg-white rounded-xl shadow-lg overflow-hidden"
									>
										<div
											className={`p-6 bg-gradient-to-r ${
												work.status === "confirmed"
													? "from-blue-500 to-blue-600"
													: work.status === "completed"
													? "from-green-500 to-green-600"
													: "from-red-500 to-red-600"
											} text-white`}
										>
											<div className="flex justify-between items-start">
												<div>
													<h3 className="text-xl font-bold mb-1">
														{work.workType || work.serviceType}
													</h3>
													<p className="text-sm opacity-90">
														Work ID: {work._id.slice(-8).toUpperCase()}
													</p>
												</div>
												<span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
													{work.status.toUpperCase()}
												</span>
											</div>
										</div>

										<div className="p-6">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
												<div className="flex items-center text-gray-700">
													<Calendar className="mr-2 text-green-600" size={18} />
													<span className="font-semibold">{tr("Date:")}</span>
													<span className="ml-2">
														{formatDate(work.bookingDate)}
													</span>
												</div>

												<div className="flex items-center text-gray-700">
													<IndianRupee
														className="mr-2 text-green-600"
														size={18}
													/>
													<span className="font-semibold">{tr("Amount:")}</span>
													<span className="ml-2 font-bold text-green-600">
														₹{work.totalCost}
													</span>
												</div>

												<div className="flex items-center text-gray-700">
													<MapPin className="mr-2 text-green-600" size={18} />
													<span className="font-semibold">
														{tr("Location:")}
													</span>
													<span className="ml-2 text-sm">
														{work.location?.district ||
															work.location?.village ||
															"N/A"}
													</span>
												</div>

												<div className="flex items-center text-gray-700">
													<Clock className="mr-2 text-green-600" size={18} />
													<span className="font-semibold">
														{tr("Duration:")}
													</span>
													<span className="ml-2">{work.duration} day(s)</span>
												</div>
											</div>

											{/* Action Buttons for Active Work */}
											{work.status === "confirmed" && (
												<div className="flex gap-2 pt-4 border-t-2">
													{new Date(work.bookingDate) > new Date() ? (
														<button
															disabled
															className="flex-1 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg font-semibold"
														>
															{tr("Starts on")} {formatDate(work.bookingDate)}
														</button>
													) : (
														<button
															onClick={() => handleCompleteWork(work._id)}
															disabled={actionLoading === work._id}
															className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center disabled:opacity-50"
														>
															{actionLoading === work._id ? (
																<Loader
																	className="animate-spin mr-2"
																	size={16}
																/>
															) : (
																<CheckCircle className="mr-2" size={16} />
															)}
															{tr("Mark as Completed")}
														</button>
													)}
												</div>
											)}

											{work.paymentStatus === "paid" && (
												<div className="bg-green-50 p-4 rounded-lg border-2 border-green-200 mt-4">
													<p className="text-green-800 font-semibold flex items-center">
														<CheckCircle className="mr-2" size={20} />
														💰 {tr("Payment Received Successfully")}
													</p>
												</div>
											)}

											{work.paymentStatus !== "paid" &&
												work.status === "completed" && (
													<div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200 mt-4">
														<p className="text-yellow-800 font-semibold flex items-center">
															<Clock className="mr-2" size={20} />{" "}
															{tr("Waiting for payment from farmer...")}
														</p>
													</div>
												)}

												{work.status === "completed" && (
													<div className="mt-4">
														<button
															onClick={async () => {
																const farmerId = work.farmer?._id || work.farmer;
																const canRateData = await checkIfRated(
																	farmerId,
																	{ relatedBooking: work._id }
																);
																if (canRateData.canRate) {
																	setRatingModal({
																		isOpen: true,
																		data: {
																			rateeId: farmerId,
																			rateeName: work.farmer?.name || 'Farmer',
																			rateeRole: 'farmer',
																			ratingType: 'worker_to_farmer',
																			relatedBooking: work._id,
																		}
																	});
																} else {
																	toast.info('You have already rated this farmer');
																}
															}}
															className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition font-semibold shadow-md hover:shadow-lg"
														>
															<Star className="w-5 h-5" />
															{tr("Rate Farmer")}
														</button>
													</div>
												)}
										</div>
									</div>
										))}
										{/* Pagination */}
										{filteredWork.length > itemsPerPage && (
											<div className="flex justify-end items-center gap-2 mt-4">
												<button
													onClick={() => setPageWork(Math.max(0, pageWork - 1))}
													disabled={pageWork === 0}
													className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
												>
													{tr("Prev")}
												</button>
												<button
													onClick={() =>
														setPageWork(
															(pageWork + 1) %
																Math.ceil(filteredWork.length / itemsPerPage)
														)
													}
													disabled={
														pageWork >= Math.ceil(filteredWork.length / itemsPerPage) - 1
													}
													className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
												>
													{tr("Next")}
												</button>
											</div>
										)}
										</>
									)}
								</>
								);
							})()}
						</div>
					)}

					{/* AVAILABLE WORK TAB */}
					{activeTab === "available" && (
						<div className="space-y-6">
							{/* Search and Filters */}
							<div className="bg-white rounded-xl shadow-lg p-6">
								<h3 className="text-xl font-bold mb-4 flex items-center text-gray-800">
									<Search className="mr-2 text-green-600" size={24} />
									{tr("Find Available Jobs")}
								</h3>

								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
									<input
										type="text"
										placeholder={tr("Search by District")}
										value={jobSearch.district}
										onChange={(e) =>
											setJobSearch({ ...jobSearch, district: e.target.value })
										}
										className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
									/>

									<select
										value={jobSearch.workType}
										onChange={(e) =>
											setJobSearch({ ...jobSearch, workType: e.target.value })
										}
										className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
									>
										<option value="">{tr("All Work Types")}</option>
										<option value="Farm Labor">{tr("Farm Labor")}</option>
										<option value="Harvester">{tr("Harvester")}</option>
										<option value="Irrigator">{tr("Irrigator")}</option>
										<option value="Sprayer">{tr("Sprayer")}</option>
										<option value="General Helper">
											{tr("General Helper")}
										</option>
										<option value="Ploughing">{tr("Ploughing")}</option>
										<option value="Seeding">{tr("Seeding")}</option>
										<option value="Pesticide Application">
											{tr("Pesticide Application")}
										</option>
									</select>

									<input
										type="number"
										placeholder={tr("Max Wage ₹")}
										value={jobSearch.maxBudget}
										onChange={(e) =>
											setJobSearch({ ...jobSearch, maxBudget: e.target.value })
										}
										className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
									/>

									<div className="flex gap-2">
										<button
											onClick={handleSearchJobs}
											disabled={loading}
											className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
										>
											<Search className="mr-2" size={18} />
											{loading ? tr("Searching...") : tr("Search")}
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

							{/* Jobs Grid */}
							{loading ? (
								<div className="flex justify-center py-12">
									<div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-600"></div>
								</div>
							) : availableJobs.length === 0 ? (
								<div className="bg-white rounded-xl shadow-lg p-12 text-center">
									<Search className="mx-auto mb-4 text-gray-400" size={64} />
									<h3 className="text-xl font-semibold text-gray-700 mb-2">
										{tr("No Available Jobs")}
									</h3>
									<p className="text-gray-500 mb-4">
										{tr(
											"Try adjusting your search filters or check back later"
										)}
									</p>
									<button
										onClick={handleResetFilters}
										className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
									>
										{tr("Reset Filters")}
									</button>
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
									{availableJobs.map((job) => {
										const alreadyApplied = appliedJobs.find(
											(applied) => applied.workerService?._id === job._id
										);

										return (
											<div
												key={job._id}
												className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-500"
											>
												<div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6 text-white">
													<div className="flex items-center justify-between mb-2">
														<h3 className="text-xl font-bold flex items-center">
															<Briefcase className="mr-2" size={20} />
															{job.workType}
														</h3>
														{job.status === "open" && (
															<span className="px-3 py-1 bg-white text-purple-600 rounded-full text-xs font-bold shadow">
																✓ {tr("Open")}
															</span>
														)}
													</div>
													<p className="text-purple-100 text-sm font-semibold">
														{tr("Posted by")} {job.farmer?.name}
													</p>
												</div>

												<div className="p-6 space-y-4">
													<div className="flex items-center text-gray-700">
														<IndianRupee
															className="mr-3 text-green-600"
															size={20}
														/>
														<span className="font-semibold">{tr("Wage:")}</span>
														<span className="ml-2 text-lg font-bold text-green-600">
															₹{job.wagesOffered}/day
														</span>
													</div>

													<div className="flex items-center text-gray-700">
														<Calendar
															className="mr-3 text-green-600"
															size={20}
														/>
														<span className="font-semibold">
															{tr("Start:")}
														</span>
														<span className="ml-2">
															{formatDate(job.startDate)}
														</span>
														{new Date(job.startDate) < new Date() && (
															<span className="ml-3 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-semibold">
																{tr("Expired")}
															</span>
														)}
													</div>

													<div className="flex items-center text-gray-700">
														<Clock className="mr-3 text-green-600" size={20} />
														<span className="font-semibold">
															{tr("Duration:")}
														</span>
														<span className="ml-2">{job.workDuration}</span>
													</div>

													<div className="flex items-center text-gray-700">
														<MapPin className="mr-3 text-green-600" size={20} />
														<span className="font-semibold">
															{tr("Location:")}
														</span>
														<span className="ml-2 text-sm">
															{job.location?.district}, {job.location?.state}
														</span>
													</div>

													<div className="flex items-center text-gray-700">
														<Phone className="mr-3 text-green-600" size={20} />
														<span className="font-semibold">
															{tr("Contact:")}
														</span>
														<span className="ml-2 text-sm">
															{job.farmer?.phone || "N/A"}
														</span>
													</div>

													{(job.foodProvided || job.transportationProvided) && (
														<div className="bg-blue-50 p-3 rounded-lg">
															<p className="text-sm font-semibold text-gray-700 mb-1">
																{tr("Benefits:")}
															</p>
															<div className="flex flex-wrap gap-2">
																{job.foodProvided && (
																	<span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
																		🍽️ {tr("Food Provided")}
																	</span>
																)}
																{job.transportationProvided && (
																	<span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
																		🚗 {tr("Transport Provided")}
																	</span>
																)}
															</div>
														</div>
													)}

													{job.notes && (
														<div className="bg-gray-50 p-3 rounded-lg">
															<p className="text-sm text-gray-700">
																<span className="font-semibold">
																	{tr("Notes:")}
																</span>{" "}
																{job.notes}
															</p>
														</div>
													)}

													{/* Status Messages */}
													{alreadyApplied &&
														alreadyApplied.status === "pending" && (
															<div className="bg-yellow-50 p-3 rounded-lg border-2 border-yellow-200">
																<p className="text-yellow-800 text-sm font-semibold flex items-center">
																	<Clock className="mr-2" size={16} />⏳
																	{tr("Application Pending...")}
																</p>
															</div>
														)}

													{alreadyApplied &&
														alreadyApplied.status === "accepted" && (
															<div className="bg-green-50 p-3 rounded-lg border-2 border-green-200">
																<p className="text-green-800 text-sm font-semibold flex items-center">
																	<CheckCircle className="mr-2" size={16} />✅
																	{tr("Application Accepted!")}
																</p>
																<button
																	onClick={() => setActiveTab("work")}
																	className="text-green-600 text-sm underline mt-1"
																>
																	{tr("View Work →")}
																</button>
															</div>
														)}

													{alreadyApplied &&
														alreadyApplied.status === "rejected" && (
															<div className="bg-red-50 p-3 rounded-lg border-2 border-red-200">
																<p className="text-red-800 text-sm font-semibold flex items-center">
																	<XCircle className="mr-2" size={16} />❌
																	{tr("Application Rejected")}
																</p>
															</div>
														)}

													{/* Action Button */}
													<div className="pt-4 border-t-2">
														{alreadyApplied ? (
															alreadyApplied.status === "pending" ? (
																<button
																	disabled
																	className="w-full px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold flex items-center justify-center cursor-not-allowed"
																>
																	<Clock className="mr-2" size={16} />
																	{tr("Application Pending")}
																</button>
															) : alreadyApplied.status === "accepted" ? (
																<button
																	onClick={() => setActiveTab("work")}
																	className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center shadow hover:shadow-lg"
																>
																	<CheckCircle className="mr-2" size={16} />
																	{tr("View My Work")}
																</button>
															) : (
																<button
																	disabled
																	className="w-full px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold flex items-center justify-center cursor-not-allowed"
																>
																	<XCircle className="mr-2" size={16} />
																	{tr("Rejected")}
																</button>
															)
														) : (
															<button
																onClick={() => handleApplyForJob(job)}
																className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center shadow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
																disabled={
																	job.status !== "open" ||
																	new Date(job.startDate) < new Date() ||
																	actionLoading === job._id
																}
															>
																{actionLoading === job._id ? (
																	<Loader
																		className="animate-spin mr-2"
																		size={16}
																	/>
																) : (
																	<CheckCircle className="mr-2" size={16} />
																)}
																{tr("Apply for Job")}
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

					{/* EARNINGS TAB */}
					{activeTab === "earnings" && (
						<div className="space-y-6">
							<h3 className="text-xl font-bold text-gray-800">
								{tr("Earnings")}
							</h3>

							{/* Summary */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div className="bg-white rounded-xl shadow-lg p-6">
									<p className="text-gray-600 font-semibold mb-1">{tr("Total Earned")}</p>
									<p className="text-2xl font-bold text-green-600">
										₹{transactions.filter(t => t.status === "completed").reduce((s, t) => s + (t.amount || 0), 0)}
									</p>
								</div>
								<div className="bg-white rounded-xl shadow-lg p-6">
									<p className="text-gray-600 font-semibold mb-1">{tr("Pending Amount")}</p>
									<p className="text-2xl font-bold text-yellow-600">
										₹{transactions.filter(t => t.status === "pending").reduce((s, t) => s + (t.amount || 0), 0)}
									</p>
								</div>
								<div className="bg-white rounded-xl shadow-lg p-6">
									<p className="text-gray-600 font-semibold mb-1">{tr("Payments Received")}</p>
									<p className="text-2xl font-bold text-gray-800">{transactions.filter(t => t.status === "completed").length}</p>
								</div>
							</div>

							{/* Transactions List */}
							<div className="bg-white rounded-xl shadow-lg p-6">
								<h4 className="text-lg font-bold text-gray-800 mb-4">{tr("Transactions")}</h4>
								{transactions.length === 0 ? (
									<div className="text-center py-10 text-gray-500">{tr("No transactions yet")}</div>
								) : (
									<>
										<div className="overflow-x-auto">
											<table className="min-w-full">
												<thead>
													<tr className="text-left text-sm text-gray-600">
														<th className="py-2">{tr("Date")}</th>
														<th className="py-2">{tr("Work")}</th>
														<th className="py-2">{tr("Amount")}</th>
														<th className="py-2">{tr("Status")}</th>
													</tr>
												</thead>
												<tbody>
													{transactions
														.slice(
															pageEarnings * itemsPerPage,
															pageEarnings * itemsPerPage + itemsPerPage
														)
														.map((tx) => (
													<tr key={tx._id} className="border-t">
														<td className="py-2 text-sm">{formatDate(tx.createdAt)}</td>
														<td className="py-2 text-sm">{tx.bookingId?.workType || tx.bookingId?.serviceType || "-"}</td>
														<td className="py-2 font-semibold text-gray-800">₹{tx.amount || 0}</td>
														<td className="py-2">
															<span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(tx.status)}`}>
																{(tx.status || "").toUpperCase()}
															</span>
														</td>
													</tr>
														))}
												</tbody>
											</table>
										</div>
										{/* Pagination */}
										{transactions.length > itemsPerPage && (
											<div className="flex justify-end items-center gap-2 mt-4">
												<button
													onClick={() => setPageEarnings(Math.max(0, pageEarnings - 1))}
													disabled={pageEarnings === 0}
													className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
												>
													{tr("Prev")}
												</button>
												<button
													onClick={() =>
														setPageEarnings(
															(pageEarnings + 1) %
																Math.ceil(transactions.length / itemsPerPage)
														)
													}
													disabled={
														pageEarnings >= Math.ceil(transactions.length / itemsPerPage) - 1
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
						</div>
					)}

					{/* MY RATINGS TAB */}
					{activeTab === "my-ratings" && <MyRatingsTab />}

					{/* RATINGS RECEIVED TAB */}
					{activeTab === "ratings-received" && <RatingsReceivedTab />}

					{/* POST SERVICE MODAL */}
					{showServiceModal && (
						<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
							<div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
								{/* Modal Header */}
								<div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 text-white rounded-t-2xl">
									<div className="flex justify-between items-center">
										<h2 className="text-2xl font-bold">
											{editingService
												? tr("Edit Service")
												: tr("Post New Service")}
										</h2>
										<button
											onClick={handleCloseServiceModal}
											className="text-white hover:bg-white/20 rounded-full p-2 transition"
										>
											<X size={24} />
										</button>
									</div>
								</div>
								{/* Modal Form */}
								<form onSubmit={handlePostService} className="p-6 space-y-4">
									{/* Work Type */}
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">
											{tr("Work Type")} <span className="text-red-500">*</span>
										</label>
										<select
											name="workerType"
											value={serviceFormData.workerType}
											onChange={handleServiceFormChange}
											required
											className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
										>
											<option value="">{tr("Select Work Type")}</option>
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
											<option value="Other">{tr("Other")}</option>
										</select>
									</div>

									{/* Charge Per Day */}
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">
											{tr("Charge Per Day (₹) *")}
										</label>
										<input
											type="number"
											name="chargePerDay"
											value={serviceFormData.chargePerDay}
											onChange={handleServiceFormChange}
											required
											min="0"
											placeholder="500"
											className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
										/>
									</div>

									{/* Experience */}
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">
											{tr("Experience (years) *")}
										</label>
										<input
											type="number"
											name="experience"
											value={serviceFormData.experience}
											onChange={handleServiceFormChange}
											required
											min="0"
											max="50"
											placeholder="5"
											className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
										/>
									</div>

									{/* Working Hours */}
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">
											{tr("Working Hours Per Day")}
										</label>
										<input
											type="number"
											name="workingHours"
											value={serviceFormData.workingHours}
											onChange={handleServiceFormChange}
											min="1"
											max="24"
											placeholder="8"
											className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
										/>
									</div>

									{/* Contact Number */}
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">
											{tr("Contact Number")}{" "}
											<span className="text-red-500">*</span>
										</label>
										<input
											type="tel"
											name="contactNumber"
											value={serviceFormData.contactNumber}
											onChange={handleServiceFormChange}
											required
											placeholder="9876543210"
											className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
										/>
									</div>

									{/* Location - District, State, Pincode */}
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div>
											<label className="block text-sm font-semibold text-gray-700 mb-2">
												{tr("District")}
											</label>
											<input
												type="text"
												name="location.district"
												value={serviceFormData.location.district}
												onChange={handleServiceFormChange}
												placeholder="Pune"
												className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
											/>
										</div>

										<div>
											<label className="block text-sm font-semibold text-gray-700 mb-2">
												{tr("State")}
											</label>
											<input
												type="text"
												name="location.state"
												value={serviceFormData.location.state}
												onChange={handleServiceFormChange}
												placeholder="Maharashtra"
												className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
											/>
										</div>

										<div>
											<label className="block text-sm font-semibold text-gray-700 mb-2">
												{tr("Pincode")}
											</label>
											<input
												type="text"
												name="location.pincode"
												value={serviceFormData.location.pincode}
												onChange={handleServiceFormChange}
												placeholder="411001"
												maxLength="6"
												className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
											/>
										</div>
									</div>

									{/* Skills */}
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">
											{tr("Skills (comma separated)")}
										</label>
										<input
											type="text"
											name="skills"
											value={serviceFormData.skills}
											onChange={handleServiceFormChange}
											placeholder="Tractor Driving, Harvesting, Irrigation"
											className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
										/>
										<p className="text-xs text-gray-500 mt-1">
											{tr("Separate multiple skills with commas")}
										</p>
									</div>

									{/* Description */}
									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-2">
											{tr("Description")}
										</label>
										<textarea
											name="description"
											value={serviceFormData.description}
											onChange={handleServiceFormChange}
											rows="3"
											placeholder={tr("Describe your service...")}
											className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition resize-none"
										></textarea>
									</div>

									{/* Action Buttons */}
									<div className="flex gap-4 pt-4">
										<button
											type="button"
											onClick={handleCloseServiceModal}
											className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
										>
											{tr("Cancel")}
										</button>
										<button
											type="submit"
											disabled={actionLoading === "posting"}
											className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
										>
											{actionLoading === "posting" ? (
												<>
													<Loader className="animate-spin mr-2" size={20} />
													{editingService
														? tr("Updating...")
														: tr("Posting...")}
												</>
											) : (
												<>
													<CheckCircle className="mr-2" size={20} />
													{editingService
														? tr("Update Service")
														: tr("Post Service")}
												</>
											)}
										</button>
									</div>
								</form>
							</div>
						</div>
					)}
				</div>
			</div>
			<DashboardFooter
				role="Worker"
				actions={[
					{
						label: tr("Post Service"),
						onClick: handleOpenServiceModal,
						icon: Plus,
					},
					{
						label: tr("Find Work"),
						onClick: () => setActiveTab("available"),
						icon: Search,
					},
					{
						label: tr("Earnings"),
						onClick: () => setActiveTab("earnings"),
						icon: IndianRupee,
					},
				]}
			/>

			{/* Rating Modal */}
			<RatingModal
				isOpen={ratingModal.isOpen}
				onClose={() => setRatingModal({ isOpen: false, data: null })}
				{...ratingModal.data}
				onRatingSubmitted={() => {
					fetchWorkOrders();
				}}
			/>
		</div>
	);
}

export default WorkerDashboard;