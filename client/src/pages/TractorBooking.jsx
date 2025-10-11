import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { bookingService } from "../services/bookingService";
import { tractorService } from "../services/tractorService";

// --- Constants ---
const workTypes = [
	"Plowing",
	"Harvesting",
	"Spraying",
	"Hauling",
	"Land Preparation",
];

const landTypes = ["Dry", "Wet", "Hilly", "Plain"];

const vehicleTypes = [
	"Small Tractor",
	"Medium Tractor",
	"Heavy Duty Tractor",
	"Specialized Tractor",
];

// Reusable Success/Error Notification Component
const StatusNotification = ({ status, onClose }) => {
	if (!status) return null;

	const { type, message, data } = status;
	const isSuccess = type === "success";

	// Icon SVG based on status
	const Icon = () => (
		<svg
			className={`w-6 h-6 ${isSuccess ? "text-green-500" : "text-red-500"}`}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			{isSuccess ? (
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			) : (
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			)}
		</svg>
	);

	return (
		<div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
			<div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full transform transition-all duration-300 scale-100">
				<div className="flex justify-between items-start mb-4">
					<div className="flex items-center">
						<Icon />
						<h3
							className={`ml-3 text-lg font-bold ${
								isSuccess ? "text-green-700" : "text-red-700"
							}`}
						>
							{isSuccess ? "Booking Successful!" : "Submission Error"}
						</h3>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
				<p className="text-gray-600 mb-4">{message}</p>

				{data && isSuccess && (
					<div className="bg-green-50 p-3 rounded-lg text-sm text-gray-700 max-h-40 overflow-y-auto">
						<h4 className="font-semibold mb-1 text-green-800">
							Booking Details:
						</h4>
						<ul className="space-y-1">
							<li>
								<strong>Booking ID:</strong> {data._id}
							</li>
							<li>
								<strong>Date:</strong>{" "}
								{new Date(data.bookingDate).toLocaleDateString()}
							</li>
							<li>
								<strong>Work Type:</strong> {data.workType}
							</li>
							<li>
								<strong>Total Cost:</strong> ₹{data.totalCost}
							</li>
							<li>
								<strong>Status:</strong>{" "}
								<span className="capitalize">{data.status}</span>
							</li>
						</ul>
					</div>
				)}

				<button
					onClick={onClose}
					className="mt-5 w-full bg-green-700 text-white py-2 rounded-xl hover:bg-green-800 transition shadow-md"
				>
					Close
				</button>
			</div>
		</div>
	);
};

// Main Application Component
export default function TractorBookingForm() {
	const navigate = useNavigate();

	const [form, setForm] = useState({
		location: "",
		district: "",
		state: "",
		pincode: "",
		workType: "",
		landType: "",
		vehicleType: "",
		landSize: "",
		date: new Date().toISOString().split("T")[0],
		time: "08:00",
		duration: 4,
		additionalInfo: "",
	});

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitStatus, setSubmitStatus] = useState(null);
	const [availableTractors, setAvailableTractors] = useState([]);
	const [selectedTractor, setSelectedTractor] = useState(null);

	const handleChange = (e) => {
		const { name, value } = e.target;
		if (name === "duration" || name === "landSize") {
			setForm((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
		} else {
			setForm((prev) => ({ ...prev, [name]: value }));
		}
	};

	// Search for available tractors based on criteria
	const handleSearchTractors = async () => {
		try {
			const filters = {
				typeOfPlowing: form.workType,
				landType: form.landType,
				availability: true,
			};

			const result = await tractorService.getAllTractorServices(filters);

			if (result.success) {
				setAvailableTractors(result.tractorServices);
				if (result.tractorServices.length === 0) {
					setSubmitStatus({
						type: "error",
						message: "No tractors available for the selected criteria.",
					});
				}
			}
		} catch (error) {
			setSubmitStatus({
				type: "error",
				message:
					error.response?.data?.message ||
					"Failed to fetch tractors. Please try again.",
			});
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (isSubmitting) return;

		// Validation
		if (!selectedTractor) {
			setSubmitStatus({
				type: "error",
				message: "Please select a tractor before booking.",
			});
			return;
		}

		if (!form.landSize || form.landSize <= 0) {
			setSubmitStatus({
				type: "error",
				message: "Please enter a valid land size.",
			});
			return;
		}

		setIsSubmitting(true);
		setSubmitStatus(null);

		try {
			const bookingData = {
				serviceType: "tractor",
				serviceId: selectedTractor._id,
				bookingDate: `${form.date}T${form.time}:00.000Z`,
				duration: form.duration,
				workType: form.workType,
				landSize: form.landSize,
				location: {
					village: form.location,
					district: form.district,
					state: form.state,
					pincode: form.pincode,
				},
				notes: form.additionalInfo,
			};

			const result = await bookingService.createBooking(bookingData);

			if (result.success) {
				setSubmitStatus({
					type: "success",
					message: "Booking confirmed successfully! 🚜",
					data: result.booking,
				});

				// Reset form
				setForm({
					location: "",
					district: "",
					state: "",
					pincode: "",
					workType: "",
					landType: "",
					vehicleType: "",
					landSize: "",
					date: new Date().toISOString().split("T")[0],
					time: "08:00",
					duration: 4,
					additionalInfo: "",
				});
				setSelectedTractor(null);
				setAvailableTractors([]);

				// Redirect after 3 seconds
				setTimeout(() => navigate("/my-bookings"), 3000);
			}
		} catch (error) {
			setSubmitStatus({
				type: "error",
				message:
					error.response?.data?.message || "Booking failed. Please try again.",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Tractor Icon SVG
	const TractorIcon = () => (
		<svg
			className="w-8 h-8 text-green-600"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M12 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-7z" />
			<path d="M5 11V7a2 2 0 0 1 2-2h4l2 2h4l2-2h4a2 2 0 0 1 2 2v4" />
			<circle cx="7" cy="16" r="3" />
			<circle cx="18" cy="16" r="3" />
			<rect x="10" y="8" width="4" height="4" rx="1" />
		</svg>
	);

	return (
		<div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-start justify-center font-sans">
			<div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6 sm:p-8">
				{/* Header */}
				<div className="flex items-center space-x-3 mb-6 pb-4 border-b">
					<TractorIcon />
					<h2 className="text-3xl font-extrabold text-green-700">
						Book a Tractor
					</h2>
				</div>

				<form
					onSubmit={handleSubmit}
					className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5"
				>
					{/* Location Details */}
					<div className="sm:col-span-2">
						<h3 className="text-lg font-semibold text-gray-700 mb-3">
							Location Details
						</h3>
					</div>

					<label className="flex flex-col text-gray-700 font-medium">
						Village/Area <span className="text-red-500">*</span>
						<input
							type="text"
							name="location"
							value={form.location}
							onChange={handleChange}
							required
							placeholder="Enter village or area"
							className="mt-1 px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-150"
						/>
					</label>

					<label className="flex flex-col text-gray-700 font-medium">
						District <span className="text-red-500">*</span>
						<input
							type="text"
							name="district"
							value={form.district}
							onChange={handleChange}
							required
							placeholder="Enter district"
							className="mt-1 px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-150"
						/>
					</label>

					<label className="flex flex-col text-gray-700 font-medium">
						State <span className="text-red-500">*</span>
						<input
							type="text"
							name="state"
							value={form.state}
							onChange={handleChange}
							required
							placeholder="Enter state"
							className="mt-1 px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-150"
						/>
					</label>

					<label className="flex flex-col text-gray-700 font-medium">
						Pincode <span className="text-red-500">*</span>
						<input
							type="text"
							name="pincode"
							value={form.pincode}
							onChange={handleChange}
							required
							placeholder="Enter pincode"
							maxLength="6"
							pattern="[0-9]{6}"
							className="mt-1 px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-150"
						/>
					</label>

					{/* Work Details */}
					<div className="sm:col-span-2 mt-4">
						<h3 className="text-lg font-semibold text-gray-700 mb-3">
							Work Details
						</h3>
					</div>

					<label className="flex flex-col text-gray-700 font-medium">
						Type of Work <span className="text-red-500">*</span>
						<select
							name="workType"
							value={form.workType}
							onChange={handleChange}
							required
							className="mt-1 px-4 py-2 border border-green-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-150"
						>
							<option value="" disabled>
								Select work type
							</option>
							{workTypes.map((w) => (
								<option key={w} value={w}>
									{w}
								</option>
							))}
						</select>
					</label>

					<label className="flex flex-col text-gray-700 font-medium">
						Land Type <span className="text-red-500">*</span>
						<select
							name="landType"
							value={form.landType}
							onChange={handleChange}
							required
							className="mt-1 px-4 py-2 border border-green-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-150"
						>
							<option value="" disabled>
								Select land type
							</option>
							{landTypes.map((l) => (
								<option key={l} value={l}>
									{l}
								</option>
							))}
						</select>
					</label>

					<label className="flex flex-col text-gray-700 font-medium">
						Vehicle Type <span className="text-red-500">*</span>
						<select
							name="vehicleType"
							value={form.vehicleType}
							onChange={handleChange}
							required
							className="mt-1 px-4 py-2 border border-green-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-150"
						>
							<option value="" disabled>
								Select tractor type
							</option>
							{vehicleTypes.map((v) => (
								<option key={v} value={v}>
									{v}
								</option>
							))}
						</select>
					</label>

					<label className="flex flex-col text-gray-700 font-medium">
						Land Size (Acres) <span className="text-red-500">*</span>
						<input
							type="number"
							min="1"
							name="landSize"
							value={form.landSize}
							onChange={handleChange}
							required
							placeholder="e.g., 10"
							className="mt-1 px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-150"
						/>
					</label>

					{/* Scheduling */}
					<div className="sm:col-span-2 mt-4">
						<h3 className="text-lg font-semibold text-gray-700 mb-3">
							Schedule
						</h3>
					</div>

					<label className="flex flex-col text-gray-700 font-medium">
						Date <span className="text-red-500">*</span>
						<input
							type="date"
							name="date"
							value={form.date}
							onChange={handleChange}
							required
							min={new Date().toISOString().split("T")[0]}
							className="mt-1 px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-150"
						/>
					</label>

					<label className="flex flex-col text-gray-700 font-medium">
						Start Time <span className="text-red-500">*</span>
						<input
							type="time"
							name="time"
							value={form.time}
							onChange={handleChange}
							required
							className="mt-1 px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-150"
						/>
					</label>

					<label className="flex flex-col sm:col-span-2 text-gray-700 font-medium">
						Work Duration (Hours) <span className="text-red-500">*</span>
						<input
							type="number"
							min="1"
							max="24"
							name="duration"
							value={form.duration}
							onChange={handleChange}
							required
							placeholder="e.g., 4"
							className="mt-1 px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-150"
						/>
					</label>

					{/* Additional Info */}
					<label className="flex flex-col sm:col-span-2 text-gray-700 font-medium">
						Additional Information
						<textarea
							name="additionalInfo"
							value={form.additionalInfo}
							onChange={handleChange}
							placeholder="Any special requirements or notes"
							rows="3"
							className="mt-1 px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-150"
						/>
					</label>

					{/* Search Tractors Button */}
					<button
						type="button"
						onClick={handleSearchTractors}
						className="sm:col-span-2 py-3 rounded-xl font-semibold text-green-700 border-2 border-green-700 hover:bg-green-50 transition duration-300"
					>
						🔍 Search Available Tractors
					</button>

					{/* Available Tractors List */}
					{availableTractors.length > 0 && (
						<div className="sm:col-span-2 mt-4">
							<h3 className="text-lg font-semibold text-gray-700 mb-3">
								Available Tractors
							</h3>
							<div className="space-y-3 max-h-60 overflow-y-auto">
								{availableTractors.map((tractor) => (
									<div
										key={tractor._id}
										onClick={() => setSelectedTractor(tractor)}
										className={`p-4 border-2 rounded-lg cursor-pointer transition ${
											selectedTractor?._id === tractor._id
												? "border-green-600 bg-green-50"
												: "border-gray-300 hover:border-green-400"
										}`}
									>
										<div className="flex justify-between items-start">
											<div>
												<h4 className="font-semibold text-gray-800">
													{tractor.model} - {tractor.brand}
												</h4>
												<p className="text-sm text-gray-600">
													{tractor.typeOfPlowing} | {tractor.landType}
												</p>
												<p className="text-sm text-gray-600">
													Vehicle: {tractor.vehicleNumber}
												</p>
											</div>
											<div className="text-right">
												<p className="text-lg font-bold text-green-700">
													₹{tractor.chargePerAcre}/acre
												</p>
												{selectedTractor?._id === tractor._id && (
													<span className="text-xs text-green-600 font-semibold">
														✓ Selected
													</span>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Submit Button */}
					<button
						type="submit"
						disabled={isSubmitting || !selectedTractor}
						className={`sm:col-span-2 mt-6 py-3 rounded-xl font-semibold text-white transition duration-300 shadow-lg ${
							isSubmitting || !selectedTractor
								? "bg-green-400 cursor-not-allowed"
								: "bg-green-700 hover:bg-green-800 active:bg-green-900"
						}`}
					>
						{isSubmitting ? (
							<span className="flex items-center justify-center">
								<svg
									className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
								Processing Booking...
							</span>
						) : (
							"Confirm Booking"
						)}
					</button>
				</form>

				<button
					onClick={() => navigate("/")}
					className="mt-4 w-full border border-gray-300 rounded-xl py-3 text-gray-700 hover:bg-gray-100 transition shadow-sm"
				>
					← Back to Home
				</button>
			</div>

			{/* Status Notification Modal */}
			<StatusNotification
				status={submitStatus}
				onClose={() => setSubmitStatus(null)}
			/>
		</div>
	);
}
