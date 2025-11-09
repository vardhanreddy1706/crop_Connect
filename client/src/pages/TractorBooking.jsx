/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../config/api";
import {
	Tractor,
	MapPin,
	Clock,
	IndianRupee,
	Search,
	Calendar,
	Phone,
	CheckCircle,
	ArrowLeft,
	FileText,
} from "lucide-react";

// Helper to determine if a service is expired (date + time aware)
const isServiceExpired = (svc) => {
	try {
		if (!svc) return false;
		// If explicitly unavailable or non-active, treat as expired/unavailable
		if (svc.availability === false || (svc.status && svc.status !== "active")) return true;
		const now = new Date();
		// Check explicit availableDate/availableTime
		if (svc.availableDate) {
			const when = new Date(`${new Date(svc.availableDate).toISOString().slice(0,10)}T${(svc.availableTime||"00:00").padStart(5,"0")}`);
			if (!isNaN(when.getTime())) return when < now;
		}
		// Back-compat: if availableDates array exists
		if (Array.isArray(svc.availableDates) && svc.availableDates.length > 0) {
			return svc.availableDates.every((d) => new Date(d) < now);
		}
		return false;
	} catch {
		return false;
	}
};

const TractorBooking = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	// Tab State - 'requirement' or 'search'
	const [activeTab, setActiveTab] = useState("search");

// Search State
const [searchLocation, setSearchLocation] = useState({
		village: "",
		mandal: "", // optional, if provided by service
		district: "",
		state: "",
});
	const [tractors, setTractors] = useState([]);
	const [filteredTractors, setFilteredTractors] = useState([]);
	const [loading, setLoading] = useState(false);
	const [searchPerformed, setSearchPerformed] = useState(false);

	// Pagination for tractors (search results)
	const [page, setPage] = useState(0);
	const itemsPerPage = 6;

	// Booking State
	const [selectedTractor, setSelectedTractor] = useState(null);
	const [showBookingModal, setShowBookingModal] = useState(false);
	const [bookingData, setBookingData] = useState({
		bookingDate: "",
		duration: 1,
		location: "",
		workType: "Plowing",
		landSize: "",
		notes: "",
	});
	const [bookingLoading, setBookingLoading] = useState(false);
	const [message, setMessage] = useState(null);

	// Tractor Requirement State
	const [requirementData, setRequirementData] = useState({
		workType: "Plowing",
		landType: "Plain",
		landSize: "",
		expectedDate: "",
		duration: "",
		village: "",
		district: "",
		state: "",
		maxBudget: "",
		urgency: "normal",
		notes: "",
	});
	const [requirementLoading, setRequirementLoading] = useState(false);

	// Fetch all tractors on component mount
	useEffect(() => {
		if (activeTab === "search") {
			fetchAllTractors();
		}
	}, [activeTab]);

const fetchAllTractors = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("token");
			// Fetch all tractors without location filters initially
			// Backend will auto-filter by user's location if user is a farmer
			const response = await api.get("/tractors", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.data.success) {
				const list = response.data.tractorServices || [];
				setTractors(list);
				setFilteredTractors(list);
			}
		} catch (error) {
			console.error("Error fetching tractors:", error);
			setMessage({
				type: "error",
				text: "Failed to fetch tractors",
			});
		} finally {
			setLoading(false);
		}
	};


const handleSearch = async () => {
		setSearchPerformed(true);
		setLoading(true);

		try {
			const token = localStorage.getItem("token");
			const params = {};
			
			// Only include parameters that are provided and not empty
			if (searchLocation.village && searchLocation.village.trim()) {
				params.village = searchLocation.village.trim();
			}
			if (searchLocation.district && searchLocation.district.trim()) {
				params.district = searchLocation.district.trim();
			}
			if (searchLocation.state && searchLocation.state.trim()) {
				params.state = searchLocation.state.trim();
			}
			// Note: mandal is not supported by backend, but we can filter client-side if needed

			// If no search parameters, fetch all (backend will auto-filter by user location for farmers)
			const response = await api.get("/tractors", {
				params: Object.keys(params).length > 0 ? params : undefined,
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.data.success) {
				const list = response.data.tractorServices || [];
				// Apply client-side mandal filter if provided (backend doesn't support it)
				let filtered = list;
				if (searchLocation.mandal && searchLocation.mandal.trim()) {
					filtered = list.filter((tractor) => 
						(tractor.location?.mandal || "")
							.toLowerCase()
							.includes(searchLocation.mandal.toLowerCase())
					);
				}
				setTractors(filtered);
				setFilteredTractors(filtered);
			}
		} catch (error) {
			console.error("Error searching tractors:", error);
			setMessage({
				type: "error",
				text: "Failed to search tractors",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleBookNow = (tractor) => {
		setSelectedTractor(tractor);
		setShowBookingModal(true);
	};

	const handleBookingSubmit = async (e) => {
		e.preventDefault();
		setBookingLoading(true);

		try {
			const response = await api.post("/bookings/create", {
				tractorServiceId: selectedTractor._id,
				bookingDate: bookingData.bookingDate,
				duration: bookingData.duration,
				location: {
					fullAddress: bookingData.location,
					district: user?.address?.district || "",
					state: user?.address?.state || "",
					pincode: user?.address?.pincode || "",
				},
				workType: bookingData.workType,
				landSize: bookingData.landSize,
				notes: bookingData.notes,
			});

			if (response.data.success) {
				setMessage({
					type: "success",
					text: "Tractor booked successfully!",
				});
				setShowBookingModal(false);
				setBookingData({
					bookingDate: "",
					duration: 1,
					location: "",
					workType: "Plowing",
					landSize: "",
					notes: "",
				});

				setTimeout(() => {
					navigate("/farmer-dashboard");
				}, 2000);
			}
		} catch (error) {
			console.error("Booking error:", error);
			setMessage({
				type: "error",
				text:
					error.response?.data?.message ||
					"Failed to book tractor. Please try again.",
			});
		} finally {
			setBookingLoading(false);
		}
	};


	// TRACTOR REQUIREMENT HANDLERS
	const handleRequirementChange = (e) => {
		const { name, value } = e.target;
		setRequirementData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handlePostRequirement = async (e) => {
		e.preventDefault();
		setRequirementLoading(true);
		setMessage(null);

		try {
			const token = localStorage.getItem("token");

			const payload = {
				workType: requirementData.workType,
				landType: requirementData.landType,
				landSize: parseFloat(requirementData.landSize),
				expectedDate: new Date(requirementData.expectedDate).toISOString(),
					duration: `${requirementData.duration} hours`,
				location: {
					village: requirementData.village,
					district: requirementData.district,
					state: requirementData.state,
				},
				maxBudget: parseFloat(requirementData.maxBudget),
				urgency: requirementData.urgency,
				additionalNotes: requirementData.notes,
				status: "open",
			};

			const response = await api.post("/tractor-requirements", payload, {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (response.data.success) {
				setMessage({
					type: "success",
					text: "Tractor requirement posted successfully! Tractor owners will contact you.",
				});

				// Reset form
				setRequirementData({
					workType: "Plowing",
					landType: "Plain",
					landSize: "",
					expectedDate: "",
					duration: "",
					village: "",
					district: "",
					state: "",
					maxBudget: "",
					urgency: "normal",
					notes: "",
				});

				setTimeout(() => {
					navigate("/farmer-dashboard");
				}, 2000);
			}
		} catch (error) {
			console.error("Post requirement error:", error);
			setMessage({
				type: "error",
				text:
					error.response?.data?.message ||
					"Failed to post requirement. Please try again.",
			});
		} finally {
			setRequirementLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8 px-4">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
					<button
						onClick={() => navigate(-1)}
						className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition"
					>
						<ArrowLeft className="w-5 h-5 mr-2" />
						Back
					</button>
					<h1 className="text-3xl font-bold text-gray-900 flex items-center">
						<Tractor className="w-8 h-8 mr-3 text-green-600" />
						Book a Tractor
					</h1>
					<p className="text-gray-600 mt-2">
						Post your requirement or search for available tractors
					</p>
				</div>

				{/* Tab Navigation */}
				<div className="bg-white rounded-xl shadow-lg p-2 mb-6 flex space-x-2">
					<button
						onClick={() => setActiveTab("requirement")}
						className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
							activeTab === "requirement"
								? "bg-green-600 text-white"
								: "text-gray-600 hover:bg-gray-100"
						}`}
					>
						<FileText className="w-5 h-5 inline mr-2" />
						Post Requirement
					</button>
					<button
						onClick={() => setActiveTab("search")}
						className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
							activeTab === "search"
								? "bg-green-600 text-white"
								: "text-gray-600 hover:bg-gray-100"
						}`}
					>
						<Search className="w-5 h-5 inline mr-2" />
						Search Tractors
					</button>
				</div>

				{/* Success/Error Message */}
				{message && (
					<div
						className={`mb-6 p-4 rounded-lg border-l-4 ${
							message.type === "success"
								? "bg-green-50 border-green-500 text-green-700"
								: "bg-red-50 border-red-500 text-red-700"
						}`}
					>
						{message.text}
					</div>
				)}

				{/* POST REQUIREMENT TAB */}
				{activeTab === "requirement" && (
					<TractorRequirementForm
						formData={requirementData}
						onChange={handleRequirementChange}
						onSubmit={handlePostRequirement}
						loading={requirementLoading}
					/>
				)}

				{/* SEARCH TAB */}
				{activeTab === "search" && (
					<>
						{/* Search Section */}
						<div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
							<h2 className="text-xl font-semibold mb-4 flex items-center">
								<Search className="w-5 h-5 mr-2 text-green-600" />
								Search by Location
							</h2>
<div className="grid md:grid-cols-5 gap-4">
								<input
									type="text"
									placeholder="Village (optional)"
									value={searchLocation.village}
									onChange={(e) =>
										setSearchLocation({
											...searchLocation,
											village: e.target.value,
										})
									}
									className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
								/>
<input
									type="text"
									placeholder="Mandal (optional)"
									value={searchLocation.mandal}
									onChange={(e) => setSearchLocation({ ...searchLocation, mandal: e.target.value })}
									className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500" />
								<input
									type="text"
									placeholder="District"
									value={searchLocation.district}
									onChange={(e) =>
										setSearchLocation({
											...searchLocation,
											district: e.target.value,
										})
									}
									className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
								/>
								<input
									type="text"
									placeholder="State"
									value={searchLocation.state}
									onChange={(e) =>
										setSearchLocation({
											...searchLocation,
											state: e.target.value,
										})
									}
									className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
								/>
								<button
									onClick={handleSearch}
									className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center"
								>
									<Search className="w-5 h-5 mr-2" />
									Search
								</button>
							</div>
						</div>

						{/* Results Section */}
						<div>
							{loading ? (
								<div className="text-center py-12">
									<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
									<p className="mt-4 text-gray-600">Loading tractors...</p>
								</div>
							) : filteredTractors.length === 0 && searchPerformed ? (
								<div className="bg-white rounded-2xl shadow-lg p-12 text-center">
									<Tractor className="w-16 h-16 mx-auto text-gray-400 mb-4" />
									<h3 className="text-xl font-semibold text-gray-700 mb-2">
										No Tractors Found
									</h3>
									<p className="text-gray-500">
										Try searching with different location criteria
									</p>
								</div>
							) : (
								<>
									<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
										{filteredTractors
												.filter((t) => !isServiceExpired(t))
												.slice(page * itemsPerPage, page * itemsPerPage + itemsPerPage)
												.map((tractor) => (
													<TractorCard
														key={tractor._id}
														tractor={tractor}
														onBook={handleBookNow}
													/>
												))}
										</div>
										{filteredTractors.filter((t)=>!isServiceExpired(t)).length > itemsPerPage && (
											<div className="flex justify-end items-center gap-2 mt-4">
												<button onClick={() => setPage(Math.max(0, page - 1))} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Prev</button>
												<button onClick={() => setPage((page + 1) % Math.max(1, Math.ceil(filteredTractors.filter((t)=>!isServiceExpired(t)).length/itemsPerPage)))} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Next</button>
											</div>
										)}
								</>
							)}
						</div>
					</>
				)}

				{/* Booking Modal */}
				{showBookingModal && (
					<BookingModal
						tractor={selectedTractor}
						bookingData={bookingData}
						setBookingData={setBookingData}
						onSubmit={handleBookingSubmit}
						onClose={() => setShowBookingModal(false)}
						loading={bookingLoading}
					/>
				)}
			</div>
		</div>
	);
};

// Tractor Card Component
const TractorCard = ({ tractor, onBook }) => (
	<div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
		<div className="flex items-start justify-between mb-4">
			<div>
				<h3 className="text-xl font-bold text-gray-900">
					{tractor.brand} {tractor.model}
				</h3>
				<p className="text-sm text-gray-500">{tractor.typeOfPlowing}</p>
			</div>
			{(!tractor.availability || tractor.isBooked) ? (
				<div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">Engaged</div>
			) : isServiceExpired(tractor) ? (
				<div className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm font-semibold">Expired</div>
			) : (
				<div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Available</div>
			)}
		</div>

		<div className="space-y-3 mb-4">
			<div className="flex items-center text-gray-600">
				<Tractor className="w-4 h-4 mr-2" />
				<span className="text-sm">{tractor.vehicleNumber}</span>
			</div>
			<div className="flex items-center text-gray-600">
				<IndianRupee className="w-4 h-4 mr-2" />
				<span className="text-sm font-semibold text-green-700">
					₹{tractor.chargePerAcre}/acre
				</span>
			</div>
			<div className="flex items-center text-gray-600">
				<MapPin className="w-4 h-4 mr-2" />
				<span className="text-sm">
					{tractor.location?.village}
					{tractor.location?.mandal ? `, ${tractor.location.mandal}` : ""}
					{tractor.location?.district ? `, ${tractor.location.district}` : ""}
					{tractor.location?.state ? `, ${tractor.location.state}` : ""}
				</span>
			</div>
			<div className="flex items-center text-gray-600">
				<Phone className="w-4 h-4 mr-2" />
				<span className="text-sm">{tractor.contactNumber}</span>
			</div>
		</div>

		<button
			onClick={() => onBook(tractor)}
			disabled={isServiceExpired(tractor) || !tractor.availability || tractor.isBooked}
			className="w-full bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center"
		>
			<CheckCircle className="w-5 h-5 mr-2" />
			Book Now
		</button>
	</div>
);

// Tractor Requirement Form Component
const TractorRequirementForm = ({ formData, onChange, onSubmit, loading }) => (
	<div className="bg-white rounded-2xl shadow-lg p-8">
		<h2 className="text-2xl font-bold mb-6">Post Tractor Requirement</h2>
		<p className="text-gray-600 mb-6">
			Fill in your requirements and tractor owners in your area will contact you
		</p>

		<form onSubmit={onSubmit} className="space-y-6">
			{/* Work Details */}
		<div className="grid md:grid-cols-3 gap-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Type of Work *
					</label>
					<select
						name="workType"
						value={formData.workType}
						onChange={onChange}
						required
						className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
					>
						<option value="Plowing">Plowing</option>
						<option value="Harvesting">Harvesting</option>
						<option value="Spraying">Spraying</option>
						<option value="Hauling">Hauling</option>
						<option value="Land Preparation">Land Preparation</option>
					</select>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Land Type *
					</label>
					<select
						name="landType"
						value={formData.landType}
						onChange={onChange}
						required
						className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
					>
						<option value="Plain">Plain</option>
						<option value="Dry">Dry</option>
						<option value="Wet">Wet</option>
						<option value="Hilly">Hilly</option>
					</select>
				</div>
			</div>

			<div className="grid md:grid-cols-2 gap-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Land Size (acres) *
					</label>
					<input
						type="number"
						name="landSize"
						value={formData.landSize}
						onChange={onChange}
						required
						min="0.1"
						step="0.1"
						placeholder="5"
						className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Expected Date *
					</label>
					<input
						type="date"
						name="expectedDate"
						value={formData.expectedDate}
						onChange={onChange}
						required
						min={new Date().toISOString().split("T")[0]}
						className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
					/>
				</div>
			</div>

			<div className="grid md:grid-cols-2 gap-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Duration (hours) *
					</label>
					<input
						type="number"
						name="duration"
						value={formData.duration}
						onChange={onChange}
						required
						min="1"
						placeholder="e.g., 5"
						className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Max Budget (₹) *
					</label>
					<input
						type="number"
						name="maxBudget"
						value={formData.maxBudget}
						onChange={onChange}
						required
						min="0"
						placeholder="5000"
						className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
					/>
				</div>
			</div>

			{/* Location */}
			<div className="grid md:grid-cols-3 gap-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Village
					</label>
					<input
						type="text"
						name="village"
						value={formData.village}
						onChange={onChange}
						placeholder="Village name"
						className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						District *
					</label>
					<input
						type="text"
						name="district"
						value={formData.district}
						onChange={onChange}
						required
						placeholder="District"
						className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						State *
					</label>
					<input
						type="text"
						name="state"
						value={formData.state}
						onChange={onChange}
						required
						placeholder="State"
						className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
					/>
				</div>
			</div>

			{/* Urgency */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Urgency *
				</label>
				<select
					name="urgency"
					value={formData.urgency}
					onChange={onChange}
					required
					className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
				>
					<option value="normal">Normal</option>
					<option value="urgent">Urgent</option>
					<option value="very_urgent">Very Urgent</option>
				</select>
			</div>

			{/* Notes */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Additional Notes
				</label>
				<textarea
					name="notes"
					value={formData.notes}
					onChange={onChange}
					rows="3"
					placeholder="Any specific requirements..."
					className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 flex items-center justify-center"
			>
				{loading ? (
					<>
						<svg
							className="animate-spin h-5 w-5 text-white mr-2"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							></circle>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Posting Requirement...
					</>
				) : (
					"Post Requirement"
				)}
			</button>
		</form>
	</div>
);

// Booking Modal Component
const BookingModal = ({
	tractor,
	bookingData,
	setBookingData,
	onSubmit,
	onClose,
	loading,
}) => {
	if (!tractor) return null;
	return (
	<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
			<h2 className="text-2xl font-bold text-gray-900 mb-6">
				Book: {tractor.brand} {tractor.model}
			</h2>

			<form onSubmit={onSubmit} className="space-y-4">
				<div className="grid md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Booking Date *
						</label>
						<input
							type="date"
							required
							value={bookingData.bookingDate}
							onChange={(e) =>
								setBookingData({
									...bookingData,
									bookingDate: e.target.value,
								})
							}
							min={new Date().toISOString().split("T")[0]}
							className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Duration (hours) *
						</label>
						<input
							type="number"
							required
							min="1"
							value={bookingData.duration}
							onChange={(e) =>
								setBookingData({
									...bookingData,
									duration: e.target.value,
								})
							}
							className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
						/>
					</div>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Work Location *
					</label>
					<input
						type="text"
						required
						placeholder="Full address where work will be done"
						value={bookingData.location}
						onChange={(e) =>
							setBookingData({
								...bookingData,
								location: e.target.value,
							})
						}
						className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
					/>
				</div>

				<div className="grid md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Work Type *
						</label>
						<select
							required
							value={bookingData.workType}
							onChange={(e) =>
								setBookingData({
									...bookingData,
									workType: e.target.value,
								})
							}
							className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
						>
							<option value="Plowing">Plowing</option>
							<option value="Harvesting">Harvesting</option>
							<option value="Spraying">Spraying</option>
							<option value="Hauling">Hauling</option>
							<option value="Land Preparation">Land Preparation</option>
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Land Size (acres)
						</label>
						<input
							type="number"
							step="0.1"
							value={bookingData.landSize}
							onChange={(e) =>
								setBookingData({
									...bookingData,
									landSize: e.target.value,
								})
							}
							className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
						/>
					</div>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Additional Notes
					</label>
					<textarea
						rows="3"
						value={bookingData.notes}
						onChange={(e) =>
							setBookingData({
								...bookingData,
								notes: e.target.value,
							})
						}
						className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
						placeholder="Any special requirements..."
					/>
				</div>

				<div className="bg-gray-50 p-4 rounded-lg">
					<h3 className="font-semibold mb-2">Cost Estimate:</h3>
					<p className="text-2xl font-bold text-green-600">
						₹{tractor.chargePerAcre * (bookingData.landSize || 1)}
					</p>
					<p className="text-sm text-gray-500">
						({bookingData.landSize || 1} acres × ₹{tractor.chargePerAcre}/acre)
					</p>
				</div>

				<div className="flex space-x-4 pt-4">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={loading}
						className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
					>
						{loading ? "Booking..." : "Confirm Booking"}
					</button>
				</div>
			</form>
		</div>
	</div>
	);
};

export default TractorBooking;
