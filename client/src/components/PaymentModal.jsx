import React, { useState } from "react";
import { X, IndianRupee, Zap } from "lucide-react";
import { useTransactions } from "../hooks/useTransactions";

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

export const PaymentModal = ({ booking, isOpen, onClose, onSuccess }) => {
	const [paymentMethod, setPaymentMethod] = useState("cash");
	const [loading, setLoading] = useState(false);
	const { recordCashPayment, initiateRazorpayPayment, verifyRazorpayPayment } =
		useTransactions();

	if (!isOpen) return null;

	const handlePayment = async () => {
		try {
			setLoading(true);
			if (paymentMethod === "cash") {
				await recordCashPayment(booking._id, booking.totalCost);
				onSuccess?.();
				onClose();
			} else if (paymentMethod === "razorpay") {
				const result = await initiateRazorpayPayment(
					booking._id,
					booking.totalCost
				);

				const options = {
					key: RAZORPAY_KEY_ID,
					order_id: result.order.id,
					amount: result.order.amount,
					currency: "INR",
					name: "CropConnect",
					description: `Payment for ${booking.workType}`,
					handler: async function (response) {
						await verifyRazorpayPayment(
							result.order.id,
							response.razorpay_payment_id,
							response.razorpay_signature,
							booking._id
						);
						onSuccess?.();
						onClose();
					},
					prefill: {},
					theme: { color: "#10B981" },
				};

				const rzp = new window.Razorpay(options);
				rzp.open();
			}
		} catch (err) {
			alert(err.message || "Payment failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-lg w-full max-w-md">
				<div className="flex items-center justify-between p-4 border-b">
					<h3 className="text-lg font-semibold">Complete Payment</h3>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="p-4 space-y-4">
					<div className="space-y-2">
						<label className="flex items-center space-x-2 p-3 border rounded-md cursor-pointer">
							<input
								type="radio"
								name="method"
								value="cash"
								checked={paymentMethod === "cash"}
								onChange={() => setPaymentMethod("cash")}
							/>
						<span className="flex items-center text-sm">
							<IndianRupee className="h-4 w-4 text-green-600 mr-2" /> Pay After
								Work (Cash)
							</span>
						</label>

						<label className="flex items-center space-x-2 p-3 border rounded-md cursor-pointer">
							<input
								type="radio"
								name="method"
								value="razorpay"
								checked={paymentMethod === "razorpay"}
								onChange={() => setPaymentMethod("razorpay")}
							/>
							<span className="flex items-center text-sm">
								<Zap className="h-4 w-4 text-blue-600 mr-2" /> Pay Online
								(Razorpay)
							</span>
						</label>
					</div>

					<button
						onClick={handlePayment}
						disabled={loading}
						className={`w-full py-2 rounded-md text-white ${
							paymentMethod === "cash"
								? "bg-green-600 hover:bg-green-700"
								: "bg-blue-600 hover:bg-blue-700"
						}`}
					>
						{loading ? "Processing..." : "Proceed to Pay"}
					</button>
				</div>
			</div>
		</div>
	);
};
