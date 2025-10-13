import { useState, useCallback } from "react";
import { transactionService } from "../services/transactionService";

export const useTransactions = () => {
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(false);

	// Fetch transactions
	const fetchTransactions = useCallback(async () => {
		setLoading(true);
		try {
			const data = await transactionService.getTransactions();
			setTransactions(data.transactions);
		} catch (error) {
			console.error("Error fetching transactions:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	// Record cash payment
	const recordCashPayment = useCallback(
		async (bookingId, amount) => {
			try {
				const result = await transactionService.recordCashPayment(
					bookingId,
					amount
				);
				await fetchTransactions();
				return result;
			} catch (error) {
				throw new Error(error.response?.data?.message || "Payment failed");
			}
		},
		[fetchTransactions]
	);

	// Initiate Razorpay
	const initiateRazorpayPayment = useCallback(async (bookingId, amount) => {
		try {
			const result = await transactionService.initiateRazorpayPayment(
				bookingId,
				amount
			);
			return result;
		} catch (error) {
			throw new Error(
				error.response?.data?.message || "Payment initiation failed"
			);
		}
	}, []);

	// Verify Razorpay
	const verifyRazorpayPayment = useCallback(
		async (orderId, paymentId, signature, bookingId) => {
			try {
				const result = await transactionService.verifyRazorpayPayment(
					orderId,
					paymentId,
					signature,
					bookingId
				);
				await fetchTransactions();
				return result;
			} catch (error) {
				throw new Error(
					error.response?.data?.message || "Payment verification failed"
				);
			}
		},
		[fetchTransactions]
	);

	return {
		transactions,
		loading,
		fetchTransactions,
		recordCashPayment,
		initiateRazorpayPayment,
		verifyRazorpayPayment,
	};
};
