import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
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
} from "lucide-react";

function FarmerBookings() {
	const { user , authLoading} = useAuth();
	const [bookings, setBookings] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [activeTab, setActiveTab] = useState("all"); // all, tractor, worker
	const [statusFilter, setStatusFilter] = useState("all"); // all, pending, confirmed, completed, cancelled
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		if (!authLoading && user) {
			fetchBookings();
		}
	}, [authLoading, user]);

    
	const fetchBookings = async () => {
		try {
			setLoading(true);
			setError(null);

			// Fetch BOTH bookings AND requirements
			const [
				tractorBookingsRes,
				workerBookingsRes,
				tractorRequirementsRes,
				workerRequirementsRes,
			] = await Promise.all([
				api.get("/bookings/farmer/tractors"),
				api.get("/bookings/farmer/workers"),
				api.get("/bookings/farmer/tractor-requirements"), // ✅ NEW
				api.get("/bookings/farmer/worker-requirements"), // ✅ NEW
			]);

			// Format bookings
			const tractorBookings =
				tractorBookingsRes.data.bookings?.map((booking) => ({
					...booking,
					type: "tractor",
					category: "booking",
				})) || [];

			const workerBookings =
				workerBookingsRes.data.bookings?.map((booking) => ({
					...booking,
					type: "worker",
					category: "booking",
				})) || [];

			// ✅ Format requirements (posted jobs)
			const tractorRequirements =
				tractorRequirementsRes.data.requirements?.map((req) => ({
					...req,
					type: "tractor",
					category: "requirement",
					totalCost: req.maxBudget,
					bookingDate: req.expectedDate,
					location: `${req.location?.village || ""}, ${
						req.location?.district || ""
					}`.trim(),
					serviceProvider: { name: "Pending Responses", phone: "" },
				})) || [];

			const workerRequirements =
				workerRequirementsRes.data.requirements?.map((req) => ({
					...req,
					type: "worker",
					category: "requirement",
					totalCost: req.wagesOffered,
					bookingDate: req.startDate,
					location: `${req.location?.village || ""}, ${
						req.location?.district || ""
					}`.trim(),
					serviceProvider: { name: "Pending Applicants", phone: "" },
				})) || [];

			// Combine all data
			const allData = [
				...tractorBookings,
				...workerBookings,
				...tractorRequirements,
				...workerRequirements,
			].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

			setBookings(allData);
		} catch (err) {
			setError(err.response?.data?.message || "Failed to load bookings");
		} finally {
			setLoading(false);
		}
	};

	const getStatusColor = (status) => {
		const colors = {
			pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
			confirmed: "bg-blue-100 text-blue-800 border-blue-200",
			completed: "bg-green-100 text-green-800 border-green-200",
			cancelled: "bg-red-100 text-red-800 border-red-200",
		};
		return (
			colors[status?.toLowerCase()] ||
			"bg-gray-100 text-gray-800 border-gray-200"
		);
	};

	const getStatusIcon = (status) => {
		const icons = {
			pending: <Clock className="w-4 h-4" />,
			confirmed: <CheckCircle className="w-4 h-4" />,
			completed: <CheckCircle className="w-4 h-4" />,
			cancelled: <XCircle className="w-4 h-4" />,
		};
		return icons[status?.toLowerCase()] || <AlertCircle className="w-4 h-4" />;
	};

	const filteredBookings = bookings.filter((booking) => {
		const matchesTab = activeTab === "all" || booking.type === activeTab;
		const matchesStatus =
			statusFilter === "all" || booking.status?.toLowerCase() === statusFilter;
		const matchesSearch =
			searchQuery === "" ||
			booking.serviceProvider?.name
				?.toLowerCase()
				.includes(searchQuery.toLowerCase()) ||
			booking.location?.toLowerCase().includes(searchQuery.toLowerCase());

		return matchesTab && matchesStatus && matchesSearch;
	});

	const stats = {
		total: bookings.length,
		tractor: bookings.filter((b) => b.type === "tractor").length,
		worker: bookings.filter((b) => b.type === "worker").length,
		pending: bookings.filter((b) => b.status?.toLowerCase() === "pending")
			.length,
		confirmed: bookings.filter((b) => b.status?.toLowerCase() === "confirmed")
			.length,
		completed: bookings.filter((b) => b.status?.toLowerCase() === "completed")
			.length,
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
					<p className="mt-4 text-gray-600 font-medium">Loading bookings...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
					<p className="text-gray-600">
						Manage all your tractor and worker bookings
					</p>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					<div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600 mb-1">Total Bookings</p>
								<p className="text-3xl font-bold text-gray-900">
									{stats.total}
								</p>
							</div>
							<div className="p-3 bg-green-100 rounded-lg">
								<Calendar className="w-6 h-6 text-green-600" />
							</div>
						</div>
					</div>

					<div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600 mb-1">Tractor Bookings</p>
								<p className="text-3xl font-bold text-blue-600">
									{stats.tractor}
								</p>
							</div>
							<div className="p-3 bg-blue-100 rounded-lg">
								<Tractor className="w-6 h-6 text-blue-600" />
							</div>
						</div>
					</div>

					<div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600 mb-1">Worker Bookings</p>
								<p className="text-3xl font-bold text-purple-600">
									{stats.worker}
								</p>
							</div>
							<div className="p-3 bg-purple-100 rounded-lg">
								<Users className="w-6 h-6 text-purple-600" />
							</div>
						</div>
					</div>

					<div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-600 mb-1">Pending</p>
								<p className="text-3xl font-bold text-yellow-600">
									{stats.pending}
								</p>
							</div>
							<div className="p-3 bg-yellow-100 rounded-lg">
								<Clock className="w-6 h-6 text-yellow-600" />
							</div>
						</div>
					</div>
				</div>

				{/* Filters Section */}
				<div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
					{/* Search Bar */}
					<div className="mb-6">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
							<input
								type="text"
								placeholder="Search by provider name or location..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
							/>
						</div>
					</div>

					{/* Type Tabs */}
					<div className="flex flex-wrap gap-2 mb-4">
						<button
							onClick={() => setActiveTab("all")}
							className={`px-4 py-2 rounded-lg font-medium transition-all ${
								activeTab === "all"
									? "bg-green-600 text-white shadow-md"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							All ({stats.total})
						</button>
						<button
							onClick={() => setActiveTab("tractor")}
							className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
								activeTab === "tractor"
									? "bg-blue-600 text-white shadow-md"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							<Tractor className="w-4 h-4" />
							Tractors ({stats.tractor})
						</button>
						<button
							onClick={() => setActiveTab("worker")}
							className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
								activeTab === "worker"
									? "bg-purple-600 text-white shadow-md"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							<Users className="w-4 h-4" />
							Workers ({stats.worker})
						</button>
					</div>

					{/* Status Filter */}
					<div className="flex flex-wrap gap-2">
						<span className="flex items-center gap-2 text-gray-600 font-medium">
							<Filter className="w-4 h-4" />
							Status:
						</span>
						{["all", "pending", "confirmed", "completed", "cancelled"].map(
							(status) => (
								<button
									key={status}
									onClick={() => setStatusFilter(status)}
									className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
										statusFilter === status
											? "bg-green-600 text-white"
											: "bg-gray-100 text-gray-700 hover:bg-gray-200"
									}`}
								>
									{status.charAt(0).toUpperCase() + status.slice(1)}
								</button>
							)
						)}
					</div>
				</div>

				{/* Error Message */}
				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
						{error}
					</div>
				)}

				{/* Bookings List */}
				{filteredBookings.length === 0 ? (
					<div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
						<div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<Calendar className="w-10 h-10 text-gray-400" />
						</div>
						<h3 className="text-xl font-semibold text-gray-900 mb-2">
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
						{filteredBookings.map((booking) => (
							<div
								key={booking._id}
								className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden"
							>
								<div className="p-6">
									<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
										{/* Left Section */}
										<div className="flex-1">
											<div className="flex items-start gap-4">
												<div
													className={`p-3 rounded-lg ${
														booking.type === "tractor"
															? "bg-blue-100"
															: "bg-purple-100"
													}`}
												>
													{booking.type === "tractor" ? (
														<Tractor
															className={`w-6 h-6 ${
																booking.type === "tractor"
																	? "text-blue-600"
																	: "text-purple-600"
															}`}
														/>
													) : (
														<Users
															className={`w-6 h-6 ${
																booking.type === "tractor"
																	? "text-blue-600"
																	: "text-purple-600"
															}`}
														/>
													)}
												</div>

												<div className="flex-1">
													<div className="flex items-center gap-2 mb-2">
														<h3 className="text-lg font-semibold text-gray-900">
															{booking.type === "tractor"
																? "Tractor Service"
																: "Worker Service"}
														</h3>
														<span
															className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(
																booking.status
															)}`}
														>
															{getStatusIcon(booking.status)}
															{booking.status}
														</span>
													</div>

													<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
														<div className="flex items-center gap-2 text-gray-600">
															<User className="w-4 h-4" />
															<span className="font-medium">
																{booking.serviceProvider?.name || "N/A"}
															</span>
														</div>

														<div className="flex items-center gap-2 text-gray-600">
															<Calendar className="w-4 h-4" />
															<span>
																{new Date(
																	booking.bookingDate
																).toLocaleDateString("en-IN", {
																	day: "numeric",
																	month: "short",
																	year: "numeric",
																})}
															</span>
														</div>

														<div className="flex items-center gap-2 text-gray-600">
															<MapPin className="w-4 h-4" />
															<span className="truncate">
																{booking.location || "N/A"}
															</span>
														</div>

														<div className="flex items-center gap-2 text-gray-600">
															<IndianRupee className="w-4 h-4" />
															<span className="font-semibold text-green-600">
																₹{booking.totalCost || "N/A"}
															</span>
														</div>

														{booking.duration && (
															<div className="flex items-center gap-2 text-gray-600">
																<Clock className="w-4 h-4" />
																<span>{booking.duration} hours</span>
															</div>
														)}

														{booking.serviceProvider?.phone && (
															<div className="flex items-center gap-2 text-gray-600">
																<Phone className="w-4 h-4" />
																<a
																	href={`tel:${booking.serviceProvider.phone}`}
																	className="text-blue-600 hover:underline"
																>
																	{booking.serviceProvider.phone}
																</a>
															</div>
														)}
													</div>

													{booking.notes && (
														<div className="mt-3 p-3 bg-gray-50 rounded-lg">
															<p className="text-sm text-gray-700">
																<span className="font-medium">Notes:</span>{" "}
																{booking.notes}
															</p>
														</div>
													)}
												</div>
											</div>
										</div>

										{/* Right Section - Actions */}
										<div className="flex flex-col gap-2 lg:w-40">
											{booking.status?.toLowerCase() === "pending" && (
												<>
													<button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
														Confirm
													</button>
													<button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
														Cancel
													</button>
												</>
											)}
											{booking.status?.toLowerCase() === "confirmed" && (
												<button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
													View Details
												</button>
											)}
											{booking.status?.toLowerCase() === "completed" && (
												<button className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors">
													Rate Service
												</button>
											)}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export default FarmerBookings;
