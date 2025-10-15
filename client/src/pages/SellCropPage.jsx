import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../config/api";
import {
	DollarSign,
	Scale,
	Tag,
	Landmark,
	MapPin,
	Trello,
	Image as ImageIcon,
	ArrowLeft,
} from "lucide-react";

// Reusable input
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
	<div className="relative">
		<label className="block text-sm font-medium text-gray-700 mb-1">
			{label} {required && <span className="text-red-500">*</span>}
		</label>
		<div className="flex items-center border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-green-500 transition duration-150 bg-white">
			{Icon && <Icon className="w-5 h-5 text-gray-400 ml-3" />}
			<input
				type={type}
				name={name}
				value={value ?? ""}
				onChange={onChange}
				className="w-full p-3 rounded-xl focus:outline-none border-0 bg-transparent text-gray-800"
				placeholder={placeholder}
				required={required}
				{...rest}
			/>
			{unit && (
				<span className="mr-3 text-sm text-gray-500 font-medium">{unit}</span>
			)}
		</div>
	</div>
);

export default function SellCropPage() {
	const navigate = useNavigate();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [message, setMessage] = useState("");

	// Match backend schema exactly
	const [form, setForm] = useState({
		cropName: "",
		variety: "",
		pricePerUnit: "",
		unit: "quintal",
		quantity: "",
		location: { village: "", district: "", state: "", market: "" },
		arrivalDate: "",
		grade: "",
		image: "", // URL or base64 string
	});

	const handleChange = (e) => {
		const { name, value, files } = e.target;

		// File input -> set image as base64 for quick upload (optional)
		if (name === "imageFile" && files?.[0]) {
			const file = files[0];
			const reader = new FileReader();
			reader.onload = () => {
				setForm((prev) => ({ ...prev, image: reader.result }));
			};
			reader.readAsDataURL(file);
			return;
		}

		if (name.startsWith("location.")) {
			const key = name.split(".")[1];
			setForm((prev) => ({
				...prev,
				location: { ...prev.location, [key]: value },
			}));
		} else {
			setForm((prev) => ({ ...prev, [name]: value }));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setMessage("");
		setIsSubmitting(true);
		try {
			// Required by schema
			if (!form.cropName || !form.pricePerUnit || !form.quantity) {
				toast.error("Please fill crop name, price per unit, and quantity");
				setIsSubmitting(false);
				return;
			}

			const payload = {
				cropName: form.cropName,
				variety: form.variety || undefined,
				pricePerUnit: Number(form.pricePerUnit),
				unit: form.unit || "quintal",
				quantity: Number(form.quantity),
				location: form.location,
				arrivalDate: form.arrivalDate || undefined,
				grade: form.grade || undefined,
				image: form.image || undefined,
			};

			const res = await api.post("/crops", payload); // protected: farmer role
			if (res.data?.success) {
				toast.success("Crop listed successfully");
				setMessage("Crop listed successfully");
				navigate("/crops");
			} else {
				throw new Error(res.data?.message || "Failed to list crop");
			}
		} catch (error) {
			const msg =
				error.response?.data?.message || error.message || "Failed to list crop";
			toast.error(msg);
			setMessage(`Error: ${msg}`);
		} finally {
			setIsSubmitting(false);
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
					type="button"
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
							message.startsWith("Error")
								? "bg-red-100 border-red-500 text-red-700"
								: "bg-green-100 border-green-500 text-green-700"
						} border-l-4 p-4 mb-6 rounded-lg font-medium`}
						role="alert"
					>
						{message}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Crop core fields */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<InputField
							label="Crop Name / Type"
							name="cropName"
							placeholder="e.g., Wheat, Basmati Rice"
							icon={Tag}
							value={form.cropName}
							onChange={handleChange}
							required
						/>
						<InputField
							label="Variety"
							name="variety"
							placeholder="e.g., Sharbati"
							icon={Trello}
							value={form.variety}
							onChange={handleChange}
						/>
						<InputField
							label="Price per Unit"
							name="pricePerUnit"
							type="number"
							placeholder="2500"
							icon={DollarSign}
							unit="₹ / unit"
							value={form.pricePerUnit}
							onChange={handleChange}
							required
							min="0"
							step="0.01"
						/>
						<InputField
							label="Quantity Available"
							name="quantity"
							type="number"
							placeholder="50"
							icon={Scale}
							unit={form.unit}
							value={form.quantity}
							onChange={handleChange}
							required
							min="1"
							step="1"
						/>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Unit
							</label>
							<select
								name="unit"
								value={form.unit}
								onChange={handleChange}
								className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 bg-white"
							>
								<option value="quintal">quintal</option>
								<option value="kg">kg</option>
								<option value="ton">ton</option>
							</select>
						</div>
						<InputField
							label="Arrival Date"
							name="arrivalDate"
							type="date"
							placeholder=""
							icon={Landmark}
							value={form.arrivalDate}
							onChange={handleChange}
						/>
						<InputField
							label="Grade"
							name="grade"
							placeholder="e.g., A, B"
							icon={Landmark}
							value={form.grade}
							onChange={handleChange}
						/>
						{/* Image: URL or File */}
						<InputField
							label="Image URL"
							name="image"
							type="url"
							placeholder="https://..."
							icon={ImageIcon}
							value={form.image}
							onChange={handleChange}
						/>
						<div className="relative">
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Or Upload Image
							</label>
							<div className="flex items-center border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-green-500 transition duration-150 bg-white p-2">
								<ImageIcon className="w-5 h-5 text-gray-400 ml-1 mr-2" />
								<input
									type="file"
									name="imageFile"
									accept="image/*"
									onChange={handleChange}
									className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
								/>
							</div>
						</div>
					</div>

					{/* Location */}
					<div className="pt-4 border-t border-gray-200 space-y-4">
						<h3 className="text-xl font-semibold text-gray-700">
							Pickup Location
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<InputField
								label="Village / Town"
								name="location.village"
								placeholder="Village/Town"
								icon={MapPin}
								value={form.location.village}
								onChange={handleChange}
							/>
							<InputField
								label="District"
								name="location.district"
								placeholder="District"
								icon={MapPin}
								value={form.location.district}
								onChange={handleChange}
							/>
							<InputField
								label="State"
								name="location.state"
								placeholder="State"
								icon={MapPin}
								value={form.location.state}
								onChange={handleChange}
							/>
							<InputField
								label="Nearest Market"
								name="location.market"
								placeholder="Market"
								icon={MapPin}
								value={form.location.market}
								onChange={handleChange}
							/>
						</div>
					</div>

					{/* Submit */}
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
