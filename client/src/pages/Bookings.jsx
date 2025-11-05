import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../config/api";
import {
	Users,
	Briefcase,
	MapPin,
	Clock,
	IndianRupee,
	ChevronDown,
	User,
} from "lucide-react";

// Helper component for styled inputs
const InputField = ({
	label,
	name,
	type = "text",
	placeholder,
	icon: Icon,
	required = false,
	unit,
	children,
	...rest
}) => (
	<div className="relative">
		<label className="block text-sm font-medium text-gray-700 mb-1">
			{label} {required && <span className="text-red-500">*</span>}
		</label>
		<div className="flex items-center border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-green-500 transition duration-150 bg-white shadow-sm">
			{Icon && <Icon className="w-5 h-5 text-gray-400 ml-3" />}
			{children ? (
				React.cloneElement(children, {
					name: name,
					onChange: children.props.onChange,
					className:
						"w-full p-3 rounded-xl focus:outline-none border-0 bg-transparent text-gray-800 appearance-none",
					required: required,
					...rest,
				})
			) : (
				<input
					type={type}
					name={name}
					className="w-full p-3 rounded-xl focus:outline-none border-0 bg-transparent text-gray-800"
					placeholder={placeholder}
					required={required}
					{...rest}
				/>
			)}
			{unit && (
				<span className="mr-3 text-sm text-gray-500 font-medium">{unit}</span>
			)}
		</div>
	</div>
);

function WorkerBooking() {
	const navigate = useNavigate();
	const { user, loading} = useAuth();
	const [formData, setFormData] = useState({
		minAge: "18",
		maxAge: "65",
		preferredGender: "any",
		minExperience: "0",
		wagesOffered: "",
		village: "",
		district: "",
		state: "",
		fullAddress: "",
		workDuration: "",
		workType: "Farm Labor",
		startDate: "",
		endDate: "",
		foodProvided: false,
		transportationProvided: false,
		notes: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submissionMessage, setSubmissionMessage] = useState(null);

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	const resetForm = () => {
		setFormData({
			minAge: "18",
			maxAge: "65",
			preferredGender: "any",
			minExperience: "0",
			wagesOffered: "",
			village: "",
			district: "",
			state: "",
			fullAddress: "",
			workDuration: "",
			workType: "Farm Labor",
			startDate: "",
			endDate: "",
			foodProvided: false,
			transportationProvided: false,
			notes: "",
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		setSubmissionMessage(null);

		try {
			// Get token from sessionStorage using tabId
			const token = localStorage.getItem('token');

			if (!token) {
				setSubmissionMessage({
					type: "error",
					text: "Please login first to post worker requirement",
				});
				setIsSubmitting(false);
				return;
			}

			// Validate required fields
			if (
				!formData.wagesOffered ||
				!formData.fullAddress ||
				!formData.workDuration ||
				!formData.startDate
			) {
				setSubmissionMessage({
					type: "error",
					text: "Please fill in all required fields",
				});
				setIsSubmitting(false);
				return;
			}

			// Prepare data matching backend schema
			const requestData = {
				requiredAge: {
					min: parseInt(formData.minAge),
					max: parseInt(formData.maxAge),
				},
				preferredGender: formData.preferredGender,
				minExperience: parseInt(formData.minExperience),
				wagesOffered: parseInt(formData.wagesOffered),
				location: {
					village: formData.village,
					district: formData.district,
					state: formData.state,
					fullAddress: formData.fullAddress,
				},
				workDuration: formData.workDuration,
				workType: formData.workType,
				foodProvided: formData.foodProvided,
				transportationProvided: formData.transportationProvided,
				startDate: new Date(formData.startDate).toISOString(),
				endDate: formData.endDate
					? new Date(formData.endDate).toISOString()
					: null,
				status: "open",
				notes: formData.notes,
			};

			console.log("Sending worker requirement:", requestData);

			const response = await api.post("/worker-requirements", requestData, {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			console.log("Response:", response.data);

			if (response.data.success) {
				setSubmissionMessage({
					type: "success",
					text: "Worker requirement posted successfully! Workers can now apply to your requirement.",
				});
				resetForm();

				// Redirect to farmer dashboard after 2 seconds
				setTimeout(() => {
					navigate("/farmer-dashboard");
				}, 2000);
			} else {
				setSubmissionMessage({
					type: "error",
					text: response.data.message || "Failed to post requirement",
				});
			}
		} catch (error) {
			console.error("Error posting worker requirement:", error);
			console.error("Error details:", error.response?.data);

			setSubmissionMessage({
				type: "error",
				text:
					error.response?.data?.message ||
					error.message ||
					"Failed to post worker requirement. Please try again.",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleBack = () => {
		navigate(-1);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-xl">Loading...</div>
			</div>
		);
	}

	if (!user || user.role !== "farmer") {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-gray-800 mb-4">
						Access Denied
					</h2>
					<p className="text-gray-600 mb-6">
						Only farmers can post worker requirements
					</p>
					<button
						onClick={() => navigate("/farmer-dashboard")}
						className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
					>
						Go to Dashboard
					</button>
				</div>
			</div>
		);
	}

	return (
		<div
			className="min-h-screen flex items-center justify-center p-4 md:p-8"
			style={{
				backgroundImage:
					"url('/uploaded:paddyback.jpg-8fa0524c-c232-4e09-98be-2388265d2b4a')",
				backgroundRepeat: "no-repeat",
				backgroundSize: "cover",
			}}
		>
			<div className="w-full max-w-2xl">
				{submissionMessage && (
					<div
						className={`border-l-4 p-4 mb-6 rounded-lg font-medium shadow-md ${
							submissionMessage.type === "success"
								? "bg-green-100 border-green-500 text-green-700"
								: "bg-red-100 border-red-500 text-red-700"
						}`}
						role="alert"
					>
						{submissionMessage.text}
					</div>
				)}

				<form
					onSubmit={handleSubmit}
					className="bg-white/95 rounded-2xl shadow-2xl p-6 md:p-8 border border-green-200 space-y-6 backdrop-blur-sm"
				>
					<div className="text-center mb-6">
						<h2 className="font-extrabold text-3xl text-green-700">
							Post Worker Requirement
						</h2>
						<p className="text-gray-600 mt-2">
							Tell workers what you're looking for
						</p>
					</div>

					{/* Age Range */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<InputField
							label="Minimum Age"
							name="minAge"
							type="number"
							icon={User}
							placeholder="18"
							min="18"
							max="100"
							value={formData.minAge}
							onChange={handleChange}
							required
						/>
						<InputField
							label="Maximum Age"
							name="maxAge"
							type="number"
							icon={User}
							placeholder="65"
							min="18"
							max="100"
							value={formData.maxAge}
							onChange={handleChange}
							required
						/>
					</div>

					{/* Gender */}
					<InputField
						label="Preferred Gender"
						name="preferredGender"
						icon={ChevronDown}
						value={formData.preferredGender}
						onChange={handleChange}
						required
					>
						<select name="preferredGender">
							<option value="any">Any</option>
							<option value="male">Male</option>
							<option value="female">Female</option>
							<option value="other">Other</option>
						</select>
					</InputField>

					{/* Work Type */}
					<InputField
						label="Type of Work"
						name="workType"
						icon={Briefcase}
						value={formData.workType}
						onChange={handleChange}
						required
					>
						<select name="workType">
							<option value="Farm Labor">Farm Labor</option>
							<option value="Harvester">Harvester</option>
							<option value="Irrigator">Irrigator</option>
							<option value="Sprayer">Sprayer</option>
							<option value="General Helper">General Helper</option>
							<option value="Other">Other</option>
						</select>
					</InputField>

					{/* Experience and Wages */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<InputField
							label="Min. Experience"
							name="minExperience"
							type="number"
							icon={Briefcase}
							placeholder="0"
							unit="Years"
							min="0"
							value={formData.minExperience}
							onChange={handleChange}
							required
						/>
						<InputField
							label="Wages Offered"
							name="wagesOffered"
							type="number"
							icon={IndianRupee}
							placeholder="500"
							unit="₹ / Day"
							min="0"
							value={formData.wagesOffered}
							onChange={handleChange}
							required
						/>
					</div>

					{/* Location Fields */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<InputField
							label="Village"
							name="village"
							type="text"
							icon={MapPin}
							placeholder="Village name"
							value={formData.village}
							onChange={handleChange}
						/>
						<InputField
							label="District"
							name="district"
							type="text"
							icon={MapPin}
							placeholder="District"
							value={formData.district}
							onChange={handleChange}
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<InputField
							label="State"
							name="state"
							type="text"
							icon={MapPin}
							placeholder="State"
							value={formData.state}
							onChange={handleChange}
						/>
						<InputField
							label="Full Address"
							name="fullAddress"
							type="text"
							icon={MapPin}
							placeholder="Complete address"
							value={formData.fullAddress}
							onChange={handleChange}
							required
						/>
					</div>

					{/* Dates */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<InputField
							label="Start Date"
							name="startDate"
							type="date"
							icon={Clock}
							value={formData.startDate}
							onChange={handleChange}
							required
						/>
						<InputField
							label="End Date (Optional)"
							name="endDate"
							type="date"
							icon={Clock}
							value={formData.endDate}
							onChange={handleChange}
						/>
					</div>

					{/* Work Duration */}
					<InputField
						label="Work Duration/Time"
						name="workDuration"
						type="text"
						icon={Clock}
						placeholder="e.g., 8 hours per day, 9 AM to 5 PM"
						value={formData.workDuration}
						onChange={handleChange}
						required
					/>

					{/* Additional Benefits */}
					<div className="space-y-3">
						<label className="block text-sm font-medium text-gray-700">
							Additional Benefits
						</label>
						<div className="flex items-center space-x-6">
							<label className="flex items-center space-x-2 cursor-pointer">
								<input
									type="checkbox"
									name="foodProvided"
									checked={formData.foodProvided}
									onChange={handleChange}
									className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
								/>
								<span className="text-gray-700">Food Provided</span>
							</label>
							<label className="flex items-center space-x-2 cursor-pointer">
								<input
									type="checkbox"
									name="transportationProvided"
									checked={formData.transportationProvided}
									onChange={handleChange}
									className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
								/>
								<span className="text-gray-700">Transportation Provided</span>
							</label>
						</div>
					</div>

					{/* Notes */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Additional Notes (Optional)
						</label>
						<textarea
							name="notes"
							value={formData.notes}
							onChange={handleChange}
							placeholder="Any additional requirements or information..."
							className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
							rows="3"
						/>
					</div>

					{/* Submit Button */}
					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full py-4 font-bold text-lg rounded-xl bg-green-600 text-white shadow-xl hover:bg-green-700 transition duration-300 active:scale-[0.98] disabled:bg-gray-400 flex items-center justify-center space-x-2"
					>
						{isSubmitting ? (
							<>
								<svg
									className="animate-spin h-5 w-5 text-white"
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
								<span>Posting Requirement...</span>
							</>
						) : (
							<span>Post Requirement</span>
						)}
					</button>

					{/* Back Button */}
					<button
						type="button"
						onClick={handleBack}
						className="w-full py-3 mt-4 text-lg font-semibold rounded-xl border border-gray-300 bg-gray-100 text-gray-700 shadow-sm hover:bg-gray-200 transition duration-300 active:scale-[0.98] flex items-center justify-center space-x-2"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="lucide lucide-arrow-left"
						>
							<path d="m12 19-7-7 7-7" />
							<path d="M19 12H5" />
						</svg>
						<span>Back to Dashboard</span>
					</button>
				</form>
			</div>
		</div>
	);
}

export default WorkerBooking;
