const nodemailer = require("nodemailer");

// Create transporter
const createTransporter = () => {
	return nodemailer.createTransport({
		host: process.env.EMAIL_HOST,
		port: process.env.EMAIL_PORT || 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
	});
};

// Send email function
const sendEmail = async (options) => {
	try {
		// Validate email configuration
		if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
			const error = 'Email configuration missing! Check EMAIL_USER and EMAIL_PASS in .env';
			console.error('❌', error);
			return { success: false, error };
		}

		if (!options.to) {
			const error = 'No recipient email address provided';
			console.error('❌', error);
			return { success: false, error };
		}

		console.log('\n📤 sendEmail utility called:');
		console.log('   SMTP Host:', process.env.EMAIL_HOST);
		console.log('   SMTP Port:', process.env.EMAIL_PORT);
		console.log('   From:', process.env.EMAIL_USER);
		console.log('   To:', options.to);
		console.log('   Subject:', options.subject);

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

		console.log('📨 Sending email via SMTP...');
		const info = await transporter.sendMail(mailOptions);
		
		console.log("✅ Email sent successfully!");
		console.log("   Message ID:", info.messageId);
		console.log("   Response:", info.response);
		
		return { success: true, messageId: info.messageId };
	} catch (error) {
		console.error("\n❌ EMAIL SENDING FAILED!");
		console.error("   Error Message:", error.message);
		console.error("   Error Code:", error.code);
		console.error("   Command:", error.command);
		
		// Provide helpful error messages
		if (error.code === 'EAUTH') {
			console.error("\n🔧 Authentication failed! Check:");
			console.error("   1. EMAIL_USER is correct");
			console.error("   2. EMAIL_PASS is a valid App Password (not regular password)");
			console.error("   3. Gmail: Enable 2FA and generate App Password");
		} else if (error.code === 'ECONNECTION') {
			console.error("\n🔧 Connection failed! Check:");
			console.error("   1. EMAIL_HOST is correct:", process.env.EMAIL_HOST);
			console.error("   2. EMAIL_PORT is correct:", process.env.EMAIL_PORT);
			console.error("   3. Internet connection is working");
		}
		
		return { success: false, error: error.message };
	}
};

module.exports = sendEmail;
