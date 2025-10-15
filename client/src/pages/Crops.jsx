// src/pages/Crops.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../config/api";
import toast from "react-hot-toast";

const isValidObjectId = (val) => /^[0-9a-fA-F]{24}$/.test(String(val || ""));

const placeholderFor = (name) =>
	`https://ui-avatars.com/api/?name=${encodeURIComponent(
		name || "Crop"
	)}&size=400&background=random&color=fff&bold=true&length=2`;

const handleImgError = (e, name) => {
	e.currentTarget.onerror = null;
	e.currentTarget.src = placeholderFor(name);
};

export default function Crops() {
	const [crops, setCrops] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchCrops = async () => {
			try {
				const res = await api.get("/crops");
				if (res.data?.success) {
					setCrops(res.data.crops || []);
				} else {
					toast.error(res.data?.message || "Failed to load crops");
				}
			} catch (error) {
				console.error("Error fetching crops:", error);
				toast.error("Failed to load crops");
			} finally {
				setLoading(false);
			}
		};
		fetchCrops();
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
			</div>
		);
	}

	const safeCrops = Array.isArray(crops) ? crops : [];

	return (
		<div className="max-w-6xl mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-2">Fresh Crops</h1>
			<p className="text-gray-600 mb-6">
				Fresh crops from verified sellers across India
			</p>

			{safeCrops.length === 0 ? (
				<p className="text-gray-600">No crops found.</p>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{safeCrops.map((crop) => {
						const validId = isValidObjectId(crop?._id);
						const unitPrice = Number(crop?.pricePerUnit || 0);
						const unit = crop?.unit || "quintal";
						return (
							<div
								key={
									crop?._id || `${crop?.cropName || "Crop"}-${Math.random()}`
								}
								className="p-4 border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition"
							>
								{/* Image */}
								<div className="mb-3">
									<img
										src={crop?.image || placeholderFor(crop?.cropName)}
										alt={crop?.cropName || "Crop"}
										onError={(e) => handleImgError(e, crop?.cropName)}
										className="w-full h-48 object-cover rounded-md bg-gray-100"
										loading="lazy"
									/>
								</div>

								{/* Title and meta */}
								<h3 className="text-xl font-semibold">
									{crop?.cropName || "Unnamed Crop"}
								</h3>

								<div className="mt-1 text-sm text-gray-600">
									<div>Seller: {crop?.seller?.name || "Unknown Seller"}</div>
									{crop?.location && (
										<div>
											Location: {crop.location.district || "N/A"},{" "}
											{crop.location.state || "N/A"}
										</div>
									)}
								</div>

								<p className="mt-2 font-bold">
									₹{unitPrice.toLocaleString()}/{unit}
								</p>

								{/* Actions */}
								<div className="mt-4">
									{validId ? (
										<Link
											to={`/crops/${crop._id}`}
											className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
										>
											View Details
										</Link>
									) : (
										<button
											type="button"
											disabled
											className="inline-block px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
											title="Invalid crop ID"
										>
											View Details
										</button>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
