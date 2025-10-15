const nodemailer = require("nodemailer");

// Create transporter
const createTransporter = () => {
	return nodemailer.createTransport({
		host: process.env.EMAIL_HOST,
		port: process.env.EMAIL_PORT || 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASSWORD,
		},
	});
};

// Send email function
const sendEmail = async (options) => {
	try {
		const transporter = createTransporter();

		const mailOptions = {
			from: `${process.env.EMAIL_FROM || "Crop Connect"} <${
				process.env.EMAIL_USER
			}>`,
			to: options.to,
			subject: options.subject,
			text: options.text,
			html: options.html,
		};

		const info = await transporter.sendMail(mailOptions);
		console.log("✅ Email sent successfully:", info.messageId);
		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error("❌ Email sending failed:", error.message);
		return { success: false, error: error.message };
	}
};

module.exports = sendEmail;
