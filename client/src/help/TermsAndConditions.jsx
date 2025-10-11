// src/pages/TermsAndConditions.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	CheckCircle,
	Shield,
	FileText,
	AlertTriangle,
	Scale,
	Users,
} from "lucide-react";

const TermsAndConditions = () => {
	const navigate = useNavigate();

	const sections = [
		{
			icon: <CheckCircle className="w-8 h-8 text-green-600" />,
			title: "Acceptance of Terms",
			content: `By accessing and using CropConnect's platform, website, and mobile applications, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services. These terms constitute a legally binding agreement between you and CropConnect.`,
		},
		{
			icon: <Users className="w-8 h-8 text-green-600" />,
			title: "User Account & Registration",
			content: `You must create an account to access certain features. You agree to: (a) provide accurate, current, and complete information during registration, (b) maintain and update your information, (c) maintain the security of your password and account, (d) notify us immediately of any unauthorized use, and (e) be responsible for all activities that occur under your account. We reserve the right to suspend or terminate accounts that violate these terms.`,
		},
		{
			icon: <FileText className="w-8 h-8 text-green-600" />,
			title: "Services Offered",
			content: `CropConnect provides: (a) Digital marketplace for buying and selling agricultural products, crops, seeds, fertilizers, and farming equipment, (b) Worker and tractor booking services for farm operations, (c) Direct connection between farmers, merchants, buyers, and service providers, (d) Secure payment processing through integrated gateways, (e) Real-time market price information from government APIs, (f) Agricultural advisory and consultation services.`,
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
			{/* Hero Section with Background Image */}
			<div
				className="relative h-[400px] flex items-center justify-center"
				style={{
					backgroundImage:
						"linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070')",
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			>
				<div className="relative z-10 text-center px-4">
					<button
						onClick={() => navigate(-1)}
						className="absolute left-4 top-0 flex items-center gap-2 text-white hover:text-green-300 font-medium transition-colors"
					>
						<ArrowLeft className="w-5 h-5" />
						Back
					</button>
					<Scale className="w-16 h-16 text-white mx-auto mb-4" />
					<h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
						Terms & Conditions
					</h1>
					<p className="text-xl text-green-100 max-w-2xl mx-auto">
						Please read these terms carefully before using CropConnect
					</p>
					<p className="text-sm text-green-200 mt-4">
						Last Updated: October 10, 2025
					</p>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				{/* Introduction Card */}
				<div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 mb-12 border border-green-100">
					<div className="flex items-start gap-4 mb-6">
						<Shield className="w-12 h-12 text-green-600 flex-shrink-0" />
						<div>
							<h2 className="text-3xl font-bold text-gray-800 mb-4">
								Welcome to CropConnect
							</h2>
							<p className="text-gray-700 text-lg leading-relaxed">
								CropConnect is India's premier digital agriculture marketplace
								operated by{" "}
								<strong>CropConnect Technologies Private Limited</strong>. These
								Terms and Conditions govern your use of our platform, including
								our website, mobile applications, and all related services. By
								using CropConnect, you enter into a legally binding agreement
								with us.
							</p>
						</div>
					</div>
				</div>

				{/* Quick Summary Cards */}
				<div className="grid md:grid-cols-3 gap-6 mb-12">
					{sections.map((section, index) => (
						<div
							key={index}
							className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border-t-4 border-green-500"
						>
							<div className="flex justify-center mb-4">{section.icon}</div>
							<h3 className="text-xl font-bold text-gray-800 mb-3 text-center">
								{section.title}
							</h3>
							<p className="text-gray-600 text-sm leading-relaxed">
								{section.content}
							</p>
						</div>
					))}
				</div>

				{/* Detailed Terms Sections */}
				<div className="space-y-8">
					{/* Section 4 */}
					<div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-green-100">
						<h3 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-3">
							<span className="text-3xl">4️⃣</span>
							Marketplace Transactions
						</h3>
						<div className="space-y-4 text-gray-700 leading-relaxed">
							<p>
								<strong>4.1 Crop Selling:</strong> Farmers may list their crops
								for sale with accurate descriptions, pricing, quantity, and
								quality information. All listings are subject to verification
								and approval by CropConnect.
							</p>
							<p>
								<strong>4.2 Crop Buying:</strong> Buyers can purchase crops
								directly from farmers. By placing an order, you enter into a
								legally binding contract with the seller.
							</p>
							<p>
								<strong>4.3 Pricing:</strong> All prices are in Indian Rupees
								(INR) and are subject to change. The final price includes
								applicable taxes, platform fees, and any delivery charges.
							</p>
							<p>
								<strong>4.4 Payment:</strong> We use secure third-party payment
								gateways (Razorpay, Paytm, etc.). CropConnect is not responsible
								for payment gateway issues. All transactions are final unless
								covered by our refund policy.
							</p>
						</div>
					</div>

					{/* Section 5 */}
					<div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-green-100">
						<h3 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-3">
							<span className="text-3xl">5️⃣</span>
							Worker & Tractor Booking Services
						</h3>
						<div className="space-y-4 text-gray-700 leading-relaxed">
							<p>
								<strong>5.1 Booking Process:</strong> Users can book farm
								workers and tractors through our platform. Bookings are subject
								to availability and confirmation.
							</p>
							<p>
								<strong>5.2 Service Provider Obligations:</strong> Service
								providers must maintain equipment and provide skilled workers as
								specified in the booking.
							</p>
							<p>
								<strong>5.3 Cancellation:</strong> Cancellations must be made at
								least 24 hours in advance. Late cancellations may incur charges.
							</p>
							<p>
								<strong>5.4 Liability:</strong> CropConnect acts as an
								intermediary. We are not liable for the quality of services
								provided by third-party workers or equipment owners.
							</p>
						</div>
					</div>

					{/* Section 6 */}
					<div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-green-100">
						<h3 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-3">
							<span className="text-3xl">6️⃣</span>
							User Conduct & Prohibited Activities
						</h3>
						<div className="space-y-3 text-gray-700 leading-relaxed">
							<p className="font-semibold">You agree NOT to:</p>
							<ul className="list-disc list-inside space-y-2 ml-4">
								<li>Provide false, inaccurate, or misleading information</li>
								<li>Engage in fraudulent transactions or money laundering</li>
								<li>
									Manipulate prices or engage in anti-competitive practices
								</li>
								<li>Upload harmful content, viruses, or malicious code</li>
								<li>
									Violate any applicable laws, regulations, or third-party
									rights
								</li>
								<li>Impersonate another person or entity</li>
								<li>Attempt to gain unauthorized access to our systems</li>
							</ul>
						</div>
					</div>

					{/* Section 7 */}
					<div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-green-100">
						<h3 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-3">
							<span className="text-3xl">7️⃣</span>
							Intellectual Property Rights
						</h3>
						<div className="space-y-4 text-gray-700 leading-relaxed">
							<p>
								All content on CropConnect, including logos, trademarks, text,
								images, graphics, software, and design, is owned by CropConnect
								Technologies Private Limited and protected by Indian and
								international intellectual property laws.
							</p>
							<p>
								<strong>User-Generated Content:</strong> By uploading content
								(reviews, photos, listings), you grant CropConnect a worldwide,
								perpetual, royalty-free license to use, reproduce, modify, and
								display such content for platform operations.
							</p>
						</div>
					</div>

					{/* Section 8 */}
					<div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-green-100 bg-yellow-50">
						<div className="flex items-start gap-4">
							<AlertTriangle className="w-10 h-10 text-yellow-600 flex-shrink-0" />
							<div>
								<h3 className="text-2xl font-bold text-gray-800 mb-4">
									8️⃣ Disclaimers & Limitations of Liability
								</h3>
								<div className="space-y-4 text-gray-700 leading-relaxed">
									<p>
										<strong>No Guarantee of Results:</strong> Agricultural
										outcomes depend on factors beyond our control (weather, soil
										quality, pests). We do not guarantee crop yields, profits,
										or specific results.
									</p>
									<p>
										<strong>Platform Availability:</strong> We strive for 99.9%
										uptime but do not guarantee uninterrupted service. We are
										not liable for losses due to service interruptions.
									</p>
									<p>
										<strong>Third-Party Services:</strong> We are not
										responsible for third-party services, including payment
										gateways, logistics partners, or service providers.
									</p>
									<p>
										<strong>Limitation of Liability:</strong> To the maximum
										extent permitted by law, CropConnect's liability shall not
										exceed the amount paid by you in the past 12 months.
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Section 9 */}
					<div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-green-100">
						<h3 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-3">
							<span className="text-3xl">9️⃣</span>
							Termination & Suspension
						</h3>
						<div className="space-y-4 text-gray-700 leading-relaxed">
							<p>
								We reserve the right to suspend or terminate your account
								immediately, without notice, for:
							</p>
							<ul className="list-disc list-inside space-y-2 ml-4">
								<li>Violation of these Terms and Conditions</li>
								<li>Fraudulent or illegal activities</li>
								<li>Non-payment of dues</li>
								<li>Abuse of platform features or other users</li>
								<li>Any conduct that harms CropConnect or its users</li>
							</ul>
							<p className="mt-4">
								Upon termination, your right to use the platform ceases
								immediately. We may retain certain data as required by law.
							</p>
						</div>
					</div>

					{/* Section 10 */}
					<div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-green-100">
						<h3 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-3">
							<span className="text-3xl">🔟</span>
							Dispute Resolution & Governing Law
						</h3>
						<div className="space-y-4 text-gray-700 leading-relaxed">
							<p>
								<strong>Governing Law:</strong> These Terms are governed by the
								laws of India. Any disputes shall be subject to the exclusive
								jurisdiction of the courts in Bangalore, Karnataka, India.
							</p>
							<p>
								<strong>Dispute Resolution:</strong> In case of disputes,
								parties agree to first attempt resolution through good-faith
								negotiation. If unresolved within 30 days, disputes may be
								referred to arbitration under the Arbitration and Conciliation
								Act, 1996.
							</p>
						</div>
					</div>

					{/* Section 11 */}
					<div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-green-100">
						<h3 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-3">
							<span className="text-3xl">1️⃣1️⃣</span>
							Amendments & Updates
						</h3>
						<div className="space-y-4 text-gray-700 leading-relaxed">
							<p>
								We reserve the right to modify these Terms and Conditions at any
								time. Changes will be posted on this page with an updated "Last
								Updated" date. Continued use of the platform after changes
								constitutes acceptance of the modified terms.
							</p>
							<p className="font-semibold text-green-700">
								We recommend reviewing these terms periodically to stay informed
								of any updates.
							</p>
						</div>
					</div>
				</div>

				{/* Contact Information */}
				<div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-2xl p-8 md:p-10 text-white mt-12">
					<h3 className="text-3xl font-bold mb-6 text-center">📞 Contact Us</h3>
					<div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
						<div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
							<h4 className="font-bold text-lg mb-3">Company Details</h4>
							<p className="leading-relaxed">
								<strong>CropConnect Technologies Pvt. Ltd.</strong>
								<br />
								Bangalore, Karnataka, India
								<br />
								CIN: U74999KA2025PTC123456
							</p>
						</div>
						<div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
							<h4 className="font-bold text-lg mb-3">Get in Touch</h4>
							<p className="leading-relaxed">
								📧 Email: legal@cropconnect.com
								<br />
								📞 Phone: +91 98765 43210
								<br />
								🌐 Website: www.cropconnect.com
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TermsAndConditions;
