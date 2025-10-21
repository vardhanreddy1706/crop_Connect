import api from "../config/api";

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
	X,
} from "lucide-react";

const FormInput = ({
	label,
	name,
	type = "text",
	icon: Icon,
	placeholder,
	required = false,
	maxLength,
	min,
	value,
	onChange,
	children,
}) => {
	const isDropdown = !!children;

	return (
		
		<div className="mb-4">
			<label className="block mb-1 font-semibold text-gray-700 flex items-center">
				{Icon && <Icon className="w-5 h-5 mr-2 text-green-600" />}
				{label}
				{required && <span className="text-red-500 ml-1">*</span>}
			</label>
			<div className="relative">
				{isDropdown ? (
					<>
						{React.cloneElement(children, {
							name,
							className:
								"w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white pr-10",
							value,
							onChange,
							required,
						})}
						<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
					</>
				) : (
					<input
						type={type}
						name={name}
						value={value}
						onChange={onChange}
						placeholder={placeholder}
						required={required}
						maxLength={maxLength}
						min={min}
						className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
					/>
				)}
			</div>
		</div>
	);
};

const RegisterFB = () => {
	const [currentStep, setCurrentStep] = useState("roleSelect");
	const [selectedRole, setSelectedRole] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [message, setMessage] = useState(null);

	// Common Fields
	const [commonForm, setCommonForm] = useState({
		name: "",
		email: "",
		password: "",
		phone: "",
		age: "",
		gender: "",
		address: {
			village: "",
			district: "",
			state: "",
			pincode: "",
		},
	});

	// Farmer-specific
	const [farmerForm, setFarmerForm] = useState({
		soilType: "",
		noOfAcres: "",
		farmingExperience: "",
	});

	// Buyer-specific
	const [buyerForm, setBuyerForm] = useState({
		transportVehicle: "",
		businessExperience: "",
		companyName: "",
	});

	const handleCommonChange = (e) => {
		const { name, value } = e.target;
		if (["village", "district", "state", "pincode"].includes(name)) {
			setCommonForm((prev) => ({
				...prev,
				address: { ...prev.address, [name]: value },
			}));
		} else {
			setCommonForm((prev) => ({ ...prev, [name]: value }));
		}
	};

	const handleFarmerChange = (e) => {
		const { name, value } = e.target;
		setFarmerForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleBuyerChange = (e) => {
		const { name, value } = e.target;
		setBuyerForm((prev) => ({ ...prev, [name]: value }));
	};

	const validateEmail = (email) => /^\S+@\S+\.\S+$/.test(email);
	const validatePhone = (phone) => /^[0-9]{10}$/.test(phone);

	const validateCommonFields = () => {
		const { name, email, password, phone, age, gender, address } = commonForm;
		if (!name?.trim()) {
			setMessage({ type: "error", text: "Name is required" });
			return false;
		}
		if (!email?.trim()) {
			setMessage({ type: "error", text: "Email is required" });
			return false;
		}
		if (!validateEmail(email)) {
			setMessage({ type: "error", text: "Invalid email format" });
			return false;
		}
		if (!password?.trim()) {
			setMessage({ type: "error", text: "Password is required" });
			return false;
		}
		if (password.length < 6) {
			setMessage({
				type: "error",
				text: "Password must be at least 6 characters",
			});
			return false;
		}
		if (!phone?.trim()) {
			setMessage({ type: "error", text: "Phone is required" });
			return false;
		}
		if (!validatePhone(phone)) {
			setMessage({ type: "error", text: "Phone must be 10 digits" });
			return false;
		}
		if (!age || age < 1) {
			setMessage({ type: "error", text: "Valid age is required" });
			return false;
		}
		if (!gender) {
			setMessage({ type: "error", text: "Gender is required" });
			return false;
		}
		if (
			!address.village?.trim() ||
			!address.district?.trim() ||
			!address.state?.trim() ||
			!address.pincode?.trim()
		) {
			setMessage({ type: "error", text: "All address fields are required" });
			return false;
		}
		return true;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setMessage(null);
		if (!validateCommonFields()) return;
		setIsSubmitting(true);
		let payload = {
			...commonForm,
			role: selectedRole,
		};
		// Validate and add role-specific fields
		if (selectedRole === "farmer") {
			if (
				!farmerForm.soilType ||
				!farmerForm.noOfAcres ||
				!farmerForm.farmingExperience
			) {
				setMessage({ type: "error", text: "All farmer fields are required" });
				setIsSubmitting(false);
				return;
			}
			if (farmerForm.noOfAcres <= 0) {
				setMessage({
					type: "error",
					text: "Number of acres must be greater than 0",
				});
				setIsSubmitting(false);
				return;
			}
			payload = { ...payload, ...farmerForm };
		} else if (selectedRole === "buyer") {
			if (
				!buyerForm.transportVehicle ||
				!buyerForm.businessExperience ||
				!buyerForm.companyName
			) {
				setMessage({ type: "error", text: "All buyer fields are required" });
				setIsSubmitting(false);
				return;
			}
			payload = { ...payload, ...buyerForm };
		}
		try {
			// 🚀 ACTUAL API CALL
			const res = await api.post("/auth/register", payload);
			setIsSubmitting(false);
			if (res.data.success) {
				setMessage({
					type: "success",
					text: `Successfully registered as ${
						selectedRole === "farmer" ? "Farmer" : "Buyer"
					}!`,
				});
				// Optionally redirect to login or clear form
				setTimeout(() => {
					setCurrentStep("roleSelect");
					setSelectedRole("");
					setCommonForm({
						name: "",
						email: "",
						password: "",
						phone: "",
						age: "",
						gender: "",
						address: { village: "", district: "", state: "", pincode: "" },
					});
					setFarmerForm({
						soilType: "",
						noOfAcres: "",
						farmingExperience: "",
					});
					setBuyerForm({
						transportVehicle: "",
						businessExperience: "",
						companyName: "",
					});
					setMessage(null);
				}, 2000);
			} else {
				setMessage({
					type: "error",
					text: res.data.message || "Registration failed",
				});
			}
		} catch (err) {
			setIsSubmitting(false);
			setMessage({
				type: "error",
				text: err.response?.data?.message || "Registration failed",
			});
		}
	};

	if (currentStep === "roleSelect") {
		return (
			<div
				className="min-h-screen relative flex items-center justify-center p-4"
				style={{
					backgroundImage: "url('/farm.jpg')",
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			>
				<div className="min-h-screen bg-gradient-to-br from-green-0 to-emerald-50 flex items-center justify-center p-6">
					<div className="max-w-2xl w-full">
						<div className="text-center mb-12">
							<h1 className="text-4xl font-bold text-green-800 mb-3">
								Crop Connect
							</h1>
							<p className="text-gray-600 text-lg">
								Select your registration role
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<button
								onClick={() => {
									setSelectedRole("farmer");
									setCurrentStep("form");
								}}
								className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition border-2 border-transparent hover:border-green-500 text-left"
							>
								<Leaf className="w-12 h-12 text-green-600 mb-4" />
								<h2 className="text-2xl font-bold text-gray-800 mb-2">
									Farmer
								</h2>
								<p className="text-gray-600">Sell your agricultural produce</p>
							</button>

							<button
								onClick={() => {
									setSelectedRole("buyer");
									setCurrentStep("form");
								}}
								className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition border-2 border-transparent hover:border-green-500 text-left"
							>
								<Truck className="w-12 h-12 text-green-600 mb-4" />
								<h2 className="text-2xl font-bold text-gray-800 mb-2">Buyer</h2>
								<p className="text-gray-600">Buy fresh products directly</p>
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6 py-12">
			<div className="bg-white p-8 rounded-3xl shadow-2xl max-w-xl w-full border-4 border-green-500/10">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-3xl font-bold text-green-700">
						{selectedRole === "farmer" ? "Farmer" : "Buyer"} Registration
					</h2>
					<button
						onClick={() => setCurrentStep("roleSelect")}
						className="text-gray-500 hover:text-red-500 transition"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				{message && (
					<div
						className={`flex items-center p-4 mb-6 rounded-xl font-medium ${
							message.type === "success"
								? "bg-green-100 border border-green-500 text-green-700"
								: "bg-red-100 border border-red-500 text-red-700"
						}`}
					>
						{message.type === "success" ? (
							<CheckCircle className="w-5 h-5 mr-3" />
						) : (
							<XCircle className="w-5 h-5 mr-3" />
						)}
						{message.text}
					</div>
				)}

				<form onSubmit={handleSubmit}>
					<div className="mb-6 pb-6 border-b-2 border-gray-200">
						<h3 className="text-lg font-bold text-green-700 mb-4">
							Basic Information
						</h3>

						<FormInput
							label="Full Name"
							name="name"
							icon={User}
							placeholder="Your full name"
							value={commonForm.name}
							onChange={handleCommonChange}
							required
						/>

						<FormInput
							label="Email Address"
							name="email"
							type="email"
							icon={User}
							placeholder="you@example.com"
							value={commonForm.email}
							onChange={handleCommonChange}
							required
						/>

						<FormInput
							label="Password"
							name="password"
							type="password"
							icon={User}
							placeholder="Minimum 6 characters"
							value={commonForm.password}
							onChange={handleCommonChange}
							required
						/>

						<FormInput
							label="Phone Number"
							name="phone"
							type="tel"
							icon={Phone}
							placeholder="10-digit number"
							maxLength="10"
							value={commonForm.phone}
							onChange={handleCommonChange}
							required
						/>

						<FormInput
							label="Age"
							name="age"
							type="number"
							icon={Award}
							placeholder="Must be 18+"
							min="18"
							value={commonForm.age}
							onChange={handleCommonChange}
							required
						/>

						<FormInput
							label="Gender"
							name="gender"
							icon={User}
							value={commonForm.gender}
							onChange={handleCommonChange}
							required
						>
							<select>
								<option value="">Select Gender</option>
								<option value="male">Male</option>
								<option value="female">Female</option>
								<option value="other">Other</option>
							</select>
						</FormInput>
					</div>

					<div className="mb-6 pb-6 border-b-2 border-gray-200">
						<h3 className="text-lg font-bold text-green-700 mb-4">Address</h3>

						<FormInput
							label="Village"
							name="village"
							icon={Home}
							placeholder="Village name"
							value={commonForm.address.village}
							onChange={handleCommonChange}
							required
						/>

						<FormInput
							label="District"
							name="district"
							icon={Home}
							placeholder="District"
							value={commonForm.address.district}
							onChange={handleCommonChange}
							required
						/>

						<FormInput
							label="State"
							name="state"
							icon={Home}
							placeholder="State"
							value={commonForm.address.state}
							onChange={handleCommonChange}
							required
						/>

						<FormInput
							label="Pincode"
							name="pincode"
							icon={Home}
							placeholder="6-digit pincode"
							value={commonForm.address.pincode}
							onChange={handleCommonChange}
							required
						/>
					</div>

					{selectedRole === "farmer" && (
						<div className="mb-6 pb-6 border-b-2 border-gray-200">
							<h3 className="text-lg font-bold text-green-700 mb-4">
								Farming Details
							</h3>

							<FormInput
								label="Soil Type"
								name="soilType"
								icon={Leaf}
								placeholder="e.g., Loam, Red, Black, Clay"
								value={farmerForm.soilType}
								onChange={handleFarmerChange}
								required
							/>

							<FormInput
								label="Number of Acres"
								name="noOfAcres"
								type="number"
								icon={Home}
								min="0"
								placeholder="e.g., 2.5"
								value={farmerForm.noOfAcres}
								onChange={handleFarmerChange}
								required
							/>

							<FormInput
								label="Farming Experience (Years)"
								name="farmingExperience"
								type="number"
								icon={Award}
								min="0"
								placeholder="e.g., 10"
								value={farmerForm.farmingExperience}
								onChange={handleFarmerChange}
								required
							/>
						</div>
					)}

					{selectedRole === "buyer" && (
						<div className="mb-6 pb-6 border-b-2 border-gray-200">
							<h3 className="text-lg font-bold text-green-700 mb-4">
								Business Details
							</h3>

							<FormInput
								label="Transport Vehicle"
								name="transportVehicle"
								icon={Truck}
								placeholder="e.g., Truck, Van, Pickup"
								value={buyerForm.transportVehicle}
								onChange={handleBuyerChange}
								required
							/>

							<FormInput
								label="Business Experience (Years)"
								name="businessExperience"
								type="number"
								icon={Award}
								min="0"
								placeholder="e.g., 5"
								value={buyerForm.businessExperience}
								onChange={handleBuyerChange}
								required
							/>

							<FormInput
								label="Company/Market/Trader Name"
								name="companyName"
								icon={Users}
								placeholder="Business name"
								value={buyerForm.companyName}
								onChange={handleBuyerChange}
								required
							/>
						</div>
					)}

					<div className="flex gap-4">
						<button
							type="submit"
							disabled={isSubmitting}
							className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 rounded-full hover:from-green-700 hover:to-emerald-700 transition disabled:from-gray-400 disabled:to-gray-500"
						>
							{isSubmitting ? "Registering..." : "Register"}
						</button>
						<button
							type="button"
							onClick={() => setCurrentStep("roleSelect")}
							className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-full hover:bg-gray-300 transition"
						>
							Back
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default RegisterFB;
