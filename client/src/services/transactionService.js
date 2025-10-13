import api from "../config/api";

export const transactionService = {
	getTransactions: async () => (await api.get("/transactions")).data,
	getTransactionDashboard: async () =>
		(await api.get("/transactions/dashboard")).data,
	getPaymentOptions: async (bookingId) =>
		(await api.get(`/transactions/payment-options/${bookingId}`)).data,
	payAfterWorkCompletion: async (bookingId, paymentMethod = "cash") =>
		(
			await api.post("/transactions/pay-after-work", {
				bookingId,
				paymentMethod,
			})
		).data,
	recordCashPayment: async (bookingId, amount) =>
		(await api.post("/transactions/cash-payment", { bookingId, amount })).data,
	initiateRazorpayPayment: async (bookingId, amount) =>
		(await api.post("/transactions/razorpay/initiate", { bookingId, amount }))
			.data,
	verifyRazorpayPayment: async (orderId, paymentId, signature, bookingId) =>
		(
			await api.post("/transactions/razorpay/verify", {
				orderId,
				paymentId,
				signature,
				bookingId,
			})
		).data,
};
