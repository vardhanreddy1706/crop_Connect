import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../config/api";
import {
	Calendar,
	Clock,
	MapPin,
	User,
	Tractor,
	Users,
	Filter,
	Search,
	CheckCircle,
	XCircle,
	AlertCircle,
	ChevronDown,
	Phone,
	Mail,
	IndianRupee,
	ArrowLeft,
} from "lucide-react";

function FarmerBookings() {
	const { user, authLoading } = useAuth();
	const navigate = useNavigate();
	const [bookings, setBookings] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [activeTab, setActiveTab] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	// pagination
	const [page, setPage] = useState(0);
	const pageSize = 5;

	useEffect(() => {
		if (authLoading || !user) return;
		fetchBookings();
		const id = setInterval(fetchBookings, 30000);
		return () => clearInterval(id);
	}, [authLoading, user]);

	const fetchBookings = async () => {
		try {
			setLoading(true);
			setError(null);

			const [
				tractorBookingsRes,
				workerBookingsRes,
				tractorRequirementsRes,
				workerRequirementsRes,
			] = await Promise.allSettled([
				api.get("/bookings/farmer/tractors"),
				api.get("/bookings/farmer/workers"),
				api.get("/bookings/farmer/tractor-requirements"),
				api.get("/bookings/farmer/worker-requirements"),
			]);

			// ✅ Format bookings with proper string conversion
			const tractorBookings =
				tractorBookingsRes.status === "fulfilled"
					? (tractorBookingsRes.value?.data?.bookings || []).map((booking) => ({
							...booking,
							type: "tractor",
							category: "booking",
							location: formatLocation(booking.location), // ✅ Convert to string
							notes: booking.notes || "N/A", // ✅ Ensure string
							serviceProvider: booking.serviceProvider || {
								name: "N/A",
								phone: "",
							},
					  }))
					: [];

			const workerBookings =
				workerBookingsRes.status === "fulfilled"
					? (workerBookingsRes.value?.data?.bookings || []).map((booking) => ({
							...booking,
							type: "worker",
							category: "booking",
							location: formatLocation(booking.location), // ✅ Convert to string
							notes: booking.notes || "N/A", // ✅ Ensure string
							serviceProvider: booking.serviceProvider || {
								name: "N/A",
								phone: "",
							},
					  }))
					: [];

			// ✅ Format requirements with proper string conversion
			const tractorRequirements =
				tractorRequirementsRes.status === "fulfilled"
					? (tractorRequirementsRes.value?.data?.requirements || []).map(
							(req) => ({
								...req,
								type: "tractor",
								category: "requirement",
								totalCost: req.maxBudget || 0,
								bookingDate: req.expectedDate,
								location: formatLocation(req.location), // ✅ Convert to string
								notes: req.additionalNotes || "No notes", // ✅ Ensure string
								serviceProvider: {
									name: req.acceptedBy?.name || "Pending Responses",
									phone: req.acceptedBy?.phone || "",
								},
							})
					  )
					: [];

			const workerRequirements =
				workerRequirementsRes.status === "fulfilled"
					? (workerRequirementsRes.value?.data?.requirements || []).map(
							(req) => ({
								...req,
								type: "worker",
								category: "requirement",
								totalCost: req.wagesOffered || 0,
								bookingDate: req.startDate,
								location: formatLocation(req.location), // ✅ Convert to string
								notes: req.additionalInfo || "No notes", // ✅ Ensure string
								serviceProvider: {
									name: req.acceptedBy?.name || "Pending Applicants",
									phone: req.acceptedBy?.phone || "",
								},
							})
					  )
					: [];

			// Combine all data
			const allData = [
				...tractorBookings,
				...workerBookings,
				...tractorRequirements,
				...workerRequirements,
			].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

			setBookings(allData);
		} catch (err) {
			console.error("Fetch bookings error:", err);
			setError(err.response?.data?.message || "Failed to load bookings");
		} finally {
			setLoading(false);
		}
	};

	// ✅ Helper function to format location object to string
	const formatLocation = (location) => {
		if (!location) return "Location not specified";

		if (typeof location === "string") return location;

		const parts = [location.village, location.district, location.state].filter(
			Boolean
		);

		return parts.length > 0 ? parts.join(", ") : "Location not specified";
	};

	const getStatusColor = (status) => {
		const colors = {
			pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
			confirmed: "bg-blue-100 text-blue-800 border-blue-200",
			completed: "bg-green-100 text-green-800 border-green-200",
			cancelled: "bg-red-100 text-red-800 border-red-200",
			open: "bg-blue-100 text-blue-800 border-blue-200",
			in_progress: "bg-purple-100 text-purple-800 border-purple-200",
		};
		return (
			colors[status?.toLowerCase()] ||
			"bg-gray-100 text-gray-800 border-gray-200"
		);
	};

	const getStatusIcon = (status) => {
		const icons = {
			pending: <AlertCircle className="w-4 h-4" />,
			confirmed: <CheckCircle className="w-4 h-4" />,
			completed: <CheckCircle className="w-4 h-4" />,
			cancelled: <XCircle className="w-4 h-4" />,
			open: <Clock className="w-4 h-4" />,
			in_progress: <Clock className="w-4 h-4" />,
		};
		return icons[status?.toLowerCase()] || <AlertCircle className="w-4 h-4" />;
	};

	// Filter bookings
	const filteredBookings = bookings.filter((booking) => {
		const matchesTab = activeTab === "all" || booking.type === activeTab;
		const matchesStatus =
			statusFilter === "all" || booking.status?.toLowerCase() === statusFilter;
		const matchesSearch =
			!searchQuery ||
			booking.workType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			booking.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			booking.serviceProvider?.name
				?.toLowerCase()
				.includes(searchQuery.toLowerCase());

		return matchesTab && matchesStatus && matchesSearch;
	});

	// Calculate stats
	const stats = {
		total: bookings.length,
		tractor: bookings.filter((b) => b.type === "tractor").length,
		worker: bookings.filter((b) => b.type === "worker").length,
		pending: bookings.filter(
			(b) =>
				b.status?.toLowerCase() === "pending" ||
				b.status?.toLowerCase() === "open"
		).length,
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading bookings...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 p-6">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8 flex items-center gap-3">
					<button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-200">
						<ArrowLeft className="w-6 h-6" />
					</button>
					<div>
						<h1 className="text-3xl font-bold text-gray-900 mb-1">
							My Bookings & Requests
						</h1>
						<p className="text-gray-600">
							Manage all your tractor and worker bookings
						</p>
					</div>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
					<div className="bg-white p-6 rounded-lg shadow">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600">Total Bookings</p>
								<p className="text-2xl font-bold text-gray-900">
									{stats.total}
								</p>
							</div>
							<Calendar className="w-10 h-10 text-green-600" />
						</div>
					</div>

					<div className="bg-white p-6 rounded-lg shadow">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600">Tractor Bookings</p>
								<p className="text-2xl font-bold text-gray-900">
									{stats.tractor}
								</p>
							</div>
							<Tractor className="w-10 h-10 text-blue-600" />
						</div>
					</div>

					<div className="bg-white p-6 rounded-lg shadow">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600">Worker Bookings</p>
								<p className="text-2xl font-bold text-gray-900">
									{stats.worker}
								</p>
							</div>
							<Users className="w-10 h-10 text-purple-600" />
						</div>
					</div>

					<div className="bg-white p-6 rounded-lg shadow">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600">Pending</p>
								<p className="text-2xl font-bold text-gray-900">
									{stats.pending}
								</p>
							</div>
							<Clock className="w-10 h-10 text-yellow-600" />
						</div>
					</div>
				</div>

				{/* Filters and Search */}
				<div className="bg-white p-4 rounded-lg shadow mb-6">
					<div className="flex flex-col md:flex-row gap-4">
						{/* Search */}
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
							<input
								type="text"
								placeholder="Search by work type, location..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
							/>
						</div>

						{/* Tab Filter */}
						<select
							value={activeTab}
							onChange={(e) => setActiveTab(e.target.value)}
							className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
						>
							<option value="all">All Types</option>
							<option value="tractor">Tractor Only</option>
							<option value="worker">Worker Only</option>
						</select>

						{/* Status Filter */}
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
						>
							<option value="all">All Status</option>
							<option value="pending">Pending</option>
							<option value="open">Open</option>
							<option value="confirmed">Confirmed</option>
							<option value="in_progress">In Progress</option>
							<option value="completed">Completed</option>
							<option value="cancelled">Cancelled</option>
						</select>
					</div>
				</div>

				{/* Bookings List */}
				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
						{error}
					</div>
				)}

				{filteredBookings.length === 0 ? (
					<div className="bg-white p-12 rounded-lg shadow text-center">
						<AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							No bookings found
						</h3>
						<p className="text-gray-600">
							{searchQuery || statusFilter !== "all" || activeTab !== "all"
								? "Try adjusting your filters"
								: "Start by booking a tractor or worker service"}
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{filteredBookings
							.slice(page * pageSize, page * pageSize + pageSize)
							.map((booking) => (
							<div
								key={booking._id}
								className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
							>
								<div className="flex flex-col md:flex-row justify-between gap-4">
									{/* Left Section */}
									<div className="flex-1">
										<div className="flex items-center gap-3 mb-3">
											{booking.type === "tractor" ? (
												<Tractor className="w-6 h-6 text-blue-600" />
											) : (
												<Users className="w-6 h-6 text-purple-600" />
											)}
											<div>
												<h3 className="text-lg font-semibold text-gray-900">
													{booking.workType || "Service"}
												</h3>
												<p className="text-sm text-gray-500">
													{booking.category === "requirement"
														? "Your Requirement"
														: "Booked Service"}
												</p>
											</div>
											<span
												className={`ml-auto px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(
													booking.status
												)}`}
											>
												{getStatusIcon(booking.status)}
												{booking.status || "Unknown"}
											</span>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
											<div className="flex items-start gap-2">
												<Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
												<div>
													<p className="text-gray-600">Date</p>
													<p className="font-medium text-gray-900">
														{new Date(booking.bookingDate).toLocaleDateString()}
													</p>
												</div>
											</div>

											<div className="flex items-start gap-2">
												<MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
												<div>
													<p className="text-gray-600">Location</p>
													<p className="font-medium text-gray-900">
														{booking.location || "N/A"}
													</p>
												</div>
											</div>

											<div className="flex items-start gap-2">
												<User className="w-4 h-4 text-gray-400 mt-0.5" />
												<div>
													<p className="text-gray-600">Service Provider</p>
													<p className="font-medium text-gray-900">
														{booking.serviceProvider?.name || "N/A"}
													</p>
												</div>
											</div>

											<div className="flex items-start gap-2">
												<IndianRupee className="w-4 h-4 text-gray-400 mt-0.5" />
												<div>
													<p className="text-gray-600">Total Cost</p>
													<p className="font-medium text-gray-900">
														₹{booking.totalCost || 0}
													</p>
												</div>
											</div>
										</div>

										{booking.notes &&
											booking.notes !== "N/A" &&
											booking.notes !== "No notes" && (
												<div className="mt-3 p-3 bg-gray-50 rounded">
													<p className="text-sm text-gray-600">
														<span className="font-medium">Notes:</span>{" "}
														{String(booking.notes)}
													</p>
												</div>
											)}
									</div>

									{/* Right Section - Contact */}
									{booking.serviceProvider?.phone && (
										<div className="flex flex-col gap-2 md:items-end">
											<a
												href={`tel:${booking.serviceProvider.phone}`}
												className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
											>
												<Phone className="w-4 h-4" />
												Call Provider
											</a>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}

				{/* Pagination */}
				{filteredBookings.length > pageSize && (
					<div className="mt-6 flex justify-end items-center gap-2">
						<button onClick={() => setPage(Math.max(0, page - 1))} className="px-3 py-1 bg-white border rounded hover:bg-gray-50">Prev</button>
						<span className="text-sm text-gray-600">
							Page {page + 1} of {Math.ceil(filteredBookings.length / pageSize)}
						</span>
						<button onClick={() => setPage((page + 1) % Math.max(1, Math.ceil(filteredBookings.length / pageSize)))} className="px-3 py-1 bg-white border rounded hover:bg-gray-50">Next</button>
					</div>
				)}
			</div>
		</div>
	);
}

export default FarmerBookings;
