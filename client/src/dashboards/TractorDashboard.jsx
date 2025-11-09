/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import {
	Tractor,
	Calendar,
	MapPin,
	IndianRupee,
	Clock,
	User,
	Bell,
	TrendingUp,
	CheckCircle,
	XCircle,
	AlertCircle,
	Zap,
	Search,
	Filter,
	Plus,
	Settings,
	Phone,
	Mail,
	LogOut,
	X,
	ChevronRight,
	Package,
	Activity,
	Briefcase,
	Star,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useNotificationContext } from "../context/NotificationContext";
import api from "../config/api";
import LanguageSelector from "../components/LanguageSelector";
import DashboardNavbar from "../components/DashboardNavbar";
import DashboardFooter from "../components/DashboardFooter";
import { useLanguage } from "../context/LanguageContext";
import RatingModal from "../components/RatingModal";
import MyRatingsTab from "../components/MyRatingsTab";
import RatingsReceivedTab from "../components/RatingsReceived";

const TractorDashboard = () => {
	const { user, logout } = useAuth();
	const { notifications, unreadCount } = useNotificationContext();
	const { tr } = useLanguage();

	useEffect(() => {
		toast.dismiss();
	}, []);

	// ==================== STATE MANAGEMENT ====================
	const [activeTab, setActiveTab] = useState("overview");
	const [myWorkSubTab, setMyWorkSubTab] = useState("active"); // Default to Active Work subtab
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	// Data states
	const [myServices, setMyServices] = useState([]);
	const [requirements, setRequirements] = useState([]);
	const [myBids, setMyBids] = useState([]); // NEW: My placed bids
	const [myWork, setMyWork] = useState([]); // NEW: Accepted work bookings
	const [dashboardData, setDashboardData] = useState(null);
	const [stats, setStats] = useState({
		totalServices: 0,
		activeRequests: 0,
		totalEarnings: 0,
		pendingPayments: 0,
		acceptedWork: 0,
		completedWork: 0,
	});

	// Form states
	const [showServiceForm, setShowServiceForm] = useState(false);
	const [showBidModal, setShowBidModal] = useState(null);

	// Filter states
	const [searchTerm, setSearchTerm] = useState("");
	const [filters, setFilters] = useState({
		workType: "",
		district: "",
		urgency: "",
		status: "",
	});

	// Pagination states
	const itemsPerPage = 3;
	const [pageNotifications, setPageNotifications] = useState(0);
	const [pageRequirements, setPageRequirements] = useState(0);
	const [pageMyWork, setPageMyWork] = useState(0);
	const [pageServices, setPageServices] = useState(0);
	const [pagePayments, setPagePayments] = useState(0);

	// New service form
	const [newService, setNewService] = useState({
		brand: "",
		model: "",
		vehicleNumber: "",
		typeOfPlowing: "",
		landType: "",
		chargePerAcre: "",
		chargePerHour: "",
		workingDuration: "8", // Default 8 hours
		location: { district: "", state: "", village: "", pincode: "" },
		contactNumber: user?.phone || "",
		availability: true,
		availableDate: "",
		availableTime: "",
	});

	// Bid form
	const [bidForm, setBidForm] = useState({
		proposedAmount: "",
		proposedDuration: "1",
		message: "",
	});

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
			return { canRate: true };
		}
	};

	// ==================== DATA FETCHING ====================
	const fetchAllData = useCallback(async () => {
		try {
			setRefreshing(true);
			const results = await Promise.allSettled([
				api.get("/tractors/my-services"),
				api.get("/tractor-requirements", {
					params: {
						district: user?.address?.district,
						state: user?.address?.state,
					},
				}),
				api.get("/transactions/dashboard"),
				api.get("/bids/tractor-owner"), // NEW: Fetch my bids
				api.get("/bookings/tractor-owner"), // NEW: Fetch my work/bookings
			]);

			// Handle services
			if (results[0].status === "fulfilled") {
				setMyServices(results[0].value.data.tractorServices || []);
			}

			// Handle requirements
			if (results[1].status === "fulfilled") {
				setRequirements(results[1].value.data.tractorRequirements || []);
			}

			// Handle dashboard
			if (results[2].status === "fulfilled") {
				setDashboardData(results[2].value.data);
			}

			// NEW: Handle bids
			if (results[3].status === "fulfilled") {
				setMyBids(results[3].value.data.bids || []);
			}

			// NEW: Handle my work (bookings)
			if (results[4].status === "fulfilled") {
				const bookings = results[4].value.data.bookings || [];
				setMyWork(bookings);
				setStats((prev) => ({
					...prev,
					totalServices: results[0].value?.data.tractorServices?.length || 0,
					activeRequests:
						results[1].value?.data.tractorRequirements?.filter(
							(r) => r.status === "open"
						).length || 0,
					totalEarnings: results[2].value?.data.stats?.totalAmount || 0,
					pendingPayments: results[2].value?.data.stats?.pendingAmount || 0,
					acceptedWork: bookings.filter((b) => b.status === "confirmed").length,
					completedWork: bookings.filter((b) => b.status === "completed")
						.length,
				}));
			}
		} catch (error) {
			console.error("Fetch error:", error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	useEffect(() => {
		fetchAllData();
	}, [fetchAllData]);

	// ✅ Periodically refresh data to update active work status and auto-complete expired bookings
	useEffect(() => {
		const interval = setInterval(async () => {
			if (activeTab === "mywork") {
				// Call auto-complete endpoint to mark expired bookings as complete
				try {
					await api.post("/bookings/auto-complete");
				} catch (error) {
					console.error("Auto-complete error:", error);
				}
				// Refresh data to show updated status
				fetchAllData();
			}
		}, 60000); // Refresh every minute

		return () => clearInterval(interval);
	}, [activeTab, fetchAllData]);

	// ==================== SERVICE POSTING ====================
	const handleCreateService = async (e) => {
		e.preventDefault();
		try {
			// Build payload with explicit date and time and a combined ISO for backward-compat
			const combinedISO = newService.availableDate
				? new Date(
						`${newService.availableDate}T${newService.availableTime || "00:00"}`
				  ).toISOString()
				: null;
			const payload = {
				...newService,
				availableDates: combinedISO ? [combinedISO] : [],
			};
			const response = await api.post("/tractors", payload);
			toast.success(
				`✅ Service posted!${
					response.data.notifiedFarmers > 0
						? ` ${response.data.notifiedFarmers} farmers notified`
						: ""
				}`
			);
			setShowServiceForm(false);
			setNewService({
				brand: "",
				model: "",
				vehicleNumber: "",
				typeOfPlowing: "",
				landType: "",
				chargePerAcre: "",
				chargePerHour: "",
				workingDuration: "8",
				location: { district: "", state: "", village: "", pincode: "" },
				contactNumber: user?.phone || "",
				availability: true,
				availableDate: "",
				availableTime: "",
			});
			fetchAllData();
		} catch (error) {
			const errorMessage =
				error.response?.data?.message ||
				error.message ||
				tr("Failed to post service");
			toast.error(errorMessage);
		}
	};

	// ==================== NEW BID SYSTEM ====================
	const handlePlaceBid = async (requirementId) => {
		try {
			const requirement = requirements.find((r) => r._id === requirementId);

			await api.post("/bids", {
				requirementId,
				proposedAmount: parseFloat(bidForm.proposedAmount),
				proposedDuration: `${bidForm.proposedDuration} hours`,
				proposedDate: requirement?.expectedDate,
				message: bidForm.message,
			});

			toast.success("🎉 Bid placed successfully! Farmer will be notified");
			setShowBidModal(null);
			setBidForm({ proposedAmount: "", proposedDuration: "1", message: "" });
			fetchAllData();
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to place bid");
		}
	};

	// ==================== WORK COMPLETION ====================
	const handleMarkWorkComplete = async (bookingId) => {
		if (!window.confirm("Mark this work as completed?")) return;

		try {
			await api.post(`/bookings/${bookingId}/complete`);
			toast.success("✅ Work marked as completed!");
			fetchAllData();
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to complete work");
		}
	};

	// ==================== FILTERING ====================
	const filteredRequirements = requirements.filter((req) => {
		const matchesSearch =
			!searchTerm ||
			req.workType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			req.location?.district?.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesWorkType =
			!filters.workType || req.workType === filters.workType;
		const matchesDistrict =
			!filters.district ||
			req.location?.district
				?.toLowerCase()
				.includes(filters.district.toLowerCase());
		const matchesUrgency = !filters.urgency || req.urgency === filters.urgency;
		const matchesStatus = !filters.status || req.status === filters.status;

		return (
			matchesSearch &&
			matchesWorkType &&
			matchesDistrict &&
			matchesUrgency &&
			matchesStatus
		);
	});

	// ==================== RENDER ====================
	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300 text-lg">
						{tr("Loading your dashboard...")}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			<Toaster position="top-right" />

			{/* HEADER + NAVIGATION via shared DashboardNavbar */}
			<DashboardNavbar
				role={tr("Tractor Owner")}
				userName={user?.name}
				onLogout={logout}
				tabs={[
					{ id: "overview", label: tr("Overview"), icon: TrendingUp },
					{
						id: "requirements",
						label: tr("Available Work"),
						icon: Search,
						badge: stats.activeRequests,
					},
					{
						id: "mywork",
						label: tr("My Work"),
						icon: Briefcase,
						badge: stats.acceptedWork,
					},
					{
						id: "services",
						label: tr("My Services"),
						icon: Settings,
						badge: stats.totalServices,
					},
					{ id: "payments", label: tr("Payments"), icon: IndianRupee },
					{ id: "my-ratings", label: tr("My Ratings"), icon: Star },
					{ id: "ratings-received", label: tr("Reviews"), icon: Star },
				]}
				activeTab={activeTab}
				onTabChange={setActiveTab}
			/>

			<div className="pt-32 flex-1">
				{/* MAIN CONTENT */}
				<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					{activeTab === "overview" && (
						<OverviewTab
							stats={stats}
							dashboardData={dashboardData}
							notifications={notifications}
							setActiveTab={setActiveTab}
							pageNotifications={pageNotifications}
							setPageNotifications={setPageNotifications}
							itemsPerPage={itemsPerPage}
						/>
					)}

					{activeTab === "requirements" && (
						<RequirementsTab
							requirements={filteredRequirements}
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							filters={filters}
							setFilters={setFilters}
							onPlaceBid={(req) => setShowBidModal(req)}
							myBids={myBids}
							pageRequirements={pageRequirements}
							setPageRequirements={setPageRequirements}
							itemsPerPage={itemsPerPage}
						/>
					)}

					{activeTab === "mywork" && (
						<MyWorkTab
							myWork={myWork}
							activeSubTab={myWorkSubTab}
							setActiveSubTab={setMyWorkSubTab}
							onMarkComplete={handleMarkWorkComplete}
							pageMyWork={pageMyWork}
							setPageMyWork={setPageMyWork}
							itemsPerPage={itemsPerPage}
							checkIfRated={checkIfRated}
							setRatingModal={setRatingModal}
						/>
					)}

					{activeTab === "services" && (
						<ServicesTab
							services={myServices}
							onCancel={() => {}}
							onPostNew={() => setShowServiceForm(true)}
							onWithdraw={async (serviceId) => {
								try {
									const response = await api.delete(`/tractors/${serviceId}`);
									if (response.data.success) {
										toast.success(tr("Service withdrawn successfully"));
										fetchAllData();
									}
								} catch (error) {
									console.error("Withdraw service error:", error);
									toast.error(
										error.response?.data?.message ||
											tr("Failed to withdraw service")
									);
								}
							}}
						/>
					)}

					{activeTab === "payments" && (
						<PaymentsTab dashboardData={dashboardData} />
					)}

					{activeTab === "my-ratings" && <MyRatingsTab />}

					{activeTab === "ratings-received" && <RatingsReceivedTab />}
				</main>

				{/* Dashboard Footer */}
				<DashboardFooter
					role="Tractor Owner"
					actions={[
						{
							label: tr("Post Service"),
							onClick: () => setShowServiceForm(true),
							icon: Plus,
						},
						{
							label: tr("Available Work"),
							onClick: () => setActiveTab("requirements"),
							icon: Search,
						},
						{
							label: tr("Payments"),
							onClick: () => setActiveTab("payments"),
							icon: IndianRupee,
						},
					]}
				/>

				{/* MODALS */}
				{showServiceForm && (
					<ServiceFormModal
						newService={newService}
						setNewService={setNewService}
						onSubmit={handleCreateService}
						onClose={() => setShowServiceForm(false)}
					/>
				)}

				{showBidModal && (
					<BidModal
						requirement={showBidModal}
						bidForm={bidForm}
						setBidForm={setBidForm}
						onSubmit={() => handlePlaceBid(showBidModal._id)}
						onClose={() => setShowBidModal(null)}
					/>
				)}

				{/* Rating Modal */}
				<RatingModal
					isOpen={ratingModal.isOpen}
					onClose={() => setRatingModal({ isOpen: false, data: null })}
					{...ratingModal.data}
					onRatingSubmitted={() => {
						fetchAllData();
					}}
				/>
			</div>
		</div>
	);
};

// Continue with Part 2...
// ==================== MY WORK TAB (NEW) ====================
const MyWorkTab = ({
	myWork,
	activeSubTab,
	setActiveSubTab,
	onMarkComplete,
	pageMyWork,
	setPageMyWork,
	itemsPerPage,
	checkIfRated,
	setRatingModal,
}) => {
	const { tr } = useLanguage();

	// Helper function to check if work is currently active/ongoing
	const isWorkActive = (work) => {
		if (work.status !== "confirmed" && work.status !== "in_progress") {
			return false;
		}

		const now = new Date();
		const bookingStart = new Date(work.bookingDate);
		const durationHours = parseFloat(work.duration || 8);
		const bookingEnd = new Date(
			bookingStart.getTime() + durationHours * 60 * 60 * 1000
		);

		// Work is active if current time is between start and end time
		return now >= bookingStart && now < bookingEnd;
	};

	const filteredWork = myWork.filter((work) => {
		if (activeSubTab === "active") return isWorkActive(work);
		if (activeSubTab === "accepted")
			return work.status === "confirmed" && !isWorkActive(work);
		if (activeSubTab === "completed") return work.status === "completed";
		if (activeSubTab === "cancelled") return work.status === "cancelled";
		return false;
	});

	// Helper to format location gracefully
	const formatLocation = (loc) => {
		if (!loc) return "—";
		if (typeof loc === "string") return loc;
		if (loc.fullAddress && loc.fullAddress.trim()) return loc.fullAddress;
		const parts = [
			loc.village,
			loc.mandal,
			loc.district,
			loc.state,
			loc.pincode,
		].filter(Boolean);
		return parts.length ? parts.join(", ") : "—";
	};

	const formatLandSize = (val) => {
		const num = parseFloat(val);
		return Number.isFinite(num) && num > 0 ? num : "—";
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold text-gray-900">{tr("My Work")}</h2>
			</div>

			{/* Sub Tabs */}
			<div className="flex flex-wrap gap-2 sm:gap-4 border-b overflow-x-auto">
				{[
					{ id: "active", label: tr("Active Work"), icon: Activity },
					{ id: "accepted", label: tr("Accepted Work"), icon: CheckCircle },
					{ id: "completed", label: tr("Completed"), icon: Package },
					{ id: "cancelled", label: tr("Cancelled"), icon: XCircle },
				].map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveSubTab(tab.id)}
						className={`pb-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 transition-colors whitespace-nowrap ${
							activeSubTab === tab.id
								? "border-green-500 text-green-600"
								: "border-transparent text-gray-500 hover:text-gray-700"
						}`}
					>
						<tab.icon className="h-3 w-3 sm:h-4 sm:w-4" />
						<span>{tab.label}</span>
						<span className="bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded-full text-xs">
							{
								myWork.filter((w) => {
									if (tab.id === "active") {
										const now = new Date();
										const bookingStart = new Date(w.bookingDate);
										const durationHours = parseFloat(w.duration || 8);
										const bookingEnd = new Date(
											bookingStart.getTime() + durationHours * 60 * 60 * 1000
										);
										return (
											(w.status === "confirmed" ||
												w.status === "in_progress") &&
											now >= bookingStart &&
											now < bookingEnd
										);
									}
									if (tab.id === "accepted") {
										const now = new Date();
										const bookingStart = new Date(w.bookingDate);
										const durationHours = parseFloat(w.duration || 8);
										const bookingEnd = new Date(
											bookingStart.getTime() + durationHours * 60 * 60 * 1000
										);
										return (
											w.status === "confirmed" &&
											!(now >= bookingStart && now < bookingEnd)
										);
									}
									if (tab.id === "completed") return w.status === "completed";
									if (tab.id === "cancelled") return w.status === "cancelled";
									return false;
								}).length
							}
						</span>
					</button>
				))}
			</div>

			{/* Work List */}
			{filteredWork.length === 0 ? (
				<div className="bg-white rounded-xl shadow-sm p-6 sm:p-12 text-center">
					<Briefcase className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
					<h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
						No {activeSubTab} work
					</h3>
					<p className="text-sm sm:text-base text-gray-600">
						Your {activeSubTab} work will appear here
					</p>
				</div>
			) : (
				<>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
						{filteredWork
							.slice(
								pageMyWork * itemsPerPage,
								pageMyWork * itemsPerPage + itemsPerPage
							)
							.map((work) => (
								<div
									key={work._id}
									className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-green-500 transition-all p-4 sm:p-6"
								>
									{/* Status Badge */}
									<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-4">
										<span
											className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold self-start ${
												isWorkActive(work)
													? "bg-orange-100 text-orange-800 animate-pulse"
													: work.status === "confirmed"
													? "bg-blue-100 text-blue-800"
													: work.status === "completed"
													? "bg-green-100 text-green-800"
													: "bg-red-100 text-red-800"
											}`}
										>
											{isWorkActive(work) && (
												<Activity className="h-3 w-3 mr-1" />
											)}
											{!isWorkActive(work) && work.status === "confirmed" && (
												<Clock className="h-3 w-3 mr-1" />
											)}
											{work.status === "completed" && (
												<CheckCircle className="h-3 w-3 mr-1" />
											)}
											{work.status === "cancelled" && (
												<XCircle className="h-3 w-3 mr-1" />
											)}
											{isWorkActive(work)
												? tr("ONGOING")
												: work.status.toUpperCase()}
										</span>
										<span className="text-xl sm:text-2xl font-bold text-green-600 self-end sm:self-auto">
											₹{work.totalCost}
										</span>
									</div>

									{/* Work Details */}
									<div className="space-y-3 mb-4">
										<div className="flex items-center text-gray-700">
											<Tractor className="h-4 w-4 mr-2 text-green-600" />
											<span className="font-semibold">{work.workType}</span>
										</div>
										<div className="flex items-center text-gray-600 text-sm">
											<Calendar className="h-4 w-4 mr-2" />
											{new Date(work.bookingDate).toLocaleDateString("en-IN", {
												weekday: "short",
												year: "numeric",
												month: "short",
												day: "numeric",
											})}
										</div>
										<div className="flex items-center text-gray-600 text-sm">
											<MapPin className="h-4 w-4 mr-2" />
											{formatLocation(work.location)}
										</div>
										<div className="flex items-center text-gray-600 text-sm">
											<User className="h-4 w-4 mr-2" />
											<span className="font-medium">{work.farmer?.name}</span>
										</div>
										<div className="flex items-center text-gray-600 text-sm">
											<Package className="h-4 w-4 mr-2" />
											Land Size: {formatLandSize(work.landSize)} acres
										</div>
									</div>

									{/* Payment Status */}
									<div className="mb-4">
										<span
											className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
												work.paymentStatus === "paid"
													? "bg-green-100 text-green-800"
													: "bg-orange-100 text-orange-800"
											}`}
										>
											{tr("Payment:")} {work.paymentStatus}
										</span>
									</div>

									{/* Actions */}
									<div className="flex flex-col sm:flex-row gap-2">
										{work.status === "confirmed" && (
											<>
												<a
													href={`tel:${work.farmer?.phone}`}
													className="flex-1 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-sm font-medium"
												>
													<Phone className="h-4 w-4" />
													<span>{tr("Call Farmer")}</span>
												</a>
												{new Date(work.bookingDate) <= new Date() && (
													<button
														onClick={() => onMarkComplete(work._id)}
														className="flex-1 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-sm font-medium"
													>
														<CheckCircle className="h-4 w-4" />
														<span>{tr("Mark Complete")}</span>
													</button>
												)}
											</>
										)}
										{work.status === "completed" &&
											work.paymentStatus === "pending" && (
												<div className="flex-1 bg-orange-50 border-2 border-orange-200 text-orange-800 px-3 sm:px-4 py-2 rounded-lg text-center text-sm font-medium">
													⏳ {tr("Awaiting Payment")}
												</div>
											)}
										{work.status === "completed" &&
											work.paymentStatus === "paid" && (
												<div className="flex-1 bg-green-50 border-2 border-green-200 text-green-800 px-3 sm:px-4 py-2 rounded-lg text-center text-sm font-medium">
													✅ {tr("Payment Received")}
												</div>
											)}
										{work.status === "completed" && (
											<button
												onClick={async () => {
													const farmerId =
														typeof work.farmer === "string"
															? work.farmer
															: work.farmer?._id;
													if (!farmerId) {
														toast.error("Farmer information missing");
														return;
													}
													const canRateData = await checkIfRated(farmerId, {
														relatedBooking: work._id,
													});
													if (canRateData.canRate) {
														setRatingModal({
															isOpen: true,
															data: {
																rateeId: farmerId,
																rateeName: work.farmer?.name || "Farmer",
																rateeRole: "farmer",
																ratingType: "tractor_owner_to_farmer",
																relatedBooking: work._id,
															},
														});
													} else {
														toast.info("You have already rated this farmer");
													}
												}}
												className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all flex items-center justify-center space-x-1 sm:space-x-2 text-sm font-medium shadow-md hover:shadow-lg"
											>
												<Star className="h-4 w-4" />
												<span>{tr("Rate Farmer")}</span>
											</button>
										)}
									</div>

									{/* Booking ID */}
									<div className="mt-3 pt-3 border-t text-xs text-gray-500">
										{tr("Booking ID:")} {work._id.slice(-8).toUpperCase()}
									</div>
								</div>
							))}
					</div>
					{/* Pagination */}
					{filteredWork.length > itemsPerPage && (
						<div className="flex flex-col sm:flex-row justify-center sm:justify-end items-center gap-2 mt-4 sm:mt-6">
							<button
								onClick={() => setPageMyWork(Math.max(0, pageMyWork - 1))}
								disabled={pageMyWork === 0}
								className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
							>
								{tr("Prev")}
							</button>
							<button
								onClick={() =>
									setPageMyWork(
										(pageMyWork + 1) %
											Math.ceil(filteredWork.length / itemsPerPage)
									)
								}
								disabled={
									pageMyWork >=
									Math.ceil(filteredWork.length / itemsPerPage) - 1
								}
								className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
							>
								{tr("Next")}
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
};

// ==================== REQUIREMENTS TAB (UPDATED) ====================
const RequirementsTab = ({
	requirements,
	searchTerm,
	setSearchTerm,
	filters,
	setFilters,
	onPlaceBid,
	myBids,
	pageRequirements,
	setPageRequirements,
	itemsPerPage,
}) => {
	const { tr } = useLanguage();
	const hasBidOnRequirement = (reqId) => {
		return myBids.some((bid) => bid.requirementId?._id === reqId);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">
						{tr("Available Work")}
					</h2>
					<p className="text-gray-600 text-sm">
						{requirements.length} {tr("requirements available")}
					</p>
				</div>
			</div>

			{/* Search and Filters */}
			<div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
					<div className="sm:col-span-2 lg:col-span-2">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
							<input
								type="text"
								placeholder={tr("Search by work type or district...")}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
							/>
						</div>
					</div>
					<select
						value={filters.workType}
						onChange={(e) =>
							setFilters({ ...filters, workType: e.target.value })
						}
						className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
					>
						<option value="">{tr("All Work Types")}</option>
						<option value="Plowing">Plowing</option>
						<option value="Harvesting">Harvesting</option>
						<option value="Spraying">Spraying</option>
						<option value="Hauling">Hauling</option>
						<option value="Land Preparation">Land Preparation</option>
					</select>
					<select
						value={filters.urgency}
						onChange={(e) =>
							setFilters({ ...filters, urgency: e.target.value })
						}
						className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
					>
						<option value="">{tr("All Urgency")}</option>
						<option value="normal">{tr("Normal")}</option>
						<option value="urgent">{tr("Urgent")}</option>
						<option value="very_urgent">{tr("Very Urgent")}</option>
					</select>
					<button
						onClick={() => {
							setSearchTerm("");
							setFilters({
								workType: "",
								district: "",
								urgency: "",
								status: "",
							});
						}}
						className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
					>
						{tr("Clear Filters")}
					</button>
				</div>
			</div>

			{/* Requirements List */}
			{requirements.length === 0 ? (
				<div className="bg-white rounded-xl shadow-sm p-6 sm:p-12 text-center">
					<Search className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
					<h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
						{tr("No requirements found")}
					</h3>
					<p className="text-sm sm:text-base text-gray-600">
						{tr("Check back later for new work opportunities")}
					</p>
				</div>
			) : (
				<>
					<div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
						{requirements
							.slice(
								pageRequirements * itemsPerPage,
								pageRequirements * itemsPerPage + itemsPerPage
							)
							.map((req) => {
								const bidPlaced = hasBidOnRequirement(req._id);
								const bid = myBids.find(
									(b) => b.requirementId?._id === req._id
								);

								const isExpired =
									new Date(req.expectedDate).setHours(0, 0, 0, 0) <
									new Date().setHours(0, 0, 0, 0);
								const isClosed = req.status && req.status !== "open";
								return (
									<div
										key={req._id}
										className="bg-white rounded-xl shadow-md border-2 border-gray-200 hover:border-green-500 transition-all p-4 sm:p-6"
									>
										{/* Header */}
										<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-4">
											<div className="flex-1">
												<h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
													{req.workType}
												</h3>
												<div className="flex items-center space-x-2">
													<span
														className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
															req.urgency === "very_urgent"
																? "bg-red-100 text-red-800"
																: req.urgency === "urgent"
																? "bg-orange-100 text-orange-800"
																: "bg-blue-100 text-blue-800"
														}`}
													>
														{req.urgency === "very_urgent" && (
															<Zap className="h-3 w-3 mr-1" />
														)}
														{req.urgency.replace("_", " ").toUpperCase()}
													</span>
												</div>
											</div>
											<div className="text-left sm:text-right">
												<p className="text-xs sm:text-sm text-gray-500">
													{tr("Budget")}
												</p>
												<p className="text-xl sm:text-2xl font-bold text-green-600">
													₹{req.maxBudget}
												</p>
											</div>
										</div>

										{/* Details */}
										<div className="space-y-3 mb-4">
											<div className="flex items-center text-gray-700">
												<MapPin className="h-4 w-4 mr-2 text-gray-400" />
												<span className="text-sm">
													{req.location?.village
														? `${req.location.village}, `
														: ""}
													{req.location?.district}, {req.location?.state}
												</span>
											</div>
											<div className="flex items-center text-gray-700">
												<Calendar className="h-4 w-4 mr-2 text-gray-400" />
												<span className="text-sm">
													{tr("Expected:")}{" "}
													{new Date(req.expectedDate).toLocaleDateString(
														"en-IN"
													)}
												</span>
											</div>
											<div className="flex items-center text-gray-700">
												<Package className="h-4 w-4 mr-2 text-gray-400" />
												<span className="text-sm">
													{req.landSize} {tr("acres")} • {req.landType}{" "}
													{tr("land")}
												</span>
											</div>
											<div className="flex items-center text-gray-700">
												<Clock className="h-4 w-4 mr-2 text-gray-400" />
												<span className="text-sm">
													{tr("Duration")}: {req.duration}
												</span>
											</div>
											{req.additionalNotes && (
												<div className="mt-3 p-3 bg-gray-50 rounded-lg">
													<p className="text-sm text-gray-700">
														{req.additionalNotes}
													</p>
												</div>
											)}
										</div>

										{/* Farmer Info */}
										<div className="bg-blue-50 rounded-lg p-3 mb-4">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<LanguageSelector />
													<User className="h-4 w-4 mr-2 text-blue-600" />
													<span className="text-sm font-medium text-gray-900">
														{req.farmer?.name}
													</span>
												</div>
												<a
													href={`tel:${req.farmer?.phone}`}
													className="text-blue-600 hover:text-blue-700 text-sm font-medium"
												>
													{req.farmer?.phone}
												</a>
											</div>
										</div>

										{/* Action Button */}
										{bidPlaced ? (
											<div
												className={`w-full px-4 py-3 rounded-lg text-center font-medium text-sm ${
													bid?.status === "accepted"
														? "bg-green-100 text-green-800 border-2 border-green-300"
														: bid?.status === "rejected"
														? "bg-red-100 text-red-800 border-2 border-red-300"
														: "bg-yellow-100 text-yellow-800 border-2 border-yellow-300"
												}`}
											>
												{bid?.status === "accepted" &&
													`✅ Bid Accepted — ₹${
														bid?.proposedAmount ?? bid?.bidAmount
													}`}
												{bid?.status === "rejected" && "❌ Bid Rejected"}
												{bid?.status === "pending" &&
													`⏳ Bid Placed - Pending — ₹${
														bid?.proposedAmount ?? bid?.bidAmount
													}`}
											</div>
										) : isExpired || isClosed ? (
											<div className="w-full px-4 py-3 rounded-lg text-center font-medium text-sm bg-gray-100 text-gray-600 border-2 border-gray-200">
												{isClosed ? "Closed" : "Expired"}
											</div>
										) : (
											<button
												onClick={() => onPlaceBid(req)}
												className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 shadow-lg transition-all"
											>
												<IndianRupee className="h-5 w-5" />
												<span>{tr("Place Bid")}</span>
											</button>
										)}
									</div>
								);
							})}
					</div>
					{/* Pagination */}
					{requirements.length > itemsPerPage && (
						<div className="flex justify-end items-center gap-2 mt-6">
							<button
								onClick={() =>
									setPageRequirements(Math.max(0, pageRequirements - 1))
								}
								disabled={pageRequirements === 0}
								className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
							>
								{tr("Prev")}
							</button>
							<button
								onClick={() =>
									setPageRequirements(
										(pageRequirements + 1) %
											Math.ceil(requirements.length / itemsPerPage)
									)
								}
								disabled={
									pageRequirements >=
									Math.ceil(requirements.length / itemsPerPage) - 1
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
	);
};

// ==================== OTHER TABS (Keep your existing ones) ====================
const OverviewTab = ({
	stats,
	dashboardData,
	notifications,
	setActiveTab,
	pageNotifications,
	setPageNotifications,
	itemsPerPage,
}) => {
	const { tr } = useLanguage();
	return (
		<div className="space-y-6">
			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<StatCard
					title={tr("Total Services")}
					value={stats.totalServices}
					icon={Tractor}
					color="blue"
					onClick={() => setActiveTab("services")}
				/>
				<StatCard
					title={tr("Active Requests")}
					value={stats.activeRequests}
					icon={TrendingUp}
					color="green"
					onClick={() => setActiveTab("requirements")}
				/>
				<StatCard
					title={tr("Total Earnings")}
					value={`₹${stats.totalEarnings.toLocaleString()}`}
					icon={IndianRupee}
					color="green"
					onClick={() => setActiveTab("payments")}
				/>
				<StatCard
					title={tr("Accepted Work")}
					value={stats.acceptedWork}
					icon={CheckCircle}
					color="purple"
					onClick={() => setActiveTab("mywork")}
				/>
			</div>

			{/* Recent Activity */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="bg-white rounded-xl shadow-sm p-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
						<Bell className="h-5 w-5 mr-2 text-green-600" />
						{tr("Recent Notifications")}
					</h3>
					<div className="space-y-3">
						{notifications
							.slice(
								pageNotifications * itemsPerPage,
								pageNotifications * itemsPerPage + itemsPerPage
							)
							.map((notif) => (
								<div
									key={notif._id}
									className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
								>
									<div className="flex-1">
										<p className="text-sm font-medium text-gray-900">
											{notif.title}
										</p>
										<p className="text-xs text-gray-600 mt-1">
											{notif.message}
										</p>
										<p className="text-xs text-gray-400 mt-1">
											{new Date(notif.createdAt).toLocaleString()}
										</p>
									</div>
								</div>
							))}
					</div>
					{notifications.length > itemsPerPage && (
						<div className="flex justify-end items-center gap-2 mt-4">
							<button
								onClick={() =>
									setPageNotifications(Math.max(0, pageNotifications - 1))
								}
								disabled={pageNotifications === 0}
								className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
							>
								{tr("Prev")}
							</button>
							<button
								onClick={() =>
									setPageNotifications(
										(pageNotifications + 1) %
											Math.ceil(notifications.length / itemsPerPage)
									)
								}
								disabled={
									pageNotifications >=
									Math.ceil(notifications.length / itemsPerPage) - 1
								}
								className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
							>
								{tr("Next")}
							</button>
						</div>
					)}
				</div>

				<div className="bg-white rounded-xl shadow-sm p-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">
						{tr("Quick Actions")}
					</h3>
					<div className="space-y-3">
						<button
							onClick={() => setActiveTab("requirements")}
							className="w-full bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-lg text-left flex items-center space-x-3 transition-colors"
						>
							<Search className="h-5 w-5" />
							<span className="font-medium">{tr("Browse Available Work")}</span>
							<ChevronRight className="h-4 w-4 ml-auto" />
						</button>
						<button
							onClick={() => setActiveTab("mywork")}
							className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg text-left flex items-center space-x-3 transition-colors"
						>
							<Briefcase className="h-5 w-5" />
							<span className="font-medium">{tr("View My Work")}</span>
							<ChevronRight className="h-4 w-4 ml-auto" />
						</button>
						<button
							onClick={() => setActiveTab("payments")}
							className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-3 rounded-lg text-left flex items-center space-x-3 transition-colors"
						>
							<IndianRupee className="h-5 w-5" />
							<span className="font-medium">{tr("Check Earnings")}</span>
							<ChevronRight className="h-4 w-4 ml-auto" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

const StatCard = ({ title, value, icon: Icon, color, onClick }) => {
	const colorClasses = {
		blue: "from-blue-500 to-blue-600",
		green: "from-green-500 to-green-600",
		purple: "from-purple-500 to-purple-600",
		orange: "from-orange-500 to-orange-600",
	};

	return (
		<div
			onClick={onClick}
			className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-green-500"
		>
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm text-gray-600 mb-1">{title}</p>
					<p className="text-3xl font-bold text-gray-900">{value}</p>
				</div>
				<div
					className={`bg-gradient-to-br ${colorClasses[color]} p-3 rounded-xl shadow-lg`}
				>
					<Icon className="h-8 w-8 text-white" />
				</div>
			</div>
		</div>
	);
};

// Keep your existing ServicesTab and PaymentsTab components...

// Continue with Part 3 for Modals and Backend...
// ==================== BID MODAL ====================
const BidModal = ({ requirement, bidForm, setBidForm, onSubmit, onClose }) => {
	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
				<div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
					<h2 className="text-2xl font-bold text-gray-900">Place Your Bid</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<X className="h-6 w-6" />
					</button>
				</div>

				<div className="p-6">
					{/* Requirement Details */}
					<div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 mb-6 border-2 border-green-200">
						<h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
							<Tractor className="h-5 w-5 mr-2 text-green-600" />
							Requirement Details
						</h3>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-gray-600">Work Type</p>
								<p className="font-semibold text-gray-900">
									{requirement.workType}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-600">Farmer Budget</p>
								<p className="font-semibold text-green-600 text-lg">
									₹{requirement.maxBudget}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-600">Land Size</p>
								<p className="font-semibold text-gray-900">
									{requirement.landSize} acres
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-600">Expected Date</p>
								<p className="font-semibold text-gray-900">
									{new Date(requirement.expectedDate).toLocaleDateString(
										"en-IN"
									)}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-600">Duration</p>
								<p className="font-semibold text-gray-900">
									{requirement.duration}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-600">Location</p>
								<p className="font-semibold text-gray-900">
									{requirement.location?.district},{" "}
									{requirement.location?.state}
								</p>
							</div>
						</div>
					</div>

					{/* Bid Form */}
					<form
						onSubmit={(e) => {
							e.preventDefault();
							onSubmit();
						}}
						className="space-y-6"
					>
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Your Bid Amount (₹) *
							</label>
							<div className="relative">
								<IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
								<input
									type="number"
									required
									min="1"
									step="0.01"
									value={bidForm.proposedAmount}
									onChange={(e) =>
										setBidForm({ ...bidForm, proposedAmount: e.target.value })
									}
									placeholder={`Farmer's budget: ₹${requirement.maxBudget}`}
									className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-semibold"
								/>
							</div>
							<p className="mt-2 text-sm text-gray-600">
								💡 Tip: Bid competitively. Farmer's max budget is ₹
								{requirement.maxBudget}
							</p>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Estimated Duration (hours) *
							</label>
							<div className="relative">
								<Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
								<input
									type="number"
									required
									min="1"
									max="72"
									value={bidForm.proposedDuration}
									onChange={(e) =>
										setBidForm({ ...bidForm, proposedDuration: e.target.value })
									}
									className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Message to Farmer (Optional)
							</label>
							<textarea
								value={bidForm.message}
								onChange={(e) =>
									setBidForm({ ...bidForm, message: e.target.value })
								}
								placeholder="Introduce yourself and explain why you're the best fit for this work..."
								rows={4}
								className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
							/>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-4 pt-4">
							<button
								type="button"
								onClick={onClose}
								className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
							>
								Cancel
							</button>
							<button
								type="submit"
								className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all flex items-center justify-center space-x-2"
							>
								<IndianRupee className="h-5 w-5" />
								<span>Submit Bid</span>
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

// ==================== SERVICE FORM MODAL ====================
const ServiceFormModal = ({ newService, setNewService, onSubmit, onClose }) => {
	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
				<div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
					<h2 className="text-2xl font-bold text-gray-900">
						Post New Tractor Service
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<X className="h-6 w-6" />
					</button>
				</div>

				<form onSubmit={onSubmit} className="p-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Brand */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Tractor Brand *
							</label>
							<input
								type="text"
								required
								value={newService.brand}
								onChange={(e) =>
									setNewService({ ...newService, brand: e.target.value })
								}
								placeholder="e.g., Mahindra, John Deere"
								className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>

						{/* Model */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Model *
							</label>
							<input
								type="text"
								required
								value={newService.model}
								onChange={(e) =>
									setNewService({ ...newService, model: e.target.value })
								}
								placeholder="e.g., 575 DI, 5050 E"
								className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>

						{/* Vehicle Number */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Vehicle Number *
							</label>
							<input
								type="text"
								required
								value={newService.vehicleNumber}
								onChange={(e) =>
									setNewService({
										...newService,
										vehicleNumber: e.target.value,
									})
								}
								placeholder="e.g., AP 01 AB 1234"
								className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>

						{/* Type of Plowing */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Type of Service *
							</label>
							<select
								required
								value={newService.typeOfPlowing}
								onChange={(e) =>
									setNewService({
										...newService,
										typeOfPlowing: e.target.value,
									})
								}
								className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							>
								<option value="">Select Service Type</option>
								<option value="Plowing">Plowing</option>
								<option value="Harvesting">Harvesting</option>
								<option value="Spraying">Spraying</option>
								<option value="Hauling">Hauling</option>
								<option value="Land Preparation">Land Preparation</option>
							</select>
						</div>

						{/* Land Type */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Suitable for Land Type *
							</label>
							<select
								required
								value={newService.landType}
								onChange={(e) =>
									setNewService({ ...newService, landType: e.target.value })
								}
								className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							>
								<option value="">Select Land Type</option>
								<option value="Dry">Dry</option>
								<option value="Wet">Wet</option>
								<option value="Hilly">Hilly</option>
								<option value="Plain">Plain</option>
							</select>
						</div>

						{/* Charge per Acre */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Charge per Acre (₹) *
							</label>
							<input
								type="number"
								required
								min="1"
								value={newService.chargePerAcre}
								onChange={(e) =>
									setNewService({
										...newService,
										chargePerAcre: e.target.value,
									})
								}
								placeholder="e.g., 1500"
								className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>

						{/* Charge per Hour */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Charge per Hour (₹) *
							</label>
							<input
								type="number"
								required
								min="1"
								value={newService.chargePerHour}
								onChange={(e) =>
									setNewService({
										...newService,
										chargePerHour: e.target.value,
									})
								}
								placeholder="e.g., 500"
								className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>

						{/* Working Duration */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Working Duration (Hours) *
							</label>
							<input
								type="number"
								required
								min="1"
								max="24"
								value={newService.workingDuration}
								onChange={(e) =>
									setNewService({
										...newService,
										workingDuration: e.target.value,
									})
								}
								placeholder="e.g., 6"
								className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
							<p className="text-xs text-gray-500 mt-1">
								{newService.availableTime && newService.workingDuration
									? (() => {
											const [hours, minutes] = newService.availableTime
												.split(":")
												.map(Number);
											const durationHours = Number(newService.workingDuration);
											const totalMinutes =
												hours * 60 + minutes + durationHours * 60;
											const endHours = Math.floor(totalMinutes / 60) % 24;
											const endMinutes = totalMinutes % 60;
											const endTimeStr = `${String(endHours).padStart(
												2,
												"0"
											)}:${String(endMinutes).padStart(2, "0")}`;
											return `Service will be available from ${newService.availableTime} to ${endTimeStr} (${durationHours} hours)`;
									  })()
									: "Enter time and duration to see end time"}
							</p>
						</div>

						{/* District */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								District *
							</label>
							<input
								type="text"
								required
								value={newService.location.district}
								onChange={(e) =>
									setNewService({
										...newService,
										location: {
											...newService.location,
											district: e.target.value,
										},
									})
								}
								placeholder="e.g., Guntur"
								className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>

						{/* State */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								State *
							</label>
							<input
								type="text"
								required
								value={newService.location.state}
								onChange={(e) =>
									setNewService({
										...newService,
										location: { ...newService.location, state: e.target.value },
									})
								}
								placeholder="e.g., Andhra Pradesh"
								className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>

						{/* Village */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Village (Optional)
							</label>
							<input
								type="text"
								value={newService.location.village}
								onChange={(e) =>
									setNewService({
										...newService,
										location: {
											...newService.location,
											village: e.target.value,
										},
									})
								}
								placeholder="e.g., Pedanandipadu"
								className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>

						{/* Pincode */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Pincode *
							</label>
							<input
								type="text"
								required
								pattern="[0-9]{6}"
								value={newService.location.pincode}
								onChange={(e) =>
									setNewService({
										...newService,
										location: {
											...newService.location,
											pincode: e.target.value,
										},
									})
								}
								placeholder="e.g., 522001"
								className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>

						{/* Contact Number */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Contact Number *
							</label>
							<input
								type="tel"
								required
								pattern="[0-9]{10}"
								value={newService.contactNumber}
								onChange={(e) =>
									setNewService({
										...newService,
										contactNumber: e.target.value,
									})
								}
								placeholder="e.g., 9876543210"
								className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>

						{/* Availability */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Available Date *
							</label>
							<input
								type="date"
								required
								value={newService.availableDate}
								min={new Date().toISOString().split("T")[0]}
								onChange={(e) =>
									setNewService({
										...newService,
										availableDate: e.target.value,
									})
								}
								className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Available Time *
							</label>
							<input
								type="time"
								required
								value={newService.availableTime}
								onChange={(e) =>
									setNewService({
										...newService,
										availableTime: e.target.value,
									})
								}
								className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>
					</div>

					{/* Submit Button */}
					<div className="flex gap-4 mt-8 pt-6 border-t">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all flex items-center justify-center space-x-2"
						>
							<Plus className="h-5 w-5" />
							<span>Post Service</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

// ==================== SERVICES TAB (Keep your existing or use this) ====================
// helper to mark service expired based on scheduled date/time
const isSvcExpired = (svc) => {
	try {
		if (!svc) return false;
		if (svc.availability === false || svc.isBooked) return false; // engaged/unavailable handled separately
		const now = new Date();

		// Check if availableDate and availableTime have passed
		if (svc.availableDate) {
			// Parse the date and time together
			const dateStr = new Date(svc.availableDate).toISOString().slice(0, 10);
			const timeStr = (svc.availableTime || "00:00").padStart(5, "0");
			const when = new Date(`${dateStr}T${timeStr}`);

			if (!isNaN(when.getTime())) {
				// Service is expired if the date/time has passed
				return when < now;
			}
		}

		// Backward compatibility: check availableDates array
		if (Array.isArray(svc.availableDates) && svc.availableDates.length > 0) {
			return svc.availableDates.every((d) => new Date(d) < now);
		}

		return false;
	} catch {
		return false;
	}
};

const ServicesTab = ({ services, onCancel, onPostNew, onWithdraw }) => {
	const { tr } = useLanguage();
	const itemsPerPage = 3;
	const [pageServices, setPageServices] = useState(0);
	const [withdrawingId, setWithdrawingId] = useState(null);

	const handleWithdraw = async (serviceId) => {
		if (
			!window.confirm(
				tr(
					"Are you sure you want to withdraw this service? This action cannot be undone."
				)
			)
		) {
			return;
		}
		setWithdrawingId(serviceId);
		try {
			await onWithdraw(serviceId);
		} finally {
			setWithdrawingId(null);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold text-gray-900">
					{tr("My Services")}
				</h2>
				<button
					onClick={onPostNew}
					className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
				>
					<Plus className="h-5 w-5" />
					<span>{tr("Add New Service")}</span>
				</button>
			</div>

			{services.length === 0 ? (
				<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
					<Tractor className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
						{tr("No services posted yet")}
					</h3>
					<p className="text-gray-600 dark:text-gray-400 mb-6">
						{tr(
							"Post your first tractor service to get started and receive work requests from farmers"
						)}
					</p>
					<button
						onClick={onPostNew}
						className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2"
					>
						<Plus className="h-5 w-5" />
						<span>{tr("Post Service")}</span>
					</button>
				</div>
			) : services.filter((s) => !isSvcExpired(s)).length === 0 ? (
				<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
					<AlertCircle className="h-16 w-16 text-orange-400 mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
						{tr("All services expired")}
					</h3>
					<p className="text-gray-600 dark:text-gray-400 mb-6">
						{tr(
							"Your posted services have passed their availability dates. Post a new service to continue receiving work requests."
						)}
					</p>
					<button
						onClick={onPostNew}
						className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2"
					>
						<Plus className="h-5 w-5" />
						<span>{tr("Post New Service")}</span>
					</button>
				</div>
			) : (
				<>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{services
							.filter((s) => !isSvcExpired(s))
							.slice(
								pageServices * itemsPerPage,
								pageServices * itemsPerPage + itemsPerPage
							)
							.map((service) => (
								<div
									key={service._id}
									className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-6"
								>
									<div className="flex justify-between items-start mb-4">
										<div>
											<h3 className="text-xl font-bold text-gray-900 dark:text-white">
												{service.brand} {service.model}
											</h3>
											<p className="text-gray-600 dark:text-gray-400">
												{service.vehicleNumber}
											</p>
										</div>
										<span
											className={`px-3 py-1 rounded-full text-xs font-semibold ${
												!service.availability || service.isBooked
													? "bg-blue-100 text-blue-800"
													: isSvcExpired(service)
													? "bg-red-100 text-red-800"
													: "bg-green-100 text-green-800"
											}`}
										>
											{!service.availability || service.isBooked
												? tr("Engaged")
												: isSvcExpired(service)
												? tr("Expired")
												: tr("Available")}
										</span>
									</div>

									<div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
										<p>
											<strong>{tr("Service:")}</strong> {service.typeOfPlowing}
										</p>
										<p>
											<strong>{tr("Land Type:")}</strong> {service.landType}
										</p>
										<p>
											<strong>{tr("Charge:")}</strong> ₹{service.chargePerAcre}
											/acre
										</p>
										<p>
											<strong>{tr("Location:")}</strong>{" "}
											{service.location.district}, {service.location.state}
										</p>
										{service.availableDate && (
											<p className="flex items-center">
												<Calendar className="h-4 w-4 mr-2 text-green-600" />
												<strong>{tr("Available Date:")}</strong>{" "}
												{new Date(service.availableDate).toLocaleDateString(
													"en-IN",
													{
														weekday: "short",
														year: "numeric",
														month: "short",
														day: "numeric",
													}
												)}
											</p>
										)}
										{service.availableTime && (
											<p className="flex items-center">
												<Clock className="h-4 w-4 mr-2 text-green-600" />
												<strong>{tr("Available Time:")}</strong>{" "}
												{service.availableTime}
												{service.workingDuration && (
													<span className="ml-2 text-gray-600">
														({tr("Duration:")} {service.workingDuration}{" "}
														{tr("hours")})
													</span>
												)}
											</p>
										)}
										{service.chargePerHour && (
											<p>
												<strong>{tr("Charge per Hour:")}</strong> ₹
												{service.chargePerHour}/hour
											</p>
										)}
									</div>

									{/* Action Buttons */}
									<div className="mt-4 pt-4 border-t border-gray-200">
										{!service.availability || service.isBooked ? (
											<div className="text-sm text-gray-500 italic">
												{tr("Cannot withdraw - Service is engaged")}
											</div>
										) : isSvcExpired(service) ? (
											<div className="text-sm text-gray-500 italic">
												{tr("Service expired - Past availability date/time")}
											</div>
										) : (
											<button
												onClick={() => handleWithdraw(service._id)}
												disabled={withdrawingId === service._id}
												className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm flex items-center justify-center"
											>
												{withdrawingId === service._id ? (
													<>
														<Activity className="h-4 w-4 mr-2 animate-spin" />
														{tr("Withdrawing...")}
													</>
												) : (
													<>
														<X className="h-4 w-4 mr-2" />
														{tr("Withdraw Service")}
													</>
												)}
											</button>
										)}
									</div>
								</div>
							))}
					</div>
					{/* Pagination */}
					{services.filter((s) => !isSvcExpired(s)).length > itemsPerPage && (
						<div className="flex justify-end items-center gap-2 mt-6">
							<button
								onClick={() => setPageServices(Math.max(0, pageServices - 1))}
								disabled={pageServices === 0}
								className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
							>
								{tr("Prev")}
							</button>
							<button
								onClick={() =>
									setPageServices(
										(pageServices + 1) %
											Math.ceil(
												services.filter((s) => !isSvcExpired(s)).length /
													itemsPerPage
											)
									)
								}
								disabled={
									pageServices >=
									Math.ceil(
										services.filter((s) => !isSvcExpired(s)).length /
											itemsPerPage
									) -
										1
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
	);
};

// ==================== PAYMENTS TAB (Keep your existing) ====================
const PaymentsTab = ({ dashboardData }) => {
	const { tr } = useLanguage();
	const itemsPerPage = 3;
	const [pagePendingPayments, setPagePendingPayments] = useState(0);
	const [pageCompletedPayments, setPageCompletedPayments] = useState(0);
	const pendingTx = (dashboardData?.transactions || []).filter(
		(t) => t.status === "pending"
	);
	const completedTx = (dashboardData?.transactions || []).filter(
		(t) => t.status === "completed"
	);
	const pendingBookings = dashboardData?.pendingPaymentBookings || [];
	const allPending = [...pendingTx, ...pendingBookings];

	// Calculate pending amounts from both sources
	const pendingTxAmount = pendingTx.reduce(
		(sum, t) => sum + (t.amount || 0),
		0
	);
	const pendingBookingsAmount = pendingBookings.reduce(
		(sum, b) => sum + (b.totalCost || 0),
		0
	);
	const totalPendingAmount =
		dashboardData?.stats?.pendingAmount ??
		pendingTxAmount + pendingBookingsAmount;
	const totalPendingCount =
		dashboardData?.stats?.pendingTransactions ??
		pendingTx.length + pendingBookings.length;

	const formatDate = (date) =>
		new Date(date).toLocaleString("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold text-gray-900">
				{tr("Payments & Earnings")}
			</h2>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="bg-white rounded-xl shadow-sm p-6">
					<p className="text-gray-600 text-sm mb-2">{tr("Total Earnings")}</p>
					<p className="text-3xl font-bold text-green-600">
						₹{dashboardData?.stats?.totalAmount?.toLocaleString() || 0}
					</p>
				</div>
				<div className="bg-white rounded-xl shadow-sm p-6">
					<p className="text-gray-600 text-sm mb-2">{tr("Pending Payments")}</p>
					<p className="text-3xl font-bold text-orange-600">
						₹{totalPendingAmount.toLocaleString()}
					</p>
					<p className="text-sm text-gray-600 mt-1">
						{totalPendingCount} {tr("pending")}
					</p>
				</div>
				<div className="bg-white rounded-xl shadow-sm p-6">
					<p className="text-gray-600 text-sm mb-2">
						{tr("Completed Payments")}
					</p>
					<p className="text-3xl font-bold text-gray-900">
						{dashboardData?.stats?.completedTransactions ?? completedTx.length}
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="bg-white rounded-xl shadow-sm p-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">
						{tr("Pending Transactions")}
					</h3>
					{allPending.length === 0 ? (
						<p className="text-gray-500">{tr("No pending transactions")}</p>
					) : (
						<>
							<div className="space-y-3">
								{allPending
									.slice(
										pagePendingPayments * itemsPerPage,
										pagePendingPayments * itemsPerPage + itemsPerPage
									)
									.map((item) => (
										<div
											key={item._id}
											className="border border-orange-200 rounded-lg p-3 bg-orange-50"
										>
											<div className="flex justify-between">
												<span className="text-sm font-medium text-gray-800">
													{item.bookingId?.workType || item.workType || "Work"}
												</span>
												<span className="text-sm font-semibold text-orange-700">
													₹{item.amount || item.totalCost}
												</span>
											</div>
											<div className="text-xs text-gray-600 mt-1">
												{formatDate(item.createdAt || item.updatedAt)}
											</div>
											{item.totalCost && (
												<div className="text-xs text-gray-600 mt-1">
													{tr("Completed, awaiting payment")}
												</div>
											)}
										</div>
									))}
							</div>
							{allPending.length > itemsPerPage && (
								<div className="flex justify-end items-center gap-2 mt-4">
									<button
										onClick={() =>
											setPagePendingPayments(
												Math.max(0, pagePendingPayments - 1)
											)
										}
										disabled={pagePendingPayments === 0}
										className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
									>
										{tr("Prev")}
									</button>
									<button
										onClick={() =>
											setPagePendingPayments(
												(pagePendingPayments + 1) %
													Math.ceil(allPending.length / itemsPerPage)
											)
										}
										disabled={
											pagePendingPayments >=
											Math.ceil(allPending.length / itemsPerPage) - 1
										}
										className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
									>
										{tr("Next")}
									</button>
								</div>
							)}
						</>
					)}
				</div>

				<div className="bg-white rounded-xl shadow-sm p-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">
						{tr("Recent Payments")}
					</h3>
					{completedTx.length === 0 ? (
						<p className="text-gray-500">{tr("No completed payments yet")}</p>
					) : (
						<>
							<div className="space-y-3">
								{completedTx
									.slice(
										pageCompletedPayments * itemsPerPage,
										pageCompletedPayments * itemsPerPage + itemsPerPage
									)
									.map((t) => (
										<div
											key={t._id}
											className="border border-gray-200 rounded-lg p-3 bg-gray-50"
										>
											<div className="flex justify-between">
												<span className="text-sm font-medium text-gray-800">
													{t.bookingId?.workType || "Work"}
												</span>
												<span className="text-sm font-semibold text-green-700">
													₹{t.amount}
												</span>
											</div>
											<div className="text-xs text-gray-600 mt-1">
												{formatDate(t.createdAt)}
											</div>
										</div>
									))}
							</div>
							{completedTx.length > itemsPerPage && (
								<div className="flex justify-end items-center gap-2 mt-4">
									<button
										onClick={() =>
											setPageCompletedPayments(
												Math.max(0, pageCompletedPayments - 1)
											)
										}
										disabled={pageCompletedPayments === 0}
										className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
									>
										{tr("Prev")}
									</button>
									<button
										onClick={() =>
											setPageCompletedPayments(
												(pageCompletedPayments + 1) %
													Math.ceil(completedTx.length / itemsPerPage)
											)
										}
										disabled={
											pageCompletedPayments >=
											Math.ceil(completedTx.length / itemsPerPage) - 1
										}
										className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
									>
										{tr("Next")}
									</button>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default TractorDashboard;
