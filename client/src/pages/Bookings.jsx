import React, { useState } from "react";
import {
	Users,
	Briefcase,
	MapPin,
	Clock,
	DollarSign,
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
	const [formData, setFormData] = useState({
		age: "",
		gender: "",
		experience: "",
		wages: "",
		location: "",
		workTime: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submissionMessage, setSubmissionMessage] = useState(null);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const resetForm = () => {
		setFormData({
			age: "",
			gender: "",
			experience: "",
			wages: "",
			location: "",
			workTime: "",
		});
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		setSubmissionMessage(null);

		// Simulate API call for booking submission
		setTimeout(() => {
			setIsSubmitting(false);
			setSubmissionMessage({
				type: "success",
				text: "Worker booking request submitted successfully! We will connect you shortly.",
			});

			// Reset form data after successful submission
			resetForm();
		}, 1500);
	};

	const handleBack = () => {
		console.log(
			"Navigating back to the previous page/main dashboard. (Placeholder for navigation logic)"
		);
		setSubmissionMessage(null); // Clear any message on 'back' intention
		// Add your navigation logic here (e.g., a function to change the current view/route)
	};

	return (
		<div
			className="min-h-screen flex items-center justify-center p-4 md:p-8"
			style={{
				// Using the same paddy field image for a consistent theme
				backgroundImage:
					"url('/uploaded:paddyback.jpg-8fa0524c-c232-4e09-98be-2388265d2b4a')",
				backgroundRepeat: "no-repeat",
				backgroundSize: "cover",
			}}
		>
			<div className="w-full max-w-xl">
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

				{/* Form is rendered directly */}
				<form
					onSubmit={handleSubmit}
					className="bg-white/95 rounded-2xl shadow-2xl p-6 md:p-8 border border-green-200 space-y-6 backdrop-blur-sm"
				>
					<h2 className="font-extrabold text-3xl text-green-700 text-center">
						Post Worker Requirement
					</h2>

					{/* Age and Gender */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<InputField
							label="Required Age (18-65)"
							name="age"
							type="number"
							icon={User}
							placeholder="25"
							min="18"
							max="65"
							value={formData.age}
							onChange={handleChange}
							required
						/>
						<InputField
							label="Preferred Gender"
							name="gender"
							icon={ChevronDown}
							value={formData.gender}
							onChange={handleChange}
							required
						>
							<select name="gender">
								<option value="" disabled>
									Select
								</option>
								<option value="any">Any</option>
								<option value="male">Male</option>
								<option value="female">Female</option>
								<option value="other">Other</option>
							</select>
						</InputField>
					</div>

					{/* Experience and Wages */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<InputField
							label="Min. Experience"
							name="experience"
							type="number"
							icon={Briefcase}
							placeholder="3"
							unit="Years"
							min="0"
							value={formData.experience}
							onChange={handleChange}
							required
						/>
						<InputField
							label="Wages Offered"
							name="wages"
							type="number"
							icon={DollarSign}
							placeholder="500"
							unit="₹ RS / Day"
							min="0"
							value={formData.wages}
							onChange={handleChange}
							required
						/>
					</div>

					{/* Location and Time */}
					<InputField
						label="Location of Booking"
						name="location"
						type="text"
						icon={MapPin}
						placeholder="Village, District, State"
						value={formData.location}
						onChange={handleChange}
						required
					/>

					<InputField
						label="Work Duration/Time"
						name="workTime"
						type="text"
						icon={Clock}
						placeholder="e.g., 8 hours per day, 9 AM to 5 PM"
						value={formData.workTime}
						onChange={handleChange}
						required
					/>

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
