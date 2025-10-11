// src/pages/SellCropPage.jsx
import React, { useState } from "react";
import { cropService } from "../services/cropService";
import { useNavigate } from "react-router-dom";
import {
	DollarSign,
	Scale,
	Tag,
	Landmark,
	MapPin,
	Phone,
	Trello,
	Image,
	ArrowLeft,
} from "lucide-react";

// ✅ MOVE InputField OUTSIDE of SellCropPage component
const InputField = ({
	label,
	name,
	type = "text",
	placeholder,
	icon: Icon,
	required = false,
	unit,
	value,
	onChange,
}) => (
	<div className="relative">
		<label className="block text-sm font-medium text-gray-700 mb-1">
			{label} {required && <span className="text-red-500">*</span>}
		</label>
		<div className="flex items-center border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-green-500 transition duration-150 bg-white">
			{Icon && <Icon className="w-5 h-5 text-gray-400 ml-3" />}
			<input
				type={type}
				name={name}
				value={value || ""}
				onChange={onChange}
				className="w-full p-3 rounded-xl focus:outline-none border-0 bg-transparent text-gray-800"
				placeholder={placeholder}
				required={required}
			/>
			{unit && (
				<span className="mr-3 text-sm text-gray-500 font-medium">{unit}</span>
			)}
		</div>
	</div>
);

function SellCropPage() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		cropPic: null,
		priceQuintal: "",
		quantity: "",
		cropType: "",
		soilType: "",
		area: "",
		address: "",
		mobile: "",
		payment: "",
	});
	const [isSubmitting] = useState(false);
	const [message] = useState("");

	const handleChange = (e) => {
		const { name, value, files } = e.target;
		if (name === "cropPic") {
			setFormData({ ...formData, cropPic: files[0] });
		} else {
			setFormData({ ...formData, [name]: value });
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			const result = await cropService.createCrop(formData);

			if (result.success) {
				alert("Crop listed successfully! 🌾");
				setFormData({
					cropName: "",
					variety: "",
					quantity: "",
					unit: "quintal",
					pricePerUnit: "",
					location: {
						village: "",
						district: "",
						state: "",
						pincode: "",
					},
					harvestDate: "",
					quality: "Standard",
					description: "",
					contactNumber: "",
				});
				navigate("/crops");
			}
		} catch (error) {
			alert(
				error.response?.data?.message ||
					"Failed to list crop. Please try again."
			);
		}
	};


	return (
		<div
			className="min-h-screen flex items-center justify-center bg-gray-100 p-4 md:p-8"
			style={{
				backgroundImage:
					"linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=2070')",
				backgroundRepeat: "no-repeat",
				backgroundSize: "cover",
				backgroundPosition: "center",
			}}
		>
			<div className="w-full max-w-2xl bg-white/95 rounded-2xl shadow-2xl p-6 md:p-10 border border-green-200 backdrop-blur-sm">
				{/* Back Button */}
				<button
					onClick={() => navigate(-1)}
					className="flex items-center gap-2 text-green-700 hover:text-green-800 mb-6 font-medium transition-colors"
				>
					<ArrowLeft className="w-5 h-5" />
					Back to Home
				</button>

				<header className="text-center mb-8">
					<h2 className="font-extrabold text-4xl text-green-700">
						List Your Crop for Sale
					</h2>
					<p className="text-gray-500 mt-2">
						Reach buyers easily by providing accurate details.
					</p>
				</header>

				{message && (
					<div
						className={`${
							message.includes("Error")
								? "bg-red-100 border-red-500 text-red-700"
								: "bg-green-100 border-green-500 text-green-700"
						} border-l-4 p-4 mb-6 rounded-lg font-medium`}
						role="alert"
					>
						{message}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Crop Information Section */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<InputField
							label="Price per Quintal"
							name="priceQuintal"
							type="number"
							placeholder="2500"
							icon={DollarSign}
							unit="₹ RS"
							value={formData.priceQuintal}
							onChange={handleChange}
							required
						/>
						<InputField
							label="Quantity Available (Quintal)"
							name="quantity"
							type="number"
							placeholder="50"
							icon={Scale}
							unit="Quintal"
							value={formData.quantity}
							onChange={handleChange}
							required
						/>
						<InputField
							label="Crop Type"
							name="cropType"
							type="text"
							placeholder="e.g., Wheat, Basmati Rice"
							icon={Tag}
							value={formData.cropType}
							onChange={handleChange}
							required
						/>
						<InputField
							label="Soil Type"
							name="soilType"
							type="text"
							placeholder="e.g., Alluvial, Black Cotton"
							icon={Trello}
							value={formData.soilType}
							onChange={handleChange}
						/>
						<InputField
							label="Area Harvested"
							name="area"
							type="number"
							placeholder="10"
							icon={Landmark}
							unit="Acres"
							value={formData.area}
							onChange={handleChange}
						/>
						<div className="relative">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Crop Image <span className="text-red-500">*</span>
							</label>
							<div className="flex items-center border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-green-500 transition duration-150 bg-white p-2">
								<Image className="w-5 h-5 text-gray-400 ml-1 mr-2" />
								<input
									type="file"
									name="cropPic"
									accept="image/*"
									onChange={handleChange}
									className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
									required
								/>
							</div>
							{formData.cropPic && (
								<p className="text-xs text-gray-500 mt-1 truncate">
									File: {formData.cropPic.name}
								</p>
							)}
						</div>
					</div>

					{/* Contact & Payment Section */}
					<div className="pt-4 border-t border-gray-200 space-y-4">
						<h3 className="text-xl font-semibold text-gray-700">
							Contact & Logistics
						</h3>

						<InputField
							label="Mobile Number"
							name="mobile"
							type="tel"
							placeholder="9876543210"
							icon={Phone}
							value={formData.mobile}
							onChange={handleChange}
							required
						/>
						<InputField
							label="Full Address (Location for pickup)"
							name="address"
							type="text"
							placeholder="Village/Town, District, State"
							icon={MapPin}
							value={formData.address}
							onChange={handleChange}
							required
						/>

						<div className="relative">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Payment Details
							</label>
							<div className="flex items-center border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-green-500 transition duration-150 bg-white">
								<DollarSign className="w-5 h-5 text-gray-400 ml-3" />
								<input
									type="text"
									name="payment"
									value={formData.payment}
									onChange={handleChange}
									className="w-full p-3 rounded-xl focus:outline-none border-0 bg-transparent text-gray-800"
									placeholder="UPI ID, Bank Account Number, etc."
								/>
							</div>
						</div>
					</div>

					{/* Submit Button */}
					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full py-4 rounded-xl font-bold text-lg bg-green-600 text-white shadow-xl hover:bg-green-700 transition duration-300 active:scale-[0.98] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
								<span>Submitting...</span>
							</>
						) : (
							<span>Submit Crop Listing</span>
						)}
					</button>
				</form>
			</div>
		</div>
	);
}

export default SellCropPage;
