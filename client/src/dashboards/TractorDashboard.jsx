import React, { useState, useEffect, useCallback } from "react";
import {
	Tractor,
	Calendar,
	MapPin,
	DollarSign,
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
	TrendingDown,
	Package,
	Activity,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useNotificationContext } from "../context/NotificationContext";
import api from "../config/api";

// =============================================
// 🚜 COMPLETE TRACTOR OWNER DASHBOARD
// With all integrations: Payments, Notifications, Accept/Reject, Real-time
// Green/White/Red theme for farmer-friendly UI
// =============================================

const TractorDashboard = () => {
	const { user, logout } = useAuth();
	const { notifications, unreadCount} = useNotificationContext();

	// ========================
	// STATE MANAGEMENT
	// ========================
	const [activeTab, setActiveTab] = useState("overview");
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	// Data states
	const [myServices, setMyServices] = useState([]);
	const [requirements, setRequirements] = useState([]);
	const [dashboardData, setDashboardData] = useState(null);
	const [stats, setStats] = useState({
		totalServices: 0,
		activeRequests: 0,
		totalEarnings: 0,
		pendingPayments: 0,
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

	// New service form
	const [newService, setNewService] = useState({
		brand: "",
		model: "",
		vehicleNumber: "",
		typeOfPlowing: "",
		landType: "",
		chargePerAcre: "",
		location: {
			district: "",
			state: "",
			village: "",
			pincode: "",
		},
		contactNumber: user?.phone || "",
		availability: true,
	});

	// Bid form
	const [bidForm, setBidForm] = useState({
		quotedPrice: "",
		notes: "",
		estimatedDuration: "1",
	});

	// ========================
	// DATA FETCHING
	// ========================

	const fetchAllData = useCallback(async () => {
		try {
			setRefreshing(true);

			const [servicesRes, requirementsRes, dashboardRes] = await Promise.all([
				api.get("/tractors/my-services"),
				api.get("/tractor-requirements"),
				api.get("/transactions/dashboard"),
			]);

			setMyServices(servicesRes.data.tractorServices || []);
			setRequirements(requirementsRes.data.tractorRequirements || []);
			setDashboardData(dashboardRes.data);

			// Calculate stats
			setStats({
				totalServices: servicesRes.data.tractorServices?.length || 0,
				activeRequests:
					requirementsRes.data.tractorRequirements?.filter(
						(r) => r.status === "open"
					).length || 0,
				totalEarnings: dashboardRes.data.stats?.totalAmount || 0,
				pendingPayments: dashboardRes.data.stats?.pendingAmount || 0,
			});

			toast.success("Dashboard refreshed!");
		} catch (error) {
			console.error("Error fetching data:", error);
			toast.error(error.message || "Failed to load dashboard data");
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	useEffect(() => {
		fetchAllData();
	}, [fetchAllData]);

	// ========================
	// SERVICE POSTING
	// ========================

	const handleCreateService = async (e) => {
		e.preventDefault();
		try {
			const response = await api.post("/tractors", newService);
			toast.success(
				`Service posted! ${
					response.data.notifiedFarmers || 0
				} nearby farmers notified 🚜`
			);
			setShowServiceForm(false);
			setNewService({
				brand: "",
				model: "",
				vehicleNumber: "",
				typeOfPlowing: "",
				landType: "",
				chargePerAcre: "",
				location: { district: "", state: "", village: "", pincode: "" },
				contactNumber: user?.phone || "",
				availability: true,
			});
			fetchAllData();
		} catch (error) {
			toast.error(error.message || "Failed to post service");
		}
	};

	const handleCancelService = async (serviceId) => {
		if (!window.confirm("Are you sure you want to cancel this service?"))
			return;

		try {
			await api.post(`/tractors/${serviceId}/cancel`);
			toast.success("Service cancelled successfully");
			fetchAllData();
		} catch (error) {
			toast.error(error.message || "Failed to cancel service");
		}
	};

	// ========================
	// REQUIREMENT HANDLING
	// ========================

	const handlePlaceBid = async (requirementId) => {
		try {
			await api.post(`/tractor-requirements/${requirementId}/respond`, {
				quotedPrice: parseFloat(bidForm.quotedPrice),
				notes: bidForm.notes,
				estimatedDuration: `${bidForm.estimatedDuration} day(s)`,
			});

			toast.success("Bid placed successfully! Farmer will be notified 📋");
			setShowBidModal(null);
			setBidForm({ quotedPrice: "", notes: "", estimatedDuration: "1" });
			fetchAllData();
		} catch (error) {
			toast.error(error.message || "Failed to place bid");
		}
	};

	const handleAcceptRequirement = async (requirementId) => {
		// Show loading toast
		const loadingToast = toast.loading("Accepting requirement...");

		try {
			const { data } = await api.post(
				`/tractor-requirements/${requirementId}/accept`
			);

			const { booking, requirement } = data;

			// Dismiss loading toast
			toast.dismiss(loadingToast);

			// Show success with booking details
			toast.success(
				(t) => (
					<div>
						<div className="font-bold">🎉 Booking Confirmed!</div>
						<div className="text-sm mt-1">
							<div>
								Date: {new Date(booking.bookingDate).toLocaleDateString()}
							</div>
							<div>Amount: ₹{booking.totalCost}</div>
							<div>Farmer: {requirement.farmer?.name}</div>
						</div>
						<button
							onClick={() => {
								toast.dismiss(t.id);
								setActiveTab("payments"); // Navigate to payments tab
							}}
							className="mt-2 text-xs bg-green-100 hover:bg-green-200 px-2 py-1 rounded"
						>
							View in Payments →
						</button>
					</div>
				),
				{ duration: 8000 }
			);

			// Update stats optimistically
			setStats((prev) => ({
				...prev,
				activeRequests: prev.activeRequests + 1,
			}));

			// Refresh data in background
			await fetchAllData();
		} catch (error) {
			// Dismiss loading toast
			toast.dismiss(loadingToast);

			// Show error
			const errorMsg =
				error.response?.data?.message ||
				error.message ||
				"Failed to accept requirement";
			toast.error(errorMsg, { duration: 4000 });

			console.error("Accept error:", error);
		}
	};


	const handleCompleteWork = async (requirementId) => {
		if (
			!window.confirm(
				"Mark this work as completed? Farmer will be able to make payment."
			)
		)
			return;

		try {
			await api.post(`/tractor-requirements/${requirementId}/complete`);
			toast.success("Work marked as completed! Farmer can now pay ✅");
			fetchAllData();
		} catch (error) {
			toast.error(error.message || "Failed to complete work");
		}
	};

	// ========================
	// FILTERING
	// ========================

	const filteredRequirements = requirements.filter((req) => {
		const matchesSearch =
			searchTerm === "" ||
			req.workType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			req.location?.district
				?.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			req.farmer?.name?.toLowerCase().includes(searchTerm.toLowerCase());

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

	// ========================
	// RENDER COMPONENTS
	// ========================

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
					<p className="text-gray-600 text-lg">Loading your dashboard...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Toaster position="top-right" />

			{/* ===== HEADER ===== */}
			<header className="bg-white shadow-sm border-b sticky top-0 z-40">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						<div className="flex items-center space-x-4">
							<div className="bg-gradient-to-br from-green-500 to-green-700 p-3 rounded-xl shadow-lg">
								<Tractor className="h-8 w-8 text-white" />
							</div>
							<div>
								<h1 className="text-2xl font-bold text-gray-900">
									Tractor Owner Dashboard
								</h1>
								<p className="text-sm text-gray-600">
									Welcome back,{" "}
									<span className="font-semibold">{user?.name}</span>
								</p>
							</div>
						</div>

						<div className="flex items-center space-x-4">
							<button
								onClick={fetchAllData}
								disabled={refreshing}
								className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
								title="Refresh data"
							>
								<Activity
									className={`h-5 w-5 text-gray-600 ${
										refreshing ? "animate-spin" : ""
									}`}
								/>
							</button>

							<button
								onClick={() => setShowServiceForm(true)}
								className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 shadow-md transition-all transform hover:scale-105"
							>
								<Plus className="h-5 w-5" />
								<span className="hidden sm:inline">Post Service</span>
							</button>

							<div className="relative">
								<Bell className="h-6 w-6 text-gray-600 cursor-pointer hover:text-green-600" />
								{unreadCount > 0 && (
									<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
										{unreadCount}
									</span>
								)}
							</div>

							<button
								onClick={logout}
								className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
								title="Logout"
							>
								<LogOut className="h-5 w-5" />
							</button>
						</div>
					</div>
				</div>
			</header>

			{/* ===== NAVIGATION TABS ===== */}
			<nav className="bg-white border-b sticky top-[73px] z-30">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex space-x-8 overflow-x-auto">
						{[
							{ id: "overview", label: "Overview", icon: TrendingUp },
							{
								id: "requirements",
								label: "Available Work",
								icon: Search,
								badge: stats.activeRequests,
							},
							{
								id: "services",
								label: "My Services",
								icon: Settings,
								badge: stats.totalServices,
							},
							{ id: "payments", label: "Payments", icon: DollarSign },
						].map((tab) => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap transition-colors ${
									activeTab === tab.id
										? "border-green-500 text-green-600"
										: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
								}`}
							>
								<tab.icon className="h-4 w-4" />
								<span>{tab.label}</span>
								{tab.badge > 0 && (
									<span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
										{tab.badge}
									</span>
								)}
							</button>
						))}
					</div>
				</div>
			</nav>

			{/* ===== MAIN CONTENT ===== */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{activeTab === "overview" && (
					<OverviewTab
						stats={stats}
						dashboardData={dashboardData}
						notifications={notifications}
						setActiveTab={setActiveTab}
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
						onAccept={handleAcceptRequirement}
						onComplete={handleCompleteWork}
						userId={user?._id}
					/>
				)}
				{activeTab === "services" && (
					<ServicesTab
						services={myServices}
						onCancel={handleCancelService}
						onPostNew={() => setShowServiceForm(true)}
					/>
				)}
				{activeTab === "payments" && (
					<PaymentsTab dashboardData={dashboardData} />
				)}
			</main>

			{/* ===== MODALS ===== */}
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
		</div>
	);
};

// =============================================
// TAB COMPONENTS
// =============================================

const OverviewTab = ({ stats, dashboardData, notifications, setActiveTab }) => (
	<div className="space-y-6">
		{/* Stats Grid */}
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			<StatCard
				icon={Tractor}
				label="Active Services"
				value={stats.totalServices}
				color="green"
			/>
			<StatCard
				icon={Package}
				label="Available Work"
				value={stats.activeRequests}
				color="blue"
			/>
			<StatCard
				icon={DollarSign}
				label="Total Earnings"
				value={`₹${stats.totalEarnings.toLocaleString()}`}
				color="green"
			/>
			<StatCard
				icon={AlertCircle}
				label="Pending Payments"
				value={`₹${stats.pendingPayments.toLocaleString()}`}
				color="orange"
			/>
		</div>

		{/* Recent Activity Grid */}
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
			{/* Recent Notifications */}
			<div className="bg-white rounded-xl shadow-md overflow-hidden">
				<div className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-white">
					<h3 className="text-lg font-semibold text-gray-900 flex items-center">
						<Bell className="h-5 w-5 text-green-600 mr-2" />
						Recent Notifications
					</h3>
				</div>
				<div className="divide-y max-h-96 overflow-y-auto">
					{notifications.slice(0, 5).map((notif, idx) => (
						<div
							key={idx}
							className="px-6 py-4 hover:bg-gray-50 transition-colors"
						>
							<div className="flex items-start">
								<div
									className={`w-2 h-2 rounded-full mt-2 mr-3 ${
										notif.read ? "bg-gray-300" : "bg-green-500 animate-pulse"
									}`}
								></div>
								<div className="flex-1">
									<p className="text-sm font-medium text-gray-900">
										{notif.title}
									</p>
									<p className="text-sm text-gray-600 mt-1">{notif.message}</p>
									<p className="text-xs text-gray-400 mt-2">
										{new Date(notif.createdAt).toLocaleString()}
									</p>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Quick Actions */}
			<div className="bg-white rounded-xl shadow-md overflow-hidden">
				<div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-white">
					<h3 className="text-lg font-semibold text-gray-900 flex items-center">
						<Zap className="h-5 w-5 text-blue-600 mr-2" />
						Quick Actions
					</h3>
				</div>
				<div className="p-6 space-y-3">
					<QuickActionButton
						icon={Search}
						label="Browse Work Requests"
						onClick={() => setActiveTab("requirements")}
						color="blue"
					/>
					<QuickActionButton
						icon={Plus}
						label="Post New Service"
						onClick={() => {}}
						color="green"
					/>
					<QuickActionButton
						icon={DollarSign}
						label="View Payment History"
						onClick={() => setActiveTab("payments")}
						color="purple"
					/>
				</div>
			</div>
		</div>

		{/* Recent Transactions */}
		{dashboardData?.transactions?.length > 0 && (
			<div className="bg-white rounded-xl shadow-md overflow-hidden">
				<div className="px-6 py-4 border-b">
					<h3 className="text-lg font-semibold text-gray-900">
						Recent Transactions
					</h3>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Date
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Farmer
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Work Type
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Amount
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Status
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{dashboardData.transactions.slice(0, 5).map((txn) => (
								<tr key={txn._id} className="hover:bg-gray-50">
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{new Date(txn.createdAt).toLocaleDateString()}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{txn.farmerId?.name}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
										{txn.bookingId?.workType}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
										₹{txn.amount.toLocaleString()}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<StatusBadge status={txn.status} />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		)}
	</div>
);

const RequirementsTab = ({
	requirements,
	searchTerm,
	setSearchTerm,
	filters,
	setFilters,
	onPlaceBid,
	onAccept,
	onComplete,
	userId,
}) => (
	<div className="space-y-6">
		{/* Search and Filters */}
		<div className="bg-white rounded-xl shadow-md p-6">
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
					<input
						type="text"
						placeholder="Search requirements..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
					/>
				</div>
				<select
					value={filters.workType}
					onChange={(e) => setFilters({ ...filters, workType: e.target.value })}
					className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
				>
					<option value="">All Work Types</option>
					<option value="Plowing">Plowing</option>
					<option value="Harvesting">Harvesting</option>
					<option value="Spraying">Spraying</option>
					<option value="Hauling">Hauling</option>
				</select>
				<input
					type="text"
					placeholder="Filter by district"
					value={filters.district}
					onChange={(e) => setFilters({ ...filters, district: e.target.value })}
					className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
				/>
				<select
					value={filters.urgency}
					onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
					className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
				>
					<option value="">All Urgency</option>
					<option value="urgent">Urgent</option>
					<option value="normal">Normal</option>
					<option value="flexible">Flexible</option>
				</select>
			</div>
		</div>

		{/* Requirements Grid */}
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
			{requirements.map((req) => (
				<RequirementCard
					key={req._id}
					requirement={req}
					onPlaceBid={onPlaceBid}
					onAccept={onAccept}
					onComplete={onComplete}
					userId={userId}
				/>
			))}
		</div>

		{requirements.length === 0 && (
			<div className="bg-white rounded-xl shadow-md p-12 text-center">
				<Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
				<h3 className="text-xl font-semibold text-gray-900 mb-2">
					No Requirements Found
				</h3>
				<p className="text-gray-500">
					{searchTerm || Object.values(filters).some((f) => f)
						? "Try adjusting your search or filters"
						: "No farmer requests available at the moment"}
				</p>
			</div>
		)}
	</div>
);

const ServicesTab = ({ services, onCancel, onPostNew }) => (
	<div className="space-y-6">
		<div className="bg-white rounded-xl shadow-md overflow-hidden">
			<div className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-white flex justify-between items-center">
				<h3 className="text-lg font-semibold text-gray-900">My Services</h3>
				<button
					onClick={onPostNew}
					className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 shadow-md transition-all"
				>
					<Plus className="h-4 w-4" />
					<span>Add Service</span>
				</button>
			</div>
			<div className="divide-y">
				{services.map((service) => (
					<ServiceCard
						key={service._id}
						service={service}
						onCancel={onCancel}
					/>
				))}
			</div>
		</div>
	</div>
);

const PaymentsTab = ({ dashboardData }) => (
	<div className="space-y-6">
		<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-green-100 text-sm mb-1">Total Earnings</p>
						<p className="text-3xl font-bold">
							₹{dashboardData?.stats?.totalAmount?.toLocaleString() || 0}
						</p>
					</div>
					<DollarSign className="h-12 w-12 text-green-200" />
				</div>
			</div>
			<div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-orange-100 text-sm mb-1">Pending</p>
						<p className="text-3xl font-bold">
							₹{dashboardData?.stats?.pendingAmount?.toLocaleString() || 0}
						</p>
					</div>
					<Clock className="h-12 w-12 text-orange-200" />
				</div>
			</div>
			<div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-blue-100 text-sm mb-1">Completed</p>
						<p className="text-3xl font-bold">
							{dashboardData?.stats?.completedTransactions || 0}
						</p>
					</div>
					<CheckCircle className="h-12 w-12 text-blue-200" />
				</div>
			</div>
		</div>

		<div className="bg-white rounded-xl shadow-md overflow-hidden">
			<div className="px-6 py-4 border-b">
				<h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
			</div>
			<div className="divide-y">
				{dashboardData?.transactions?.map((txn) => (
					<div key={txn._id} className="px-6 py-4 hover:bg-gray-50">
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<div className="flex items-center space-x-3">
									<div
										className={`w-10 h-10 rounded-full flex items-center justify-center ${
											txn.status === "completed"
												? "bg-green-100"
												: txn.status === "pending"
												? "bg-yellow-100"
												: "bg-red-100"
										}`}
									>
										<DollarSign
											className={`h-5 w-5 ${
												txn.status === "completed"
													? "text-green-600"
													: txn.status === "pending"
													? "text-yellow-600"
													: "text-red-600"
											}`}
										/>
									</div>
									<div>
										<h4 className="text-sm font-semibold text-gray-900">
											₹{txn.amount.toLocaleString()}
										</h4>
										<p className="text-sm text-gray-500">
											{txn.method} • {txn.farmerId?.name}
										</p>
									</div>
								</div>
							</div>
							<div className="text-right">
								<StatusBadge status={txn.status} />
								<p className="text-xs text-gray-400 mt-1">
									{new Date(txn.createdAt).toLocaleDateString()}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	</div>
);

// =============================================
// CARD COMPONENTS
// =============================================

const StatCard = ({  label, value, color }) => {
	const colors = {
		green: "from-green-500 to-green-600 text-green-200",
		blue: "from-blue-500 to-blue-600 text-blue-200",
		orange: "from-orange-500 to-orange-600 text-orange-200",
		purple: "from-purple-500 to-purple-600 text-purple-200",
	};

	return (
		<div
			className={`bg-gradient-to-br ${colors[color]} rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform`}
		>
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm opacity-90 mb-1">{label}</p>
					<p className="text-3xl font-bold">{value}</p>
				</div>
				
			</div>
		</div>
	);
};

const RequirementCard = ({
	requirement,
	onPlaceBid,
	onAccept,
	onComplete,
	userId,
}) => {
	const myResponse = requirement.responses?.find(
		(r) => r.tractorOwner?._id === userId || r.tractorOwner === userId
	);
	const canAccept = myResponse && requirement.status === "open";
	const canComplete =
		requirement.status === "in_progress" &&
		requirement.acceptedResponse?.tractorOwner === userId;

	return (
		<div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6">
			<div className="flex justify-between items-start mb-4">
				<div className="flex items-center space-x-3">
					<div className="bg-blue-100 p-3 rounded-lg">
						<User className="h-6 w-6 text-blue-600" />
					</div>
					<div>
						<h4 className="text-lg font-semibold text-gray-900">
							{requirement.workType}
						</h4>
						<p className="text-sm text-gray-500">{requirement.farmer?.name}</p>
					</div>
				</div>
				<UrgencyBadge urgency={requirement.urgency} />
			</div>

			<div className="space-y-2 mb-4">
				<div className="flex items-center text-sm text-gray-600">
					<MapPin className="h-4 w-4 mr-2 text-gray-400" />
					<span>
						{requirement.location?.district}, {requirement.location?.state}
					</span>
				</div>
				<div className="flex items-center text-sm text-gray-600">
					<Calendar className="h-4 w-4 mr-2 text-gray-400" />
					<span>
						Expected: {new Date(requirement.expectedDate).toLocaleDateString()}
					</span>
				</div>
				<div className="flex items-center text-sm text-gray-600">
					<DollarSign className="h-4 w-4 mr-2 text-gray-400" />
					<span>Budget: Up to ₹{requirement.maxBudget}/acre</span>
				</div>
				<div className="flex items-center text-sm text-gray-600">
					<Package className="h-4 w-4 mr-2 text-gray-400" />
					<span>
						{requirement.landSize} acres • {requirement.landType}
					</span>
				</div>
			</div>

			{requirement.additionalNotes && (
				<div className="mb-4 p-3 bg-gray-50 rounded-lg">
					<p className="text-sm text-gray-700">{requirement.additionalNotes}</p>
				</div>
			)}

			{myResponse && (
				<div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
					<p className="text-sm font-medium text-blue-900">Your Bid:</p>
					<p className="text-sm text-blue-700">
						₹{myResponse.quotedPrice}/acre • {myResponse.notes}
					</p>
				</div>
			)}

			<div className="flex space-x-2">
				{requirement.status === "open" && !myResponse && (
					<button
						onClick={() => onPlaceBid(requirement)}
						className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
					>
						Place Bid
					</button>
				)}
				{canAccept && (
					<button
						onClick={() => onAccept(requirement._id)}
						className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
					>
						Accept Work
					</button>
				)}
				{canComplete && (
					<button
						onClick={() => onComplete(requirement._id)}
						className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
					>
						Mark Completed
					</button>
				)}
				{requirement.farmer?.phone && (
					<button className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors">
						<Phone className="h-4 w-4" />
					</button>
				)}
			</div>
		</div>
	);
};

const ServiceCard = ({ service, onCancel }) => (
	<div className="px-6 py-6 hover:bg-gray-50 transition-colors">
		<div className="flex items-center justify-between">
			<div className="flex-1">
				<div className="flex items-center space-x-3">
					<div className="bg-green-100 p-3 rounded-lg">
						<Tractor className="h-6 w-6 text-green-600" />
					</div>
					<div>
						<h4 className="text-lg font-semibold text-gray-900">
							{service.brand} {service.model}
						</h4>
						<p className="text-sm text-gray-500">
							{service.vehicleNumber} • {service.typeOfPlowing}
						</p>
					</div>
				</div>
				<div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
					<div>
						<span className="font-medium text-gray-500">Rate:</span>
						<span className="ml-2 text-gray-900 font-semibold">
							₹{service.chargePerAcre}/acre
						</span>
					</div>
					<div>
						<span className="font-medium text-gray-500">Land Type:</span>
						<span className="ml-2 text-gray-900">{service.landType}</span>
					</div>
					<div>
						<span className="font-medium text-gray-500">Location:</span>
						<span className="ml-2 text-gray-900">
							{service.location?.district}
						</span>
					</div>
				</div>
			</div>
			<div className="flex items-center space-x-2">
				<span
					className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
						service.availability && service.status !== "cancelled"
							? "bg-green-100 text-green-800"
							: "bg-red-100 text-red-800"
					}`}
				>
					{service.availability && service.status !== "cancelled"
						? "Available"
						: "Cancelled"}
				</span>
				{service.availability && service.status !== "cancelled" && (
					<button
						onClick={() => onCancel(service._id)}
						className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
					>
						<XCircle className="h-5 w-5" />
					</button>
				)}
			</div>
		</div>
	</div>
);

// =============================================
// MODAL COMPONENTS
// =============================================

const ServiceFormModal = ({ newService, setNewService, onSubmit, onClose }) => (
	<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
			<div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center rounded-t-2xl">
				<h3 className="text-xl font-bold text-gray-900">Post New Service</h3>
				<button
					onClick={onClose}
					className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
				>
					<X className="h-6 w-6" />
				</button>
			</div>
			<form onSubmit={onSubmit} className="p-6 space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormInput
						label="Brand *"
						value={newService.brand}
						onChange={(e) =>
							setNewService({ ...newService, brand: e.target.value })
						}
						required
					/>
					<FormInput
						label="Model *"
						value={newService.model}
						onChange={(e) =>
							setNewService({ ...newService, model: e.target.value })
						}
						required
					/>
					<FormInput
						label="Vehicle Number *"
						value={newService.vehicleNumber}
						onChange={(e) =>
							setNewService({ ...newService, vehicleNumber: e.target.value })
						}
						required
					/>
					<FormSelect
						label="Service Type *"
						value={newService.typeOfPlowing}
						onChange={(e) =>
							setNewService({ ...newService, typeOfPlowing: e.target.value })
						}
						options={[
							"Plowing",
							"Harvesting",
							"Spraying",
							"Hauling",
							"Land Preparation",
						]}
						required
					/>
					<FormSelect
						label="Land Type *"
						value={newService.landType}
						onChange={(e) =>
							setNewService({ ...newService, landType: e.target.value })
						}
						options={["Dry", "Wet", "Hilly", "Plain"]}
						required
					/>
					<FormInput
						label="Charge per Acre (₹) *"
						type="number"
						value={newService.chargePerAcre}
						onChange={(e) =>
							setNewService({ ...newService, chargePerAcre: e.target.value })
						}
						required
						min="0"
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormInput
						label="District *"
						value={newService.location.district}
						onChange={(e) =>
							setNewService({
								...newService,
								location: { ...newService.location, district: e.target.value },
							})
						}
						required
					/>
					<FormInput
						label="State *"
						value={newService.location.state}
						onChange={(e) =>
							setNewService({
								...newService,
								location: { ...newService.location, state: e.target.value },
							})
						}
						required
					/>
				</div>

				<FormInput
					label="Contact Number *"
					type="tel"
					value={newService.contactNumber}
					onChange={(e) =>
						setNewService({ ...newService, contactNumber: e.target.value })
					}
					required
				/>

				<div className="flex justify-end space-x-4 pt-4">
					<button
						type="button"
						onClick={onClose}
						className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg shadow-md transition-all"
					>
						Post Service
					</button>
				</div>
			</form>
		</div>
	</div>
);

const BidModal = ({ requirement, bidForm, setBidForm, onSubmit, onClose }) => (
	<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
			<div className="px-6 py-4 border-b flex justify-between items-center">
				<h3 className="text-xl font-bold text-gray-900">Place Your Bid</h3>
				<button
					onClick={onClose}
					className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg"
				>
					<X className="h-6 w-6" />
				</button>
			</div>
			<div className="p-6 space-y-6">
				<div className="bg-blue-50 rounded-lg p-4">
					<h4 className="font-semibold text-blue-900 mb-2">
						{requirement.workType}
					</h4>
					<div className="space-y-1 text-sm text-blue-700">
						<p>Land Size: {requirement.landSize} acres</p>
						<p>Budget: Up to ₹{requirement.maxBudget}/acre</p>
						<p>
							Location: {requirement.location?.district},{" "}
							{requirement.location?.state}
						</p>
					</div>
				</div>

				<FormInput
					label="Your Quote (₹ per acre) *"
					type="number"
					value={bidForm.quotedPrice}
					onChange={(e) =>
						setBidForm({ ...bidForm, quotedPrice: e.target.value })
					}
					placeholder={`Max budget: ₹${requirement.maxBudget}`}
					required
					min="0"
					max={requirement.maxBudget}
				/>

				<FormInput
					label="Estimated Duration (days)"
					type="number"
					value={bidForm.estimatedDuration}
					onChange={(e) =>
						setBidForm({ ...bidForm, estimatedDuration: e.target.value })
					}
					required
					min="1"
				/>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Additional Notes
					</label>
					<textarea
						rows={3}
						value={bidForm.notes}
						onChange={(e) => setBidForm({ ...bidForm, notes: e.target.value })}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Any additional information for the farmer..."
					/>
				</div>

				<div className="flex space-x-3 pt-4">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={onSubmit}
						className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-lg font-medium shadow-md transition-all"
					>
						Submit Bid
					</button>
				</div>
			</div>
		</div>
	</div>
);

// =============================================
// UTILITY COMPONENTS
// =============================================

const StatusBadge = ({ status }) => {
	const colors = {
		completed: "bg-green-100 text-green-800",
		pending: "bg-yellow-100 text-yellow-800",
		failed: "bg-red-100 text-red-800",
	};

	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
				colors[status] || "bg-gray-100 text-gray-800"
			}`}
		>
			{status}
		</span>
	);
};

const UrgencyBadge = ({ urgency }) => {
	const colors = {
		urgent: "bg-red-100 text-red-800 animate-pulse",
		normal: "bg-yellow-100 text-yellow-800",
		flexible: "bg-green-100 text-green-800",
	};

	return (
		<span
			className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${
				colors[urgency] || "bg-gray-100 text-gray-800"
			}`}
		>
			{urgency}
		</span>
	);
};

const QuickActionButton = ({  label, onClick, color }) => {
	const colors = {
		blue: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
		green:
			"from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
		purple:
			"from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
	};

	return (
		<button
			onClick={onClick}
			className={`w-full bg-gradient-to-r ${colors[color]} text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-3 shadow-md transition-all transform hover:scale-105`}
		>
			
			<span className="font-medium">{label}</span>
			<ChevronRight className="h-5 w-5" />
		</button>
	);
};

const FormInput = ({ label, ...props }) => (
	<div>
		<label className="block text-sm font-medium text-gray-700 mb-2">
			{label}
		</label>
		<input
			className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
			{...props}
		/>
	</div>
);

const FormSelect = ({ label, options, ...props }) => (
	<div>
		<label className="block text-sm font-medium text-gray-700 mb-2">
			{label}
		</label>
		<select
			className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
			{...props}
		>
			<option value="">Select {label.replace(" *", "")}</option>
			{options.map((opt) => (
				<option key={opt} value={opt}>
					{opt}
				</option>
			))}
		</select>
	</div>
);

export default TractorDashboard;
