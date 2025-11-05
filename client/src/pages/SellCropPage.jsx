import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../config/api";
import { useAuth } from "../context/AuthContext"; // ✅ ADDED
import {
	IndianRupee,
	Scale,
	Tag,
	Landmark,
	MapPin,
	Trello,
	Image as ImageIcon,
	ArrowLeft,
	Loader,
} from "lucide-react";

// ========================================
// HARDCODED INDIAN STATES & DISTRICTS
// ========================================
const INDIAN_STATES_DISTRICTS = {
	"Andhra Pradesh": [
		"Visakhapatnam",
		"Vijayawada",
		"Guntur",
		"Nellore",
		"Kurnool",
	],
	"Arunachal Pradesh": ["Itanagar", "Tawang", "Ziro", "Pasighat", "Tezu"],
	Assam: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon"],
	Bihar: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"],
	Chhattisgarh: ["Raipur", "Bilaspur", "Durg", "Korba", "Rajnandgaon"],
	Goa: ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
	Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
	Haryana: ["Chandigarh", "Faridabad", "Gurgaon", "Panipat", "Ambala"],
	"Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Kullu"],
	Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar"],
	Karnataka: ["Bangalore", "Mysore", "Mangalore", "Hubli", "Belgaum"],
	Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
	"Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
	Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
	Manipur: ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Ukhrul"],
	Meghalaya: ["Shillong", "Tura", "Jowai", "Nongpoh", "Williamnagar"],
	Mizoram: ["Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib"],
	Nagaland: ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha"],
	Odisha: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur"],
	Punjab: ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
	Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"],
	Sikkim: ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Rangpo"],
	"Tamil Nadu": [
		"Chennai",
		"Coimbatore",
		"Madurai",
		"Tiruchirappalli",
		"Salem",
	],
	Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar"],
	Tripura: ["Agartala", "Udaipur", "Dharmanagar", "Kailashahar", "Ambassa"],
	"Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi"],
	Uttarakhand: ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur"],
	"West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
};

// Reusable Input Component
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
	...rest
}) => (
	<div>
		<label className="block text-sm font-medium text-gray-700 mb-2">
			{label} {required && <span className="text-red-500">*</span>}
		</label>
		<div className="relative">
			{Icon && (
				<Icon
					className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
					size={20}
				/>
			)}
			<input
				type={type}
				name={name}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				required={required}
				className={`w-full ${
					Icon ? "pl-10" : "pl-3"
				} pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
				{...rest}
			/>
			{unit && (
				<span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
					{unit}
				</span>
			)}
		</div>
	</div>
);

function SellCropPage() {
	const navigate = useNavigate();
	const { user } = useAuth(); // ✅ ADDED: Get logged-in user
	const [loading, setLoading] = useState(false);
	const [selectedState, setSelectedState] = useState("");
	const [districts, setDistricts] = useState([]);

	const [cropData, setCropData] = useState({
		cropName: "",
		variety: "",
		quantity: "",
		unit: "quintal",
		pricePerUnit: "",
		location: "",
		state: "",
		district: "",
		description: "",
		images: [],
	});

	// ✅ Check if user is logged in
	useEffect(() => {
		if (!user) {
			toast.error("Please login as a farmer to sell crops");
			navigate("/login");
		}
	}, [user, navigate]);

	// ✅ Handle state change
	const handleStateChange = (e) => {
		const state = e.target.value;
		setSelectedState(state);
		setDistricts(INDIAN_STATES_DISTRICTS[state] || []);
		setCropData({
			...cropData,
			state: state,
			district: "", // Reset district
		});
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setCropData({ ...cropData, [name]: value });
	};

	const handleImageUpload = (e) => {
		const files = Array.from(e.target.files);
		if (files.length > 5) {
			toast.error("Maximum 5 images allowed");
			return;
		}

		const readers = files.map((file) => {
			return new Promise((resolve) => {
				const reader = new FileReader();
				reader.onloadend = () => resolve(reader.result);
				reader.readAsDataURL(file);
			});
		});

		Promise.all(readers).then((images) => {
			setCropData({ ...cropData, images });
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// ✅ Validation
		if (!cropData.state || !cropData.district) {
			toast.error("Please select state and district");
			return;
		}

		if (cropData.images.length === 0) {
			toast.error("Please upload at least one image");
			return;
		}

		setLoading(true);

		try {
			// ✅ FIXED: Add farmer/seller ID from logged-in user
			const payload = {
				...cropData,
				farmer: user._id || user.id, // ✅ This fixes the "farmer is required" error
				seller: user._id || user.id, // ✅ Also add seller (same as farmer)
			};

			console.log("Submitting crop data:", payload);

			const response = await api.post("/crops", payload);

			if (response.data.success) {
				toast.success("Successfully listed crop");
				navigate("/farmer-dashboard");
			}
		} catch (error) {
			console.error("Submit error:", error);
			toast.error(error.response?.data?.message || "Failed to list crop");
		} finally {
			setLoading(false);
		}
	};

	// ✅ Show loading if user not loaded
	if (!user) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader className="animate-spin text-green-600" size={40} />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-3xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<button
						onClick={() => navigate(-1)}
						className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
					>
						<ArrowLeft size={20} />
						Back
					</button>
					<h1 className="text-4xl font-bold text-gray-900">
						List Your Crop for Sale
					</h1>
					<p className="text-gray-600 mt-2">
						Fill in the details below to list your crop
					</p>
				</div>

				{/* Form */}
				<form
					onSubmit={handleSubmit}
					className="bg-white rounded-2xl shadow-xl p-8"
				>
					<div className="space-y-6">
						{/* Crop Details */}
						<div>
							<h2 className="text-xl font-semibold text-gray-900 mb-4">
								Crop Details
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<InputField
									label="Crop Name"
									name="cropName"
									placeholder="e.g., Wheat, Rice, Cotton"
									icon={Tag}
									required
									value={cropData.cropName}
									onChange={handleChange}
								/>
								<InputField
									label="Variety"
									name="variety"
									placeholder="e.g., Basmati, Desi"
									icon={Trello}
									required
									value={cropData.variety}
									onChange={handleChange}
								/>
							</div>
						</div>

						{/* Quantity & Price */}
						<div>
							<h2 className="text-xl font-semibold text-gray-900 mb-4">
								Quantity & Pricing
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<InputField
									label="Quantity"
									name="quantity"
									type="number"
									placeholder="100"
									icon={Scale}
									required
									value={cropData.quantity}
									onChange={handleChange}
									min="1"
								/>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Unit <span className="text-red-500">*</span>
									</label>
									<select
										name="unit"
										value={cropData.unit}
										onChange={handleChange}
										required
										className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
									>
										<option value="quintal">Quintal</option>
										<option value="kg">Kilogram</option>
										<option value="ton">Ton</option>
									</select>
								</div>
								<InputField
									label="Price per Unit"
									name="pricePerUnit"
									type="number"
									placeholder="2000"
									icon={IndianRupee}
									required
									unit="₹"
									value={cropData.pricePerUnit}
									onChange={handleChange}
									min="1"
								/>
							</div>
						</div>

						{/* Location */}
						<div>
							<h2 className="text-xl font-semibold text-gray-900 mb-4">
								Location
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								{/* State */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										State <span className="text-red-500">*</span>
									</label>
									<select
										value={selectedState}
										onChange={handleStateChange}
										required
										className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
									>
										<option value="">Select State</option>
										{Object.keys(INDIAN_STATES_DISTRICTS).map((state) => (
											<option key={state} value={state}>
												{state}
											</option>
										))}
									</select>
								</div>

								{/* District */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										District <span className="text-red-500">*</span>
									</label>
									<select
										name="district"
										value={cropData.district}
										onChange={handleChange}
										required
										disabled={!selectedState}
										className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
									>
										<option value="">Select District</option>
										{districts.map((district) => (
											<option key={district} value={district}>
												{district}
											</option>
										))}
									</select>
								</div>

								{/* Village/Location */}
								<InputField
									label="Village/Location"
									name="location"
									placeholder="Village name"
									icon={MapPin}
									required
									value={cropData.location}
									onChange={handleChange}
								/>
							</div>
						</div>

						{/* Description */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Description
							</label>
							<textarea
								name="description"
								value={cropData.description}
								onChange={handleChange}
								placeholder="Describe the quality, farming practices, etc."
								rows="4"
								className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
							/>
						</div>

						{/* Images */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Upload Images <span className="text-red-500">*</span>
							</label>
							<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
								<ImageIcon className="mx-auto text-gray-400 mb-2" size={48} />
								<p className="text-gray-600 mb-2">
									Upload up to 5 images (JPG, PNG)
								</p>
								<input
									type="file"
									accept="image/*"
									multiple
									onChange={handleImageUpload}
									className="hidden"
									id="imageUpload"
								/>
								<label
									htmlFor="imageUpload"
									className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-green-700"
								>
									Choose Images
								</label>
								{cropData.images.length > 0 && (
									<p className="text-green-600 mt-2">
										{cropData.images.length} image(s) selected
									</p>
								)}
							</div>

							{/* Image Previews */}
							{cropData.images.length > 0 && (
								<div className="grid grid-cols-3 gap-4 mt-4">
									{cropData.images.map((img, idx) => (
										<img
											key={idx}
											src={img}
											alt={`Preview ${idx + 1}`}
											className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
										/>
									))}
								</div>
							)}
						</div>

						{/* Submit Button */}
						<div className="flex gap-4 pt-6">
							<button
								type="button"
								onClick={() => navigate(-1)}
								className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 font-semibold"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={loading}
								className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
							>
								{loading ? (
									<>
										<Loader className="animate-spin" size={20} />
										Listing...
									</>
								) : (
									"List Crop"
								)}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}

export default SellCropPage;
