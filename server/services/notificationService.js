const Notification = require("../models/Notification");

// ✅ Helper function to send email using provided transporter
const sendEmail = async (to, subject, message, emailTransporter = null) => {
	// If no transporter provided, email sending is disabled
	if (!emailTransporter || !to) {
		console.log("⚠️  Email transporter not available, skipping email");
		return null;
	}

	try {
		const mailOptions = {
			from: `"Crop Connect" <${process.env.EMAIL_USER}>`,
			to,
			subject,
			html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h1 style="color: #10b981; margin: 0;">🌾 Crop Connect</h1>
                        </div>
                        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
                            <h2 style="color: #065f46; margin-top: 0;">${subject}</h2>
                            <p style="font-size: 16px; color: #333; line-height: 1.6;">${message}</p>
                        </div>
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        <p style="font-size: 12px; color: #6b7280; text-align: center;">
                            This is an automated notification from Crop Connect.<br>
                            Please do not reply to this email.
                        </p>
                    </div>
                </div>
            `,
		};

		const info = await emailTransporter.sendMail(mailOptions);
		console.log("✅ Email sent:", info.messageId);
		return info;
	} catch (error) {
		console.error("❌ Email failed:", error.message);
		return null;
	}
};

class NotificationService {
	// ========================================
	// 1. AUTHENTICATION NOTIFICATIONS
	// ========================================

	static async notifySuccessfulLogin(user, emailTransporter = null) {
		const notification = await Notification.create({
			recipientId: user._id,
			type: "login",
			title: "Successful Login",
			message: `You logged in successfully at ${new Date().toLocaleString()}`,
		});

		if (user.email) {
			await sendEmail(
				user.email,
				"🔐 Successful Login",
				`Your account was accessed on ${new Date().toLocaleString()}. If this wasn't you, please secure your account immediately.`,
				emailTransporter
			);
		}

		return notification;
	}

	static async notifyRegistration(user, emailTransporter = null) {
		const notification = await Notification.create({
			recipientId: user._id,
			type: "registration",
			title: "Welcome to Crop Connect",
			message: `Welcome ${user.name}! Your account has been created successfully`,
		});

		if (user.email) {
			await sendEmail(
				user.email,
				"🎉 Welcome to Crop Connect!",
				`Welcome <strong>${user.name}</strong>! Your account has been created successfully. Start exploring tractor and worker services now!`,
				emailTransporter
			);
		}

		return notification;
	}

	// ========================================
	// 2. TRACTOR REQUIREMENT NOTIFICATIONS
	// ========================================

	static async notifyTractorRequirementPosted(
		user,
		requirement,
		emailTransporter = null
	) {
		const notification = await Notification.create({
			recipientId: user._id,
			type: "requirement_posted",
			title: "Tractor Requirement Posted",
			message: `Your requirement for ${requirement.acreage} acres has been posted successfully`,
			relatedRequirementId: requirement._id,
		});

		if (user.email) {
			await sendEmail(
				user.email,
				"✅ Tractor Requirement Posted",
				`Your requirement for <strong>${requirement.acreage} acres</strong> of land service has been posted. You'll receive notifications when tractor owners place bids.`,
				emailTransporter
			);
		}

		return notification;
	}

	static async notifyBidPlaced(
		farmer,
		tractorOwner,
		requirement,
		bidData,
		emailTransporter = null
	) {
		const notification = await Notification.create({
			recipientId: farmer._id,
			type: "bid_placed",
			title: "New Bid Received",
			message: `${tractorOwner.name} placed a bid of ₹${bidData.quotedPrice}/acre`,
			relatedUserId: tractorOwner._id,
			relatedRequirementId: requirement._id,
			data: bidData,
		});

		if (farmer.email) {
			await sendEmail(
				farmer.email,
				"💰 New Bid on Your Requirement",
				`<strong>${tractorOwner.name}</strong> has placed a bid of <strong>₹${bidData.quotedPrice}/acre</strong> on your tractor requirement. Login to review and accept the bid.`,
				emailTransporter
			);
		}

		return notification;
	}

	static async notifyBidAccepted(
		tractorOwner,
		booking,
		emailTransporter = null
	) {
		const notification = await Notification.create({
			recipientId: tractorOwner._id,
			type: "bid_accepted",
			title: "🎉 Bid Accepted!",
			message: "Your bid has been accepted for the work",
			relatedBookingId: booking._id,
		});

		if (tractorOwner.email) {
			await sendEmail(
				tractorOwner.email,
				"🎉 Your Bid Has Been Accepted!",
				`Congratulations! Your bid has been accepted. Please login to view booking details and coordinate with the farmer.`,
				emailTransporter
			);
		}

		return notification;
	}

	static async notifyBidRejected(
		tractorOwner,
		requirement,
		emailTransporter = null
	) {
		const notification = await Notification.create({
			recipientId: tractorOwner._id,
			type: "bid_rejected",
			title: "❌ Bid Rejected",
			message: "Your bid was not accepted",
			relatedRequirementId: requirement._id,
		});

		if (tractorOwner.email) {
			await sendEmail(
				tractorOwner.email,
				"❌ Bid Not Accepted",
				`Your bid on the tractor requirement was not accepted. Don't worry, keep submitting bids for other opportunities!`,
				emailTransporter
			);
		}

		return notification;
	}

	// ========================================
	// 3. WORKER REQUIREMENT NOTIFICATIONS
	// ========================================

	static async notifyWorkerRequirementPosted(
		user,
		requirement,
		emailTransporter = null
	) {
		const notification = await Notification.create({
			recipientId: user._id,
			type: "requirement_posted",
			title: "Worker Requirement Posted",
			message: `Your requirement for ${requirement.numberOfWorkers} workers has been posted successfully`,
			relatedRequirementId: requirement._id,
		});

		if (user.email) {
			await sendEmail(
				user.email,
				"✅ Worker Requirement Posted",
				`Your requirement for <strong>${requirement.numberOfWorkers} workers</strong> has been posted. You'll receive notifications when workers apply.`,
				emailTransporter
			);
		}

		return notification;
	}

	static async notifyWorkerApplication(
		farmer,
		worker,
		requirement,
		emailTransporter = null
	) {
		const notification = await Notification.create({
			recipientId: farmer._id,
			type: "application_received",
			title: "New Worker Application",
			message: `${worker.name} has applied for your work requirement`,
			relatedUserId: worker._id,
			relatedRequirementId: requirement._id,
		});

		if (farmer.email) {
			await sendEmail(
				farmer.email,
				"👷 New Worker Application",
				`<strong>${worker.name}</strong> has applied for your work requirement. Login to review the application and hire the worker.`,
				emailTransporter
			);
		}

		return notification;
	}

	static async notifyWorkerHired(
		worker,
		farmer,
		booking,
		emailTransporter = null
	) {
		const notification = await Notification.create({
			recipientId: worker._id,
			type: "worker_hired",
			title: "🎉 You've Been Hired!",
			message: `${farmer.name} has hired you for work`,
			relatedBookingId: booking._id,
		});

		if (worker.email) {
			await sendEmail(
				worker.email,
				"🎉 You've Been Hired!",
				`<strong>${farmer.name}</strong> has hired you for work. Login to view details and coordinate with the farmer.`,
				emailTransporter
			);
		}

		return notification;
	}

	// ========================================
	// 4. BOOKING NOTIFICATIONS
	// ========================================

	static async notifyBookingCreated(
		user,
		booking,
		serviceType,
		emailTransporter = null
	) {
		const notification = await Notification.create({
			recipientId: user._id,
			type: "booking_created",
			title: "Booking Confirmed",
			message: `Your ${serviceType} booking has been confirmed`,
			relatedBookingId: booking._id,
		});

		if (user.email) {
			await sendEmail(
				user.email,
				"✅ Booking Confirmed",
				`Your <strong>${serviceType}</strong> booking has been confirmed. Booking ID: <strong>${booking._id}</strong>`,
				emailTransporter
			);
		}

		return notification;
	}

	static async notifyBookingConfirmed(user, booking, emailTransporter = null) {
		const notification = await Notification.create({
			recipientId: user._id,
			type: "booking_confirmed",
			title: "✅ Booking Confirmed",
			message: `Your booking has been confirmed`,
			relatedBookingId: booking._id,
		});

		if (user.email) {
			await sendEmail(
				user.email,
				"✅ Booking Confirmed",
				`Your booking (ID: <strong>${booking._id}</strong>) has been confirmed. The service will begin soon.`,
				emailTransporter
			);
		}

		return notification;
	}

	static async notifyBookingCancelled(
		user,
		booking,
		cancelledBy,
		emailTransporter = null
	) {
		const notification = await Notification.create({
			recipientId: user._id,
			type: "booking_cancelled",
			title: "Booking Cancelled",
			message: `Your booking has been cancelled by ${cancelledBy}`,
			relatedBookingId: booking._id,
		});

		if (user.email) {
			await sendEmail(
				user.email,
				"❌ Booking Cancelled",
				`Your booking (ID: <strong>${booking._id}</strong>) has been cancelled by <strong>${cancelledBy}</strong>. Any payments will be refunded.`,
				emailTransporter
			);
		}

		return notification;
	}

	static async notifyBookingCompleted(user, booking, emailTransporter = null) {
		const notification = await Notification.create({
			recipientId: user._id,
			type: "booking_completed",
			title: "✅ Work Completed",
			message: `Your booking has been marked as completed`,
			relatedBookingId: booking._id,
		});

		if (user.email) {
			await sendEmail(
				user.email,
				"✅ Work Completed",
				`Your booking has been completed successfully. Please rate your experience!`,
				emailTransporter
			);
		}

		return notification;
	}

	// ========================================
	// 5. PAYMENT NOTIFICATIONS
	// ========================================

	static async notifyPaymentReceived(
		user,
		transaction,
		emailTransporter = null
	) {
		const notification = await Notification.create({
			recipientId: user._id,
			type: "payment_received",
			title: "💰 Payment Received",
			message: `You received ₹${transaction.amount}`,
			relatedBookingId: transaction.bookingId,
			data: { amount: transaction.amount, method: transaction.method },
		});

		if (user.email) {
			await sendEmail(
				user.email,
				"💰 Payment Received",
				`You have received a payment of <strong>₹${transaction.amount}</strong> via ${transaction.method}. Check your dashboard for details.`,
				emailTransporter
			);
		}

		return notification;
	}

	static async notifyPaymentSent(user, transaction, emailTransporter = null) {
		const notification = await Notification.create({
			recipientId: user._id,
			type: "payment_sent",
			title: "✅ Payment Confirmed",
			message: `You sent ₹${transaction.amount}`,
			relatedBookingId: transaction.bookingId,
			data: { amount: transaction.amount, method: transaction.method },
		});

		if (user.email) {
			await sendEmail(
				user.email,
				"✅ Payment Confirmation",
				`Your payment of <strong>₹${transaction.amount}</strong> has been processed successfully via ${transaction.method}.`,
				emailTransporter
			);
		}

		return notification;
	}

	static async notifyPaymentFailed(user, transaction, emailTransporter = null) {
		const notification = await Notification.create({
			recipientId: user._id,
			type: "payment_failed",
			title: "❌ Payment Failed",
			message: `Payment of ₹${transaction.amount} failed`,
			relatedBookingId: transaction.bookingId,
		});

		if (user.email) {
			await sendEmail(
				user.email,
				"❌ Payment Failed",
				`Your payment of <strong>₹${transaction.amount}</strong> failed. Please try again or contact support.`,
				emailTransporter
			);
		}

		return notification;
	}

	// ========================================
	// 6. SERVICE POSTING NOTIFICATIONS
	// ========================================

	static async notifyTractorServicePosted(
		user,
		service,
		emailTransporter = null
	) {
		const notification = await Notification.create({
			recipientId: user._id,
			type: "service_posted",
			title: "Tractor Service Posted",
			message: `Your ${service.tractorName} service has been listed successfully`,
			relatedServiceId: service._id,
		});

		if (user.email) {
			await sendEmail(
				user.email,
				"✅ Tractor Service Listed",
				`Your <strong>${service.tractorName}</strong> tractor service has been listed. Farmers can now book your service.`,
				emailTransporter
			);
		}

		return notification;
	}

	static async notifyWorkerServicePosted(
		user,
		service,
		emailTransporter = null
	) {
		const notification = await Notification.create({
			recipientId: user._id,
			type: "service_posted",
			title: "Worker Service Posted",
			message: `Your worker service has been listed successfully`,
			relatedServiceId: service._id,
		});

		if (user.email) {
			await sendEmail(
				user.email,
				"✅ Worker Service Listed",
				`Your worker service has been listed. Farmers can now hire you for work.`,
				emailTransporter
			);
		}

		return notification;
	}

	static async notifyServiceCancelled(user, service, emailTransporter = null) {
		const notification = await Notification.create({
			recipientId: user._id,
			type: "service_cancelled",
			title: "Service Cancelled",
			message: `Your service has been cancelled`,
			relatedServiceId: service._id,
		});

		if (user.email) {
			await sendEmail(
				user.email,
				"❌ Service Cancelled",
				`Your service has been cancelled. You can list a new service anytime.`,
				emailTransporter
			);
		}

		return notification;
	}
}

module.exports = NotificationService;
