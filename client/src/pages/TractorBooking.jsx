import { useState } from "react";

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
		<div
			className={`fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-50 transition-opacity duration-300`}
		>
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
							{Object.entries(data).map(([key, value]) => (
								<li key={key}>
									<strong className="capitalize">
										{key.replace(/([A-Z])/g, " $1")}:
									</strong>{" "}
									{value}
								</li>
							))}
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
	const [form, setForm] = useState({
		location: "",
		workType: "",
		landType: "",
		vehicleType: "",
		date: new Date().toISOString().split("T")[0], // Default to today
		time: "08:00",
		duration: 4, // Default to a half-day booking
	});

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitStatus, setSubmitStatus] = useState(null); // { type: 'success' | 'error', message: string, data: object }

	const handleChange = (e) => {
		const { name, value } = e.target;
		// Special handling for number type input (Duration)
		if (name === "duration") {
			setForm((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
		} else {
			setForm((prev) => ({ ...prev, [name]: value }));
		}
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (isSubmitting) return;

		setIsSubmitting(true);
		setSubmitStatus(null);

		// Simulate API call delay
		setTimeout(() => {
			// Logic for Success
			setSubmitStatus({
				type: "success",
				message:
					"Your tractor booking has been successfully confirmed and scheduled.",
				data: form,
			});

			// Reset form on success
			setForm({
				location: "",
				workType: "",
				landType: "",
				vehicleType: "",
				date: new Date().toISOString().split("T")[0],
				time: "08:00",
				duration: 4,
			});

			setIsSubmitting(false);

			// Example of simulated error state (uncomment to test error)
			/*
      setSubmitStatus({
        type: 'error',
        message: 'Failed to connect to the server. Please try again later.',
        data: null
      });
      setIsSubmitting(false);
      */
		}, 1500);
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
			{/* Removed 'border-t-8 border-green-600' class here */}
			<div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-6 sm:p-8">
				{/* Header */}
				<div className="flex items-center space-x-3 mb-6 pb-4">
					<TractorIcon />
					<h2 className="text-3xl font-extrabold text-green-700">
						Book a Tractor
					</h2>
				</div>

				<form
					onSubmit={handleSubmit}
					className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5"
				>
					{/* Location (Full Width) */}
					<label className="flex flex-col sm:col-span-2 text-gray-700 font-medium">
						Location of Booking <span className="text-red-500">*</span>
						<input
							type="text"
							name="location"
							value={form.location}
							onChange={handleChange}
							required
							placeholder="Village, District, State"
							className="mt-1 px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-150"
						/>
					</label>

					{/* Type of Work */}
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

					{/* Land Type */}
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

					{/* Vehicle Type (Full Width) */}
					<label className="flex flex-col sm:col-span-2 text-gray-700 font-medium">
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

					{/* Date */}
					<label className="flex flex-col text-gray-700 font-medium">
						Date <span className="text-red-500">*</span>
						<input
							type="date"
							name="date"
							value={form.date}
							onChange={handleChange}
							required
							className="mt-1 px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-150"
						/>
					</label>

					{/* Time */}
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

					{/* Duration (Full Width) - Changed back to type="number" for reliability */}
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

					{/* Submit Button (Full Width) */}
					<button
						type="submit"
						disabled={isSubmitting}
						className={`sm:col-span-2 mt-6 py-3 rounded-xl font-semibold text-white transition duration-300 shadow-lg ${
							isSubmitting
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
								Processing Requirement...
							</span>
						) : (
							"Post Requirement"
						)}
					</button>
				</form>

				<button
					onClick={() => window.history.back()}
					className="mt-4 w-full border border-gray-300 rounded-xl py-3 text-gray-700 hover:bg-gray-100 transition shadow-sm"
				>
					← Back to Dashboard
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
