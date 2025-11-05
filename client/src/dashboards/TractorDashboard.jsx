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
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useNotificationContext } from "../context/NotificationContext";
import api from "../config/api";
import LanguageSelector from "../components/LanguageSelector";
import DashboardNavbar from "../components/DashboardNavbar";
import DashboardFooter from "../components/DashboardFooter";
import { useLanguage } from "../context/LanguageContext";

const TractorDashboard = () => {
	const { user, logout } = useAuth();
	const { notifications, unreadCount } = useNotificationContext();
	const { tr } = useLanguage();

	useEffect(() => {
		toast.dismiss();
	}, []);

	// ==================== STATE MANAGEMENT ====================
	const [activeTab, setActiveTab] = useState("overview");
	const [myWorkSubTab, setMyWorkSubTab] = useState("accepted"); // NEW: subtab for My Work
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

// New service form
const [newService, setNewService] = useState({
	brand: "",
	model: "",
	vehicleNumber: "",
	typeOfPlowing: "",
	landType: "",
	chargePerAcre: "",
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

	// ==================== DATA FETCHING ====================
	const fetchAllData = useCallback(async () => {
		try {
			setRefreshing(true);
			const results = await Promise.allSettled([
				api.get("/tractors/my-services"),
api.get("/tractor-requirements", { params: { district: user?.address?.district, state: user?.address?.state } }),
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

// ==================== SERVICE POSTING ====================
const handleCreateService = async (e) => {
	e.preventDefault();
	try {
		// Build payload with explicit date and time and a combined ISO for backward-compat
		const combinedISO = newService.availableDate
			? new Date(`${newService.availableDate}T${newService.availableTime || "00:00"}`).toISOString()
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
					location: { district: "", state: "", village: "", pincode: "" },
					contactNumber: user?.phone || "",
					availability: true,
					availableDate: "",
					availableTime: "",
				});
			fetchAllData();
		} catch (error) {
			toast.error(error.message || "Failed to post service");
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
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
								<div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
								<p className="text-gray-600 text-lg">{tr("Loading your dashboard...")}</p>
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
					{ id: "requirements", label: tr("Available Work"), icon: Search, badge: stats.activeRequests },
					{ id: "mywork", label: tr("My Work"), icon: Briefcase, badge: stats.acceptedWork },
					{ id: "services", label: tr("My Services"), icon: Settings, badge: stats.totalServices },
					{ id: "payments", label: tr("Payments"), icon: IndianRupee },
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
					/>
				)}

				{activeTab === "mywork" && (
					<MyWorkTab
						myWork={myWork}
						activeSubTab={myWorkSubTab}
						setActiveSubTab={setMyWorkSubTab}
						onMarkComplete={handleMarkWorkComplete}
					/>
				)}

				{activeTab === "services" && (
					<ServicesTab
						services={myServices}
						onCancel={() => {}}
						onPostNew={() => setShowServiceForm(true)}
					/>
				)}

				{activeTab === "payments" && (
					<PaymentsTab dashboardData={dashboardData} />
				)}
			</main>

			{/* Dashboard Footer */}
			<DashboardFooter
				role="Tractor Owner"
				actions={[
					{ label: tr("Post Service"), onClick: () => setShowServiceForm(true), icon: Plus },
					{ label: tr("Available Work"), onClick: () => setActiveTab("requirements"), icon: Search },
					{ label: tr("Payments"), onClick: () => setActiveTab("payments"), icon: IndianRupee },
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
			</div>
		</div>
	);
};

// Continue with Part 2...
// ==================== MY WORK TAB (NEW) ====================
const MyWorkTab = ({ myWork, activeSubTab, setActiveSubTab, onMarkComplete }) => {
    const { tr } = useLanguage();

    const filteredWork = myWork.filter((work) => {
        if (activeSubTab === "accepted") return work.status === "confirmed";
        if (activeSubTab === "completed") return work.status === "completed";
        if (activeSubTab === "cancelled") return work.status === "cancelled";
        return false;
    });

    // Helper to format location gracefully
    const formatLocation = (loc) => {
        if (!loc) return "—";
        if (typeof loc === "string") return loc;
        if (loc.fullAddress && loc.fullAddress.trim()) return loc.fullAddress;
        const parts = [loc.village, loc.mandal, loc.district, loc.state, loc.pincode].filter(Boolean);
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
            <div className="flex gap-4 border-b">
                {[
                    { id: "accepted", label: tr("Accepted Work"), icon: CheckCircle },
                    { id: "completed", label: tr("Completed"), icon: Package },
                    { id: "cancelled", label: tr("Cancelled"), icon: XCircle },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`pb-3 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                            activeSubTab === tab.id
                                ? "border-green-500 text-green-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                            {
                                myWork.filter((w) => {
                                    if (tab.id === "accepted") return w.status === "confirmed";
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
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No {activeSubTab} work
                    </h3>
                    <p className="text-gray-600">
                        Your {activeSubTab} work will appear here
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredWork.map((work) => (
                        <div
                            key={work._id}
                            className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-green-500 transition-all p-6"
                        >
                            {/* Status Badge */}
                            <div className="flex justify-between items-start mb-4">
                                <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                        work.status === "confirmed"
                                            ? "bg-blue-100 text-blue-800"
                                            : work.status === "completed"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                    }`}
                                >
                                    {work.status === "confirmed" && <Clock className="h-3 w-3 mr-1" />}
                                    {work.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                                    {work.status === "cancelled" && <XCircle className="h-3 w-3 mr-1" />}
                                    {work.status.toUpperCase()}
                                </span>
                                <span className="text-2xl font-bold text-green-600">
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
                            <div className="flex gap-2">
                                {work.status === "confirmed" && (
                                    <>
                                        <a
                                            href={`tel:${work.farmer?.phone}`}
                                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm font-medium"
                                        >
                                            <Phone className="h-4 w-4" />
                                            <span>{tr("Call Farmer")}</span>
                                        </a>
                                        {new Date(work.bookingDate) <= new Date() && (
                                            <button
                                                onClick={() => onMarkComplete(work._id)}
                                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm font-medium"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                <span>{tr("Mark Complete")}</span>
                                            </button>
                                        )}
                                    </>
                                )}
                                {work.status === "completed" && work.paymentStatus === "pending" && (
                                    <div className="flex-1 bg-orange-50 border-2 border-orange-200 text-orange-800 px-4 py-2 rounded-lg text-center text-sm font-medium">
                                        ⏳ {tr("Awaiting Payment")}
                                    </div>
                                )}
                                {work.status === "completed" && work.paymentStatus === "paid" && (
                                    <div className="flex-1 bg-green-50 border-2 border-green-200 text-green-800 px-4 py-2 rounded-lg text-center text-sm font-medium">
                                        ✅ {tr("Payment Received")}
                                    </div>
                                )}
                            </div>

                            {/* Booking ID */}
                            <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                                {tr("Booking ID:")} {work._id.slice(-8).toUpperCase()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ==================== REQUIREMENTS TAB (UPDATED) ====================
const RequirementsTab = ({ requirements, searchTerm, setSearchTerm, filters, setFilters, onPlaceBid, myBids }) => {
    const { tr } = useLanguage();
    const hasBidOnRequirement = (reqId) => {
        return myBids.some((bid) => bid.requirementId?._id === reqId);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{tr("Available Work")}</h2>
                    <p className="text-gray-600 text-sm">
                        {requirements.length} {tr("requirements available")}
                    </p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder={tr("Search by work type or district...")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <select
                        value={filters.workType}
                        onChange={(e) => setFilters({ ...filters, workType: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                        onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                        <option value="">{tr("All Urgency")}</option>
                        <option value="normal">{tr("Normal")}</option>
                        <option value="urgent">{tr("Urgent")}</option>
                        <option value="very_urgent">{tr("Very Urgent")}</option>
                    </select>
                    <button
                        onClick={() => {
                            setSearchTerm("");
                            setFilters({ workType: "", district: "", urgency: "", status: "" });
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        {tr("Clear Filters")}
                    </button>
                </div>
            </div>

            {/* Requirements List */}
            {requirements.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{tr("No requirements found")}</h3>
                    <p className="text-gray-600">{tr("Check back later for new work opportunities")}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {requirements.map((req) => {
                        const bidPlaced = hasBidOnRequirement(req._id);
                        const bid = myBids.find((b) => b.requirementId?._id === req._id);

                        const isExpired = new Date(req.expectedDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
                        const isClosed = req.status && req.status !== "open";
                        return (
                            <div
                                key={req._id}
                                className="bg-white rounded-xl shadow-md border-2 border-gray-200 hover:border-green-500 transition-all p-6"
                            >
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">
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
                                                {req.urgency === "very_urgent" && <Zap className="h-3 w-3 mr-1" />}
                                                {req.urgency.replace("_", " ").toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
								<p className="text-sm text-gray-500">{tr("Budget")}</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            ₹{req.maxBudget}
                                        </p>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center text-gray-700">
                                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                        <span className="text-sm">
                                            {req.location?.village ? `${req.location.village}, ` : ""}
                                            {req.location?.district}, {req.location?.state}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-gray-700">
                                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                        <span className="text-sm">
                                            {tr("Expected:")}{" "}
                                            {new Date(req.expectedDate).toLocaleDateString("en-IN")}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-gray-700">
                                        <Package className="h-4 w-4 mr-2 text-gray-400" />
                                        <span className="text-sm">
                                            {req.landSize} {tr("acres")} • {req.landType} {tr("land")}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-gray-700">
                                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                        <span className="text-sm">{tr("Duration")}: {req.duration}</span>
                                    </div>
                                    {req.additionalNotes && (
                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-700">{req.additionalNotes}</p>
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
                                        {bid?.status === "accepted" && `✅ Bid Accepted — ₹${bid?.proposedAmount ?? bid?.bidAmount}`}
                                        {bid?.status === "rejected" && "❌ Bid Rejected"}
                                        {bid?.status === "pending" && `⏳ Bid Placed - Pending — ₹${bid?.proposedAmount ?? bid?.bidAmount}`}
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
            )}
        </div>
    );
};

// ==================== OTHER TABS (Keep your existing ones) ====================
const OverviewTab = ({ stats, dashboardData, notifications, setActiveTab }) => {
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
                    {notifications.slice(0, 5).map((notif) => (
                        <div key={notif._id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                                <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {new Date(notif.createdAt).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{tr("Quick Actions")}</h3>
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
                                <p className="font-semibold text-gray-900">{requirement.workType}</p>
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
                                    {new Date(requirement.expectedDate).toLocaleDateString("en-IN")}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Duration</p>
                                <p className="font-semibold text-gray-900">{requirement.duration}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Location</p>
                                <p className="font-semibold text-gray-900">
                                    {requirement.location?.district}, {requirement.location?.state}
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
                                onChange={(e) => setBidForm({ ...bidForm, message: e.target.value })}
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
                    <h2 className="text-2xl font-bold text-gray-900">Post New Tractor Service</h2>
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
                                    setNewService({ ...newService, vehicleNumber: e.target.value })
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
                                    setNewService({ ...newService, typeOfPlowing: e.target.value })
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
                                    setNewService({ ...newService, chargePerAcre: e.target.value })
                                }
                                placeholder="e.g., 1500"
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
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
                                        location: { ...newService.location, district: e.target.value },
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
                                        location: { ...newService.location, village: e.target.value },
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
                                        location: { ...newService.location, pincode: e.target.value },
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
                                    setNewService({ ...newService, contactNumber: e.target.value })
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
                                onChange={(e) => setNewService({ ...newService, availableDate: e.target.value })}
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
                                onChange={(e) => setNewService({ ...newService, availableTime: e.target.value })}
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
        if (svc.availability === false) return false; // engaged/unavailable handled separately
        const now = new Date();
        if (svc.availableDate) {
            const when = new Date(`${new Date(svc.availableDate).toISOString().slice(0,10)}T${(svc.availableTime||"00:00").padStart(5,"0")}`);
            if (!isNaN(when.getTime())) {
                return when < now;
            }
        }
        if (Array.isArray(svc.availableDates) && svc.availableDates.length > 0) {
            return svc.availableDates.every((d) => new Date(d) < now);
        }
        return false;
    } catch { return false; }
};

const ServicesTab = ({ services, onCancel, onPostNew }) => {
    const { tr } = useLanguage();
    return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">{tr("My Services")}</h2>
            <button
                onClick={onPostNew}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
                <Plus className="h-5 w-5" />
                <span>{tr("Add New Service")}</span>
            </button>
        </div>

        {services.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Tractor className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{tr("No services posted yet")}</h3>
                <p className="text-gray-600 mb-6">{tr("Post your first tractor service to get started")}</p>
                <button
                    onClick={onPostNew}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2"
                >
                    <Plus className="h-5 w-5" />
                    <span>{tr("Post Service")}</span>
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {services.filter((s)=>!isSvcExpired(s)).map((service) => (
                    <div
                        key={service._id}
                        className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {service.brand} {service.model}
                                </h3>
                                <p className="text-gray-600">{service.vehicleNumber}</p>
                            </div>
									<span
										className={`px-3 py-1 rounded-full text-xs font-semibold ${
											(!service.availability || service.isBooked)
												? "bg-blue-100 text-blue-800"
												: isSvcExpired(service)
												? "bg-gray-200 text-gray-700"
												: "bg-green-100 text-green-800"
										}`}
									>
										{(!service.availability || service.isBooked) ? tr("Engaged") : isSvcExpired(service) ? tr("Expired") : tr("Available")}
									</span>
                        </div>

                        <div className="space-y-2 text-sm text-gray-700">
                            <p>
                                <strong>{tr("Service:")}</strong> {service.typeOfPlowing}
                            </p>
                            <p>
                                <strong>{tr("Land Type:")}</strong> {service.landType}
                            </p>
                            <p>
                                <strong>{tr("Charge:")}</strong> ₹{service.chargePerAcre}/acre
                            </p>
                            <p>
                                <strong>{tr("Location:")}</strong> {service.location.district},{" "}
                                {service.location.state}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);
};

// ==================== PAYMENTS TAB (Keep your existing) ====================
const PaymentsTab = ({ dashboardData }) => { const { tr } = useLanguage(); return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">{tr("Payments & Earnings")}</h2>
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
                    ₹{dashboardData?.stats?.pendingAmount?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                    {dashboardData?.stats?.pendingTransactions || 0} {tr("pending")}
                </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-600 text-sm mb-2">{tr("Completed Payments")}</p>
                <p className="text-3xl font-bold text-gray-900">
                    {dashboardData?.stats?.completedTransactions ?? (dashboardData?.transactions?.filter((t) => t.status === "completed").length || 0)}
                </p>
            </div>
        </div>
    </div>
)};

export default TractorDashboard;
