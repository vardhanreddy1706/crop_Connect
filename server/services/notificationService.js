const Notification = require("../models/Notification");

class NotificationService {
	static async notifyBidPlaced(farmer, tractorOwner, requirement, bidData) {
		return Notification.create({
			recipientId: farmer._id,
			type: "bid_placed",
			title: "New Bid Received",
			message: `${tractorOwner.name} placed a bid of ₹${bidData.quotedPrice}/acre`,
			relatedUserId: tractorOwner._id,
			relatedRequirementId: requirement._id,
			data: bidData,
		});
	}

	static async notifyBidAccepted(tractorOwner, booking) {
		return Notification.create({
			recipientId: tractorOwner._id,
			type: "bid_accepted",
			title: "Bid Accepted!",
			message: "Your bid has been accepted for the work",
			relatedBookingId: booking._id,
		});
	}

	static async notifyPaymentReceived(tractorOwner, transaction) {
		return Notification.create({
			recipientId: tractorOwner._id,
			type: "payment_received",
			title: "Payment Received",
			message: `You received ₹${transaction.amount}`,
			relatedBookingId: transaction.bookingId,
			data: { amount: transaction.amount, method: transaction.method },
		});
	}

	static async notifyPaymentSent(farmer, transaction) {
		return Notification.create({
			recipientId: farmer._id,
			type: "payment_sent",
			title: "Payment Sent",
			message: `You sent ₹${transaction.amount}`,
			relatedBookingId: transaction.bookingId,
			data: { amount: transaction.amount, method: transaction.method },
		});
	}
}

module.exports = NotificationService;
