/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../config/api";
import toast from "react-hot-toast";
import {
	ArrowLeft,
	ShoppingCart,
	CreditCard,
	Truck,
	Calendar,
	Phone,
	MapPin,
	Package,
	Loader,
} from "lucide-react";

function CropDetails() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { user } = useAuth();

	const [crop, setCrop] = useState(null);
	const [quantity, setQuantity] = useState(1);
	const [loading, setLoading] = useState(true);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [processing, setProcessing] = useState(false);

	const handleImgError = (e) => {
		e.currentTarget.onerror = null;
		e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
			crop?.cropName || "Crop"
		)}&size=400&background=random&color=fff&bold=true&length=2`;
	};

	// Vehicle & Pickup Details
	const [vehicleDetails, setVehicleDetails] = useState({
		vehicleType: "",
		vehicleNumber: "",
		driverName: "",
		driverPhone: "",
	});

	const [pickupSchedule, setPickupSchedule] = useState({
		date: "",
		timeSlot: "morning",
	});

	const [paymentMethod, setPaymentMethod] = useState("razorpay");

	useEffect(() => {
		fetchCropDetails();
	}, [id]);

	const fetchCropDetails = async () => {
		try {
			const { data } = await api.get(`/crops/${id}`);
			setCrop(data.crop);
		} catch (error) {
			console.error("Fetch crop error:", error);
			toast.error("Failed to load crop details");
		} finally {
			setLoading(false);
		}
	};

	// ✅ FIX 1: Use crop.pricePerUnit instead of crop.pricePerQuintal
	const pricePerUnit = crop?.pricePerUnit || 0;
	const totalAmount = crop ? quantity * pricePerUnit : 0;

	// ✅ UPDATED: Add to Cart with redirect to cart tab
	const handleAddToCart = async () => {
		if (!user) {
			toast.error("Please login to add items to cart");
			navigate("/login");
			return;
		}

		if (quantity > crop.quantity) {
			toast.error(`Only ${crop.quantity} quintals available`);
			return;
		}

		try {
			// ✅ FIXED: Send correct format expected by backend
			const res = await api.post("/cart/add", {
				items: [
					{
						itemId: String(crop._id),
						quantity: Number(quantity),
					},
				],
			});

			if (res.data?.success) {
				toast.success("✅ Added to cart successfully!");

				// ✅ NEW: Redirect to cart tab in buyer dashboard
				navigate("/buyer-dashboard?tab=cart");
			}
		} catch (error) {
			console.error("Add to cart error:", error);
			toast.error(error.response?.data?.message || "Failed to add to cart");
		}
	};

	// Buy Now - Show Payment Modal
	const handleBuyNow = () => {
		if (!user) {
			toast.error("Please login to purchase");
			navigate("/login");
			return;
		}

		if (quantity > crop.quantity) {
			toast.error(`Only ${crop.quantity} quintals available`);
			return;
		}

		setShowPaymentModal(true);
	};

	// Process Order with Razorpay
	const handleRazorpayPayment = async () => {
		// Validate vehicle details
		if (
			!vehicleDetails.vehicleType ||
			!vehicleDetails.vehicleNumber ||
			!vehicleDetails.driverName ||
			!vehicleDetails.driverPhone ||
			!pickupSchedule.date
		) {
			toast.error("Please fill all vehicle and pickup details");
			return;
		}

		setProcessing(true);

		try {
			// Step 1: Create Razorpay order
			const { data: orderData } = await api.post(
				"/orders/create-razorpay-order",
				{
					amount: totalAmount,
				}
			);

			// Step 2: Open Razorpay checkout
			const options = {
				key: import.meta.env.VITE_RAZORPAY_KEY_ID,
				amount: orderData.order.amount,
				currency: orderData.order.currency,
				name: "Crop Connect",
				description: `Purchase ${crop.cropName}`,
				order_id: orderData.order.id,
				handler: async function (response) {
					// Step 3: Create order after successful payment
					await createOrder({
						razorpayOrderId: response.razorpay_order_id,
						razorpayPaymentId: response.razorpay_payment_id,
						razorpaySignature: response.razorpay_signature,
					});
				},
				prefill: {
					name: user.name,
					email: user.email,
					contact: user.phone,
				},
				theme: {
					color: "#10b981",
				},
			};

			const razorpayInstance = new window.Razorpay(options);
			razorpayInstance.open();

			razorpayInstance.on("payment.failed", function (response) {
				toast.error("Payment failed! Please try again.");
				setProcessing(false);
			});
		} catch (error) {
			console.error("Razorpay error:", error);
			toast.error("Payment initialization failed");
			setProcessing(false);
		}
	};

	// Process Order with Pay After Delivery
	const handlePayAfterDelivery = async () => {
		// Validate vehicle details
		if (
			!vehicleDetails.vehicleType ||
			!vehicleDetails.vehicleNumber ||
			!vehicleDetails.driverName ||
			!vehicleDetails.driverPhone ||
			!pickupSchedule.date
		) {
			toast.error("Please fill all vehicle and pickup details");
			return;
		}

		await createOrder({});
	};

	// ✅ FIX 3: Updated createOrder to use pricePerUnit
			const createOrder = async (paymentDetails) => {
				try {
					setProcessing(true);

					const addr = user.address || {};
					const fullAddress = `${addr.village || ""}, ${addr.district || ""}, ${addr.state || ""} ${addr.pincode || ""}`.trim();

					const orderData = {
						items: [
					{
						crop: crop._id,
						quantity,
						pricePerUnit: pricePerUnit, // ✅ FIXED
						total: totalAmount,
					},
				],
				totalAmount,
				paymentMethod,
				vehicleDetails,
				pickupSchedule,
						deliveryAddress: {
							village: addr.village || "",
							district: addr.district || "",
							state: addr.state || "",
							pincode: addr.pincode || "",
							fullAddress,
						},
				...paymentDetails,
			};

			const { data } = await api.post("/orders/create", orderData);

			toast.success("🎉 Order placed successfully!");
			setShowPaymentModal(false);
			navigate("/buyer-dashboard?tab=orders");
		} catch (error) {
			console.error("Create order error:", error);
			toast.error(error.response?.data?.message || "Failed to create order");
		} finally {
			setProcessing(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader className="animate-spin text-green-600" size={40} />
			</div>
		);
	}

	if (!crop) {
		return <div className="p-8 text-center">Crop not found</div>;
	}

	return (
		<div className="min-h-screen bg-fixed bg-gradient-to-br from-emerald-100 via-green-100 to-sky-100 py-8">
			<div className="max-w-6xl mx-auto px-4">
				{/* Back Button */}
				<button
					onClick={() => navigate("/buyer-dashboard")}
					className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
				>
					<ArrowLeft size={20} />
					Back to Buyer Dashboard
				</button>

				<div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
					<div className="grid md:grid-cols-2 gap-8 p-8">
						{/* Crop Image */}
						<div className="rounded-lg h-96 overflow-hidden bg-gray-100">
							{Array.isArray(crop.images) && crop.images.length > 0 ? (
								<img
									src={
										typeof crop.images[0] === "string"
												? crop.images[0]
												: crop.images[0]?.url
									}
									alt={crop.cropName}
									onError={handleImgError}
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="bg-gradient-to-br from-green-500 to-emerald-600 w-full h-full flex items-center justify-center">
									<div className="text-white text-9xl font-bold uppercase">
										{crop.cropName.substring(0, 2)}
									</div>
								</div>
							)}
						</div>

						{/* Crop Details */}
						<div>
							<h1 className="text-4xl font-bold text-gray-900 mb-4">
								{crop.cropName}
							</h1>

							<div className="space-y-4 mb-6">
								<div className="flex items-center gap-3 text-gray-700">
									<Package className="text-green-600" size={20} />
									<span>
										<strong>Seller:</strong> {crop.seller?.name || "Unknown"}
									</span>
								</div>

								<div className="flex items-center gap-3 text-gray-700">
									<Phone className="text-green-600" size={20} />
									<span>
										<strong>Contact:</strong> {crop.seller?.phone || "N/A"}
									</span>
								</div>

								<div className="flex items-center gap-3 text-gray-700">
									<MapPin className="text-green-600" size={20} />
									<span>
										<strong>Location:</strong> {crop.location?.district},{" "}
										{crop.location?.state}
									</span>
								</div>

								<div className="flex items-center gap-3 text-gray-700">
									<strong>Variety:</strong> {crop.variety}
								</div>

								{crop.grade && (
									<div className="flex items-center gap-3 text-gray-700">
										<strong>Grade:</strong> {crop.grade}
									</div>
								)}
							</div>

							{/* ✅ FIX 4: Price display using pricePerUnit */}
							<div className="bg-green-50 p-6 rounded-lg mb-6">
								<div className="text-3xl font-bold text-green-600 mb-4">
									₹{pricePerUnit}/{crop.unit || "quintal"}
								</div>

								<div className="mb-4">
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Quantity ({crop.unit || "quintal"}):
									</label>
									<div className="flex items-center gap-4">
										<button
											onClick={() => setQuantity(Math.max(1, quantity - 1))}
											className="w-10 h-10 bg-gray-200 rounded-lg hover:bg-gray-300 font-bold"
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
															crop.quantity,
															parseInt(e.target.value) || 1
														)
													)
												)
											}
											className="w-20 text-center border border-gray-300 rounded-lg py-2"
										/>
										<button
											onClick={() =>
												setQuantity(Math.min(crop.quantity, quantity + 1))
											}
											className="w-10 h-10 bg-gray-200 rounded-lg hover:bg-gray-300 font-bold"
										>
											+
										</button>
									</div>
									<p className="text-sm text-gray-500 mt-2">
										Available: {crop.quantity} {crop.unit || "quintal"}
									</p>
								</div>

								<div className="text-2xl font-bold text-gray-900">
									Total Amount: ₹{totalAmount.toLocaleString()}
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-4">
								<button
									onClick={handleAddToCart}
									className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
								>
									<ShoppingCart size={20} />
									Add to Cart
								</button>

								<button
									onClick={handleBuyNow}
									className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold"
								>
									<CreditCard size={20} />
									Buy Now
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Contact Seller Button */}
				<div className="mt-6">
					<button
						onClick={() => window.open(`tel:${crop.seller?.phone}`)}
						className="w-full bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 font-semibold"
					>
						<Phone size={20} />
						Contact Seller
					</button>
				</div>
			</div>

			{/* Payment Modal */}
			{showPaymentModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						<div className="p-6">
							<h2 className="text-2xl font-bold mb-6">Complete Your Order</h2>

							{/* Vehicle Details */}
							<div className="mb-6">
								<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
									<Truck className="text-green-600" size={20} />
									Vehicle Details
								</h3>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium mb-2">
											Vehicle Type
										</label>
										<select
											value={vehicleDetails.vehicleType}
											onChange={(e) =>
												setVehicleDetails({
													...vehicleDetails,
													vehicleType: e.target.value,
												})
											}
											className="w-full border border-gray-300 rounded-lg px-4 py-2"
										>
											<option value="">Select Type</option>
											<option value="Truck">Truck</option>
											<option value="Tempo">Tempo</option>
											<option value="Tractor">Tractor</option>
											<option value="Mini Truck">Mini Truck</option>
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium mb-2">
											Vehicle Number
										</label>
										<input
											type="text"
											placeholder="AP09XX1234"
											value={vehicleDetails.vehicleNumber}
											onChange={(e) =>
												setVehicleDetails({
													...vehicleDetails,
													vehicleNumber: e.target.value,
												})
											}
											className="w-full border border-gray-300 rounded-lg px-4 py-2"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium mb-2">
											Driver Name
										</label>
										<input
											type="text"
											placeholder="Enter driver name"
											value={vehicleDetails.driverName}
											onChange={(e) =>
												setVehicleDetails({
													...vehicleDetails,
													driverName: e.target.value,
												})
											}
											className="w-full border border-gray-300 rounded-lg px-4 py-2"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium mb-2">
											Driver Phone
										</label>
										<input
											type="tel"
											placeholder="Enter phone number"
											value={vehicleDetails.driverPhone}
											onChange={(e) =>
												setVehicleDetails({
													...vehicleDetails,
													driverPhone: e.target.value,
												})
											}
											className="w-full border border-gray-300 rounded-lg px-4 py-2"
										/>
									</div>
								</div>
							</div>

							{/* Pickup Schedule */}
							<div className="mb-6">
								<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
									<Calendar className="text-green-600" size={20} />
									Pickup Schedule
								</h3>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium mb-2">
											Pickup Date
										</label>
										<input
											type="date"
											min={new Date().toISOString().split("T")[0]}
											value={pickupSchedule.date}
											onChange={(e) =>
												setPickupSchedule({
													...pickupSchedule,
													date: e.target.value,
												})
											}
											className="w-full border border-gray-300 rounded-lg px-4 py-2"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium mb-2">
											Time Slot
										</label>
										<select
											value={pickupSchedule.timeSlot}
											onChange={(e) =>
												setPickupSchedule({
													...pickupSchedule,
													timeSlot: e.target.value,
												})
											}
											className="w-full border border-gray-300 rounded-lg px-4 py-2"
										>
											<option value="morning">Morning (6 AM - 12 PM)</option>
											<option value="afternoon">
												Afternoon (12 PM - 4 PM)
											</option>
											<option value="evening">Evening (4 PM - 7 PM)</option>
										</select>
									</div>
								</div>
							</div>

							{/* Payment Method */}
							<div className="mb-6">
								<h3 className="text-lg font-semibold mb-4">Payment Method</h3>

								<div className="space-y-3">
									<label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
										<input
											type="radio"
											name="paymentMethod"
											value="razorpay"
											checked={paymentMethod === "razorpay"}
											onChange={(e) => setPaymentMethod(e.target.value)}
											className="w-4 h-4"
										/>
										<CreditCard className="text-green-600" size={20} />
										<span className="font-medium">Pay Now (Razorpay)</span>
									</label>

									<label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
										<input
											type="radio"
											name="paymentMethod"
											value="payAfterDelivery"
											checked={paymentMethod === "payAfterDelivery"}
											onChange={(e) => setPaymentMethod(e.target.value)}
											className="w-4 h-4"
										/>
										<Truck className="text-blue-600" size={20} />
										<span className="font-medium">Pay After Delivery</span>
									</label>
								</div>
							</div>

							{/* ✅ FIX 5: Order Summary using pricePerUnit */}
							<div className="bg-green-50 p-4 rounded-lg mb-6">
								<h3 className="font-semibold mb-2">Order Summary</h3>
								<div className="flex justify-between mb-2">
									<span>
										{quantity} {crop.unit || "quintal"} × ₹{pricePerUnit}
									</span>
									<span className="font-bold">
										₹{totalAmount.toLocaleString()}
									</span>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-4">
								<button
									onClick={() => setShowPaymentModal(false)}
									disabled={processing}
									className="flex-1 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
								>
									Cancel
								</button>

								<button
									onClick={
										paymentMethod === "razorpay"
											? handleRazorpayPayment
											: handlePayAfterDelivery
									}
									disabled={processing}
									className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
								>
									{processing ? (
										<>
											<Loader className="animate-spin" size={20} />
											Processing...
										</>
									) : (
										<>
											{paymentMethod === "razorpay"
												? "Proceed to Pay"
												: "Place Order"}
										</>
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default CropDetails;
