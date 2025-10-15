// src/pages/CropDetails.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import api from "../config/api";

const isValidObjectId = (val) => /^[0-9a-fA-F]{24}$/.test(String(val || ""));

export default function CropDetails() {
	const { id } = useParams();
	const { user } = useAuth();

	const [crop, setCrop] = useState(null);
	const [loading, setLoading] = useState(true);
	const [quantity, setQuantity] = useState(1);

	useEffect(() => {
		const fetchCrop = async () => {
			try {
				if (!id) {
					toast.error("Invalid crop ID");
					setLoading(false);
					return;
				}
				if (!isValidObjectId(id)) {
					toast.error("Invalid crop ID format");
					setLoading(false);
					return;
				}
				const response = await api.get(`/crops/${id}`);
				if (response.data?.success) {
					setCrop(response.data.crop || null);
				} else {
					toast.error(response.data?.message || "Failed to load crop details");
				}
			} catch (error) {
				console.error("Error fetching crop:", error);
				toast.error("Failed to load crop details");
			} finally {
				setLoading(false);
			}
		};
		fetchCrop();
	}, [id]);

	const handleImageError = (e) => {
		e.currentTarget.onerror = null;
		e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
			crop?.cropName || "Crop"
		)}&size=400&background=random&color=fff&bold=true&length=2`;
	};

	const handleAddToCart = async () => {
		if (!user) {
			toast.error("Please login to add to cart");
			return;
		}
		if (!crop?._id) {
			toast.error("Invalid crop data");
			return;
		}
		try {
			if (
				quantity <= 0 ||
				(typeof crop.quantity === "number" && quantity > crop.quantity)
			) {
				toast.error("Invalid quantity");
				return;
			}

			const cartItem = {
				itemId: String(crop._id),
				name: crop.cropName,
				quantity: Number(quantity),
				// Store unit price in price field (your cart totals multiply price * quantity)
				price: Number(crop.pricePerUnit || 0),
				unit: crop.unit || "quintal",
				image:
					crop.image ||
					`https://ui-avatars.com/api/?name=${encodeURIComponent(
						crop.cropName || "Crop"
					)}&size=400&background=random&color=fff&bold=true&length=2`,
			};

			const res = await api.post("/cart/add", { items: [cartItem] });
			if (res.data?.success) {
				toast.success("🛒 Added to cart successfully!");
				// Optional: keep global badge in sync
				const nextCount = Array.isArray(res.data.cart)
					? res.data.cart.length
					: undefined;
				if (typeof nextCount === "number") {
					localStorage.setItem("cartCount", String(nextCount));
				}
			}
		} catch (error) {
			console.error("Cart error:", error);
			toast.error(error.response?.data?.message || "Failed to add to cart");
		}
	};

	const handleBuyNow = async () => {
		if (!user) {
			toast.error("Please login to purchase");
			return;
		}
		if (!crop?._id) {
			toast.error("Invalid crop data");
			return;
		}
		try {
			if (
				quantity <= 0 ||
				(typeof crop.quantity === "number" && quantity > crop.quantity)
			) {
				toast.error("Invalid quantity");
				return;
			}

			const totalAmount = Number(crop.pricePerUnit || 0) * Number(quantity);

			const res = await api.post("/orders/create", {
				orderType: "crop",
				items: [
					{
						itemId: String(crop._id),
						name: crop.cropName,
						quantity: Number(quantity),
						price: totalAmount, // per your order schema, price is line total per item
						image: crop.image || "",
					},
				],
				totalAmount,
			});

			if (res.data?.success) {
				toast.success("🎉 Order placed successfully!");
				// Optionally navigate to Buyer Dashboard Payments tab
				// navigate('/buyer-dashboard', { state: { tab: 'payments' } });
			}
		} catch (error) {
			console.error("Order error:", error); // Keep the original log
			console.error("Full error details:", error); // Log the full error object
			toast.error(error.response?.data?.message || "Failed to place order");

		}
	};

	if (loading) {
		return <div className="p-8 text-center">Loading...</div>;
	}

	// If URL id is invalid, show friendly fallback
	if (!isValidObjectId(id)) {
		return (
			<div className="max-w-xl mx-auto px-4 py-12 text-center">
				<h2 className="text-2xl font-bold mb-2">Invalid crop link</h2>
				<p className="text-gray-600 mb-6">
					The crop ID in the URL is not valid.
				</p>
				<Link
					to="/crops"
					className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
				>
					Back to Crops
				</Link>
			</div>
		);
	}

	if (!crop) {
		return (
			<div className="max-w-xl mx-auto px-4 py-12 text-center">
				<h2 className="text-2xl font-bold mb-2 text-red-600">
					Crop not found!
				</h2>
				<Link
					to="/crops"
					className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
				>
					Back to Crops
				</Link>
			</div>
		);
	}

	const availableQty = typeof crop.quantity === "number" ? crop.quantity : 0;
	const unit = crop.unit || "quintal";
	const unitPrice = Number(crop.pricePerUnit || 0);
	const lineTotal = unitPrice * Number(quantity);

	return (
		<div className="p-8 min-h-screen bg-gray-50">
			<div className="flex justify-between items-center mb-6">
				<Link
					to="/crops"
					className="text-blue-600 hover:underline inline-block"
				>
					← Back to Crops
				</Link>
			</div>

			<div className="flex flex-col lg:flex-row gap-8 mb-12">
				{/* Left: Image */}
				<div className="lg:w-1/2">
					<img
						src={
							crop.image ||
							`https://ui-avatars.com/api/?name=${encodeURIComponent(
								crop.cropName || "Crop"
							)}&size=400&background=random&color=fff&bold=true&length=2`
						}
						alt={crop.cropName || "Crop"}
						className="w-full h-96 object-cover rounded-xl shadow-md"
						onError={handleImageError}
					/>
				</div>

				{/* Right: Details */}
				<div className="lg:w-1/2 space-y-4">
					<h2 className="text-3xl font-bold text-gray-800">{crop.cropName}</h2>

					<div className="border-t border-b py-4 space-y-2">
						<div className="grid grid-cols-2 gap-2 text-sm">
							<p>
								<span className="font-semibold">Seller:</span>{" "}
								{crop.seller?.name || "Unknown"}
							</p>
							<p>
								<span className="font-semibold">Contact:</span>{" "}
								{crop.seller?.phone || "N/A"}
							</p>
							<p>
								<span className="font-semibold">State:</span>{" "}
								{crop.location?.state || "N/A"}
							</p>
							<p>
								<span className="font-semibold">District:</span>{" "}
								{crop.location?.district || "N/A"}
							</p>
							<p>
								<span className="font-semibold">Market:</span>{" "}
								{crop.location?.market || "N/A"}
							</p>
							<p>
								<span className="font-semibold">Variety:</span>{" "}
								{crop.variety || "—"}
							</p>
							<p>
								<span className="font-semibold">Grade:</span>{" "}
								{crop.grade || "—"}
							</p>
							<p>
								<span className="font-semibold">Arrival Date:</span>{" "}
								{crop.arrivalDate
									? new Date(crop.arrivalDate).toLocaleDateString()
									: "Not specified"}
							</p>
						</div>
					</div>

					{/* Price */}
					<div className="bg-green-50 p-4 rounded-lg">
						<div className="flex justify-between items-center border-t pt-2">
							<span className="text-lg font-bold text-gray-800">
								Price per {unit}:
							</span>
							<span className="text-2xl font-bold text-green-700">
								₹{unitPrice}
							</span>
						</div>
					</div>

					{/* Quantity selector */}
					<div className="flex items-center gap-4">
						<label className="font-semibold">Quantity ({unit}):</label>
						<div className="flex items-center border rounded-lg">
							<button
								onClick={() => setQuantity((q) => Math.max(1, Number(q) - 1))}
								className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-l-lg"
								disabled={!availableQty}
							>
								-
							</button>
							<input
								type="number"
								value={quantity}
								onChange={(e) =>
									setQuantity(
										Math.max(
											1,
											Math.min(
												availableQty || 1,
												parseInt(e.target.value, 10) || 1
											)
										)
									)
								}
								className="w-20 text-center border-x py-2"
								min="1"
								max={availableQty || 1}
								disabled={!availableQty}
							/>
							<button
								onClick={() =>
									setQuantity((q) => Math.min(availableQty || 1, Number(q) + 1))
								}
								className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-r-lg"
								disabled={!availableQty}
							>
								+
							</button>
						</div>
					</div>

					{/* Available */}
					<div className="bg-gray-100 p-4 rounded-lg">
						<div className="flex justify-between items-center">
							<span className="text-lg font-semibold">Available Quantity:</span>
							<span className="text-2xl font-bold text-blue-700">
								{availableQty} {unit}
							</span>
						</div>
					</div>

					{/* Total */}
					<div className="bg-gray-100 p-4 rounded-lg">
						<div className="flex justify-between items-center">
							<span className="text-lg font-semibold">Total Amount:</span>
							<span className="text-2xl font-bold text-green-700">
								₹{lineTotal.toLocaleString()}
							</span>
						</div>
					</div>

					{/* OOS */}
					{!availableQty && (
						<p className="text-red-500 text-center font-semibold mt-2">
							Currently Out of Stock
						</p>
					)}

					{/* Actions */}
					<div className="flex gap-4 pt-4">
						<button
							onClick={handleAddToCart}
							className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
							disabled={!availableQty}
						>
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5m1.1-5L15 13m0 0l1.1 5M7 13v4a2 2 0 104 0V13"
								/>
							</svg>
							Add to Cart
						</button>
						<button
							onClick={handleBuyNow}
							className="flex-1 bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition"
							disabled={!availableQty}
						>
							Buy Now
						</button>
					</div>

					{/* Contact Seller */}
					<a
						href={crop.seller?.phone ? `tel:${crop.seller.phone}` : "#"}
						onClick={(e) => {
							if (!crop.seller?.phone) {
								e.preventDefault();
								toast.error("Seller phone not available");
							}
						}}
						className="block w-full text-center bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-900 transition flex items-center justify-center gap-2"
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
							/>
						</svg>
						Contact Seller
					</a>
				</div>
			</div>
		</div>
	);
}
