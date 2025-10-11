import React, { useState } from "react";
import {
	User,
	Phone,
	Leaf,
	Home,
	Truck,
	CheckCircle,
	XCircle,
	ChevronDown,
	Award,
	Users,
	Settings,
	Clipboard,
	Code,
	X,
} from "lucide-react";

// Helper component for styled inputs with icons
const IconInput = ({
	label,
	name,
	type = "text",
	icon: Icon,
	children,
	...props
}) => {
	// Determine if the input is a select/dropdown based on the presence of children
	const isDropdown = !!children;

	return (
		<div className="mb-4">
			<label className="block mb-1 font-semibold text-gray-700 flex items-center">
				{Icon && <Icon className="w-5 h-5 mr-2 text-green-600" />}
				{label}
			</label>
			<div className="relative">
				{isDropdown ? (
					<>
						{/* Clone child (the select element) and add classes to hide native arrow and add padding */}
						{React.cloneElement(children, {
							name: name,
							// appearance-none hides the native arrow. pr-10 adds space for our custom arrow.
							className:
								"w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white pr-10",
							...props,
						})}
						{/* Custom Chevron Down Icon positioned inside the select box */}
						<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
					</>
				) : (
					<input
						type={type}
						name={name}
						className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
						{...props}
					/>
				)}
			</div>
		</div>
	);
};

// Changed function definition to remove 'export default'
function Register() {
	const [showForm, setShowForm] = useState(false);
	const [userType, setUserType] = useState(""); // 'farmer' or 'buyer'
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submissionMessage, setSubmissionMessage] = useState(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false); // State for the settings drawer
	const [copyMessage, setCopyMessage] = useState(null);

	const [form, setForm] = useState({
		name: "",
		gender: "",
		phone: "",
		soilType: "",
		noOfAcres: "",
		farmingExperience: "",
		transportVehicle: "",
	});

	// Utility function to safely copy text to clipboard
	const handleCopy = (text, successMsg) => {
		// Fallback for secure context issues
		const textarea = document.createElement("textarea");
		textarea.value = text;
		document.body.appendChild(textarea);
		textarea.select();
		try {
			const successful = document.execCommand("copy");
			if (successful) {
				setCopyMessage({ type: "success", text: successMsg });
			} else {
				setCopyMessage({
					type: "error",
					text: "Copy failed. Please copy manually.",
				});
			}
		// eslint-disable-next-line no-unused-vars
		} catch (err) {
			setCopyMessage({
				type: "error",
				text: "Copy failed. Please copy manually.",
			});
		}
		document.body.removeChild(textarea);

		setTimeout(() => setCopyMessage(null), 3000);
	};

	const handleExportData = () => {
		const exportData = { userType, ...form };
		const jsonString = JSON.stringify(exportData, null, 2);
		handleCopy(jsonString, "Form data copied to clipboard as JSON!");
	};

	const handleExportCode = () => {
		// Simulate copying the entire component code content (simplified for brevity here)
		// Note: The structure here reflects the new export style
		const codeContent = `import React, { useState } from "react";
// ... (rest of the imports and logic)

function Register() {
  // ... (component logic)
}

export default Register;
`;
		handleCopy(
			codeContent,
			"Component code (Register.jsx) copied to clipboard!"
		);
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;

		// Custom logic for phone number to allow only digits
		if (name === "phone") {
			const cleanedValue = value.replace(/\D/g, ""); // Remove non-digits
			setForm((prev) => ({ ...prev, [name]: cleanedValue }));
		} else {
			setForm((prev) => ({ ...prev, [name]: value }));
		}
	};

	const handleUserTypeChange = (e) => {
		setUserType(e.target.value);
		setForm((prev) => ({
			...prev,
			// Clear conditional fields when user type changes
			soilType: "",
			noOfAcres: "",
			farmingExperience: "",
			transportVehicle: "",
		}));
	};

	const resetForm = () => {
		setForm({
			name: "",
			gender: "",
			phone: "",
			soilType: "",
			noOfAcres: "",
			farmingExperience: "",
			transportVehicle: "",
		});
		setUserType("");
	};

	const submit = (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		setSubmissionMessage(null);

		// Simulate registration API call
		setTimeout(() => {
			setIsSubmitting(false);
			// Successful registration message
			setSubmissionMessage({
				type: "success",
				text: `Successfully registered as a ${userType.toUpperCase()}. You are now logged in!`,
			});

			// Log data for preview
			console.log(`Registered as ${userType}:`, form);

			// Reset form and hide it after successful submission
			resetForm();
			// Keep form visible after submission to see the message, but hide after a delay
			setTimeout(() => setShowForm(false), 3000);
		}, 1500);
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6 relative overflow-hidden">
			{/* Settings Icon Button */}
			<button
				onClick={() => setIsDrawerOpen(!isDrawerOpen)}
				className="fixed top-4 right-4 z-50 p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition transform hover:scale-110"
				aria-label="Toggle Settings Drawer"
			>
				<Settings className="w-6 h-6" />
			</button>

			{/* Copy Notification (Fixed Position) */}
			{copyMessage && (
				<div
					className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 p-3 rounded-lg font-medium shadow-xl flex items-center ${
						copyMessage.type === "success"
							? "bg-blue-100 border border-blue-500 text-blue-700"
							: "bg-red-100 border border-red-500 text-red-700"
					}`}
				>
					{copyMessage.type === "success" ? (
						<Clipboard className="w-5 h-5 mr-2" />
					) : (
						<XCircle className="w-5 h-5 mr-2" />
					)}
					{copyMessage.text}
				</div>
			)}

			{/* Settings Drawer */}
			<div
				className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out p-6 border-l-4 border-green-500/50 ${
					isDrawerOpen ? "translate-x-0" : "translate-x-full"
				}`}
			>
				<div className="flex justify-between items-center mb-6">
					<h3 className="text-xl font-bold text-green-700 flex items-center space-x-2">
						<Settings className="w-6 h-6" />
						<span>Export Options</span>
					</h3>
					<button
						onClick={() => setIsDrawerOpen(false)}
						className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100 transition"
						aria-label="Close Drawer"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				<p className="text-sm text-gray-600 mb-6 border-b pb-4">
					Use these options to export the current data state or the component
					code.
				</p>

				{/* Export Data Button */}
				<div className="mb-4">
					<button
						onClick={handleExportData}
						className="w-full flex items-center justify-center p-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition shadow-md space-x-2 disabled:opacity-50"
						disabled={!showForm}
					>
						<Clipboard className="w-5 h-5" />
						<span>Export Form Data (JSON)</span>
					</button>
					<p className="text-xs text-gray-500 mt-1 pl-2">
						Copies current form values to clipboard.
					</p>
				</div>

				{/* Export Code Button */}
				<div className="mb-4">
					<button
						onClick={handleExportCode}
						className="w-full flex items-center justify-center p-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-800 transition shadow-md space-x-2"
					>
						<Code className="w-5 h-5" />
						<span>Export Code File (Register.jsx)</span>
					</button>
					<p className="text-xs text-gray-500 mt-1 pl-2">
						Copies the component code to clipboard.
					</p>
				</div>
			</div>

			{/* Main Content Area */}

			{/* Initial Button */}
			{!showForm && (
				<div className="text-center">
					<h1 className="text-4xl font-extrabold mb-4 text-green-800">
						Welcome to Crop Connect
					</h1>
					<p className="text-gray-600 mb-8">
						Join our platform to connect farmers and buyers directly.
					</p>
					<button
						onClick={() => {
							setShowForm(true);
							setSubmissionMessage(null); // Clear previous messages
						}}
						className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-10 py-4 rounded-full shadow-xl hover:shadow-2xl transition transform hover:-translate-y-1 font-bold text-lg"
					>
						Start Registration
					</button>
				</div>
			)}

			{/* Registration Form */}
			{showForm && (
				<form
					onSubmit={submit}
					className="bg-white p-8 rounded-3xl shadow-2xl max-w-lg w-full border-4 border-green-500/10 z-10"
				>
					<h2 className="text-4xl font-bold text-center mb-8 text-green-700 flex items-center justify-center space-x-2">
						<Users className="w-8 h-8 text-green-500" />
						<span>User Registration</span>
					</h2>

					{/* Submission Message Display */}
					{submissionMessage && (
						<div
							className={`flex items-center p-4 mb-6 rounded-xl font-medium shadow-md ${
								submissionMessage.type === "success"
									? "bg-green-100 border border-green-500 text-green-700"
									: "bg-red-100 border border-red-500 text-red-700"
							}`}
							role="alert"
						>
							{submissionMessage.type === "success" ? (
								<CheckCircle className="w-5 h-5 mr-3" />
							) : (
								<XCircle className="w-5 h-5 mr-3" />
							)}
							{submissionMessage.text}
						</div>
					)}

					{/* Name Input */}
					<IconInput
						label="Full Name"
						name="name"
						icon={User}
						placeholder="Your full name"
						value={form.name}
						onChange={handleInputChange}
						required
					/>

					{/* Gender Select */}
					<IconInput
						label="Gender"
						name="gender"
						icon={ChevronDown}
						value={form.gender}
						onChange={handleInputChange}
						required
					>
						<select>
							<option value="" disabled>
								Select gender
							</option>
							<option value="male">Male</option>
							<option value="female">Female</option>
							<option value="other">Other</option>
						</select>
					</IconInput>

					{/* Phone Number Input */}
					<IconInput
						label="Phone Number"
						name="phone"
						type="tel"
						icon={Phone}
						placeholder="10 digit phone number"
						value={form.phone}
						onChange={handleInputChange}
						required
						maxLength="10"
						inputMode="numeric"
					/>

					{/* User Type Select Dropdown */}
					<IconInput
						label="I am registering as a:"
						name="userType"
						icon={Users} // Keeping Users icon for label
						value={userType}
						onChange={handleUserTypeChange}
						required
					>
						<select>
							<option value="" disabled>
								Select User Type
							</option>
							<option value="farmer">Farmer</option>
							<option value="buyer">Buyer</option>
						</select>
					</IconInput>

					{/* Conditional Fields for FARMER */}
					{userType === "farmer" && (
						<div className="space-y-4 pt-2">
							<h3 className="text-lg font-bold text-green-700 border-b pb-2">
								Farmer Details
							</h3>

							<IconInput
								label="Soil Type"
								name="soilType"
								icon={Leaf}
								placeholder="E.g., Loam, Red, Black"
								value={form.soilType}
								onChange={handleInputChange}
								required
							/>
							<IconInput
								label="Number of Acres"
								name="noOfAcres"
								type="number"
								icon={Home}
								placeholder="E.g., 2"
								min="0"
								value={form.noOfAcres}
								onChange={handleInputChange}
								required
							/>
							<IconInput
								label="Experience in Farming (Years)"
								name="farmingExperience"
								type="number"
								icon={Award}
								placeholder="E.g., 5"
								min="0"
								value={form.farmingExperience}
								onChange={handleInputChange}
								required
							/>
						</div>
					)}

					{/* Conditional Fields for BUYER */}
					{userType === "buyer" && (
						<div className="space-y-4 pt-2">
							<h3 className="text-lg font-bold text-green-700 border-b pb-2">
								Buyer Details
							</h3>
							<IconInput
								label="Primary Transport Vehicle"
								name="transportVehicle"
								icon={Truck}
								placeholder="E.g., Truck, Pickup Van, Tractor"
								value={form.transportVehicle}
								onChange={handleInputChange}
								required
							/>
						</div>
					)}

					<div className="flex justify-between items-center mt-8 space-x-4">
						<button
							type="submit"
							disabled={isSubmitting || !userType}
							className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg px-6 py-3 rounded-full shadow-xl hover:from-green-700 hover:to-emerald-700 transition transform hover:-translate-y-0.5 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
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
									<span>Registering...</span>
								</>
							) : (
								<span>Register</span>
							)}
						</button>

						<button
							type="button"
							onClick={() => {
								setShowForm(false);
								setSubmissionMessage(null);
								resetForm();
							}}
							className="text-gray-500 font-semibold px-4 py-3 rounded-full hover:bg-gray-100 transition"
						>
							Cancel
						</button>
					</div>
				</form>
			)}
		</div>
	);
}

export default Register;
