const express = require("express");
const router = express.Router();
const {
	getTransactions,
	getTransactionDashboard,
	payAfterWorkCompletion,
	getPaymentOptions,
	recordCashPayment,
	initiateRazorpayPayment,
	verifyRazorpayPayment,
} = require("../controllers/transactionController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/dashboard", protect, getTransactionDashboard);
router.get("/payment-options/:bookingId", protect, getPaymentOptions);
router.post("/pay-after-work", protect, payAfterWorkCompletion);
router.post("/cash-payment", protect, recordCashPayment);
router.post("/razorpay/initiate", protect, initiateRazorpayPayment);
router.post("/razorpay/verify", protect, verifyRazorpayPayment);
router.get("/", protect, getTransactions);

module.exports = router;
