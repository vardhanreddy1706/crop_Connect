import { useState, useEffect, useCallback } from "react";
import { transactionService } from "../services/transactionService";

export const useTransactions = () => {
	const [transactions, setTransactions] = useState([]);
	const [dashboardData, setDashboardData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [dashboardLoading, setDashboardLoading] = useState(false);

	const fetchTransactions = useCallback(async () => {
		setLoading(true);
		try {
			const data = await transactionService.getTransactions();
			setTransactions(data.transactions);
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchDashboardData = useCallback(async () => {
		setDashboardLoading(true);
		try {
			const data = await transactionService.getTransactionDashboard();
			setDashboardData(data);
		} finally {
			setDashboardLoading(false);
		}
	}, []);

	const getPaymentOptions = useCallback(async (bookingId) => {
		const result = await transactionService.getPaymentOptions(bookingId);
		return result;
	}, []);

	const payAfterWorkCompletion = useCallback(
		async (bookingId, paymentMethod = "cash") => {
			const result = await transactionService.payAfterWorkCompletion(
				bookingId,
				paymentMethod
			);
			await fetchTransactions();
			await fetchDashboardData();
			return result;
		},
		[fetchTransactions, fetchDashboardData]
	);

	const recordCashPayment = useCallback(
		async (bookingId, amount) => {
			const result = await transactionService.recordCashPayment(
				bookingId,
				amount
			);
			await fetchTransactions();
			await fetchDashboardData();
			return result;
		},
		[fetchTransactions, fetchDashboardData]
	);

	const initiateRazorpayPayment = useCallback(async (bookingId, amount) => {
		const result = await transactionService.initiateRazorpayPayment(
			bookingId,
			amount
		);
		return result;
	}, []);

	const verifyRazorpayPayment = useCallback(
		async (orderId, paymentId, signature, bookingId) => {
			const result = await transactionService.verifyRazorpayPayment(
				orderId,
				paymentId,
				signature,
				bookingId
			);
			await fetchTransactions();
			await fetchDashboardData();
			return result;
		},
		[fetchTransactions, fetchDashboardData]
	);

	useEffect(() => {
		fetchTransactions();
		fetchDashboardData();
	}, [fetchTransactions, fetchDashboardData]);

	return {
		transactions,
		dashboardData,
		loading,
		dashboardLoading,
		fetchTransactions,
		fetchDashboardData,
		getPaymentOptions,
		payAfterWorkCompletion,
		recordCashPayment,
		initiateRazorpayPayment,
		verifyRazorpayPayment,
	};
};
