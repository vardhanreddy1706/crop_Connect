// src/pages/PrivacyPolicy.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	Shield,
	Lock,
	Eye,
	Database,
	UserCheck,
	Globe,
	Bell,
	FileText,
} from "lucide-react";

const PrivacyPolicy = () => {
	const navigate = useNavigate();

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
			{/* Hero Section */}
			<div
				className="relative h-[400px] flex items-center justify-center"
				style={{
					backgroundImage:
						"linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=2074')",
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			>
				<div className="relative z-10 text-center px-4">
					<button
						onClick={() => navigate(-1)}
						className="absolute left-4 top-0 flex items-center gap-2 text-white hover:text-blue-300 font-medium transition-colors"
					>
						<ArrowLeft className="w-5 h-5" />
						Back
					</button>
					<Lock className="w-16 h-16 text-white mx-auto mb-4" />
					<h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
						Privacy Policy
					</h1>
					<p className="text-xl text-blue-100 max-w-2xl mx-auto">
						Your privacy is our priority. Learn how we protect your data.
					</p>
					<p className="text-sm text-blue-200 mt-4">
						Last Updated: October 10, 2025
					</p>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				{/* Introduction */}
				<div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 mb-12 border border-blue-100">
					<div className="flex items-start gap-4">
						<Shield className="w-12 h-12 text-blue-600 flex-shrink-0" />
						<div>
							<h2 className="text-3xl font-bold text-gray-800 mb-4">
								Our Commitment to Privacy
							</h2>
							<p className="text-gray-700 text-lg leading-relaxed mb-4">
								At CropConnect, we value your privacy and are committed to
								protecting your personal information. This Privacy Policy
								outlines how we collect, use, store, and protect your data when
								you use our platform, website, mobile applications, and
								services.
							</p>
							<p className="text-gray-700 text-lg leading-relaxed">
								By using CropConnect, you agree to the practices described in
								this policy. We comply with the{" "}
								<strong>Digital Personal Data Protection Act, 2023</strong> and
								other applicable Indian data protection laws.
							</p>
						</div>
					</div>
				</div>

				{/* Quick Overview Cards */}
				<div className="grid md:grid-cols-4 gap-6 mb-12">
					{[
						{
							icon: <Database className="w-8 h-8" />,
							title: "Data Collection",
							color: "blue",
						},
						{
							icon: <Eye className="w-8 h-8" />,
							title: "Data Usage",
							color: "indigo",
						},
						{
							icon: <Lock className="w-8 h-8" />,
							title: "Data Security",
							color: "purple",
						},
						{
							icon: <UserCheck className="w-8 h-8" />,
							title: "Your Rights",
							color: "pink",
						},
					].map((item, index) => (
						<div
							key={index}
							className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border-t-4 border-${item.color}-500 text-center`}
						>
							<div
								className={`flex justify-center mb-3 text-${item.color}-600`}
							>
								{item.icon}
							</div>
							<h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
						</div>
					))}
				</div>

				{/* Section 1: Information We Collect */}
				<div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 mb-8 border border-blue-100">
					<h3 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-3">
						<Database className="w-8 h-8" />
						1. Information We Collect
					</h3>

					<div className="space-y-6">
						<div className="bg-blue-50 rounded-xl p-6">
							<h4 className="text-xl font-bold text-gray-800 mb-3">
								📝 Personal Information
							</h4>
							<p className="text-gray-700 mb-3">
								When you register or use our services, we collect:
							</p>
							<ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
								<li>
									<strong>Account Information:</strong> Name, email address,
									phone number, date of birth
								</li>
								<li>
									<strong>Profile Information:</strong> Farm location, farm
									size, type of crops, farming experience
								</li>
								<li>
									<strong>Payment Information:</strong> Bank account details,
									UPI ID, credit/debit card information (processed securely
									through payment gateways)
								</li>
								<li>
									<strong>Identity Documents:</strong> Aadhaar, PAN, Driving
									License, Voter ID (for verification purposes)
								</li>
								<li>
									<strong>Shipping Address:</strong> Delivery and pickup
									locations for transactions
								</li>
							</ul>
						</div>

						<div className="bg-indigo-50 rounded-xl p-6">
							<h4 className="text-xl font-bold text-gray-800 mb-3">
								📍 Location Data
							</h4>
							<p className="text-gray-700">
								With your explicit permission, we collect location data from
								your device using GPS, Wi-Fi, and mobile network. This helps us:
							</p>
							<ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-3">
								<li>
									Connect you with nearby farmers, buyers, and service providers
								</li>
								<li>Provide accurate delivery and pickup services</li>
								<li>Show region-specific crop prices and market information</li>
								<li>Verify service provider visits and worker bookings</li>
							</ul>
						</div>

						<div className="bg-purple-50 rounded-xl p-6">
							<h4 className="text-xl font-bold text-gray-800 mb-3">
								💻 Usage Data
							</h4>
							<p className="text-gray-700 mb-3">We automatically collect:</p>
							<ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
								<li>IP address, browser type, device information</li>
								<li>Pages visited, time spent on platform, search queries</li>
								<li>Clicks, navigation patterns, and feature usage</li>
								<li>Error logs and performance data</li>
							</ul>
						</div>
					</div>
				</div>

				{/* Section 2: How We Use Your Information */}
				<div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 mb-8 border border-blue-100">
					<h3 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-3">
						<Eye className="w-8 h-8" />
						2. How We Use Your Information
					</h3>

					<div className="grid md:grid-cols-2 gap-6">
						{[
							{
								title: "🛒 Platform Operations",
								items: [
									"Process crop listings and purchases",
									"Facilitate worker and tractor bookings",
									"Handle payments and refunds",
									"Verify user identities",
								],
							},
							{
								title: "📞 Communication",
								items: [
									"Order confirmations and updates",
									"Customer support responses",
									"Marketing communications (with consent)",
									"Important service announcements",
								],
							},
							{
								title: "📊 Analytics & Improvement",
								items: [
									"Analyze usage patterns",
									"Improve platform performance",
									"Develop new features",
									"Personalize user experience",
								],
							},
							{
								title: "⚖️ Legal Compliance",
								items: [
									"Comply with Indian laws",
									"Prevent fraud and abuse",
									"Resolve disputes",
									"Enforce our terms of service",
								],
							},
						].map((section, index) => (
							<div
								key={index}
								className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6"
							>
								<h4 className="text-lg font-bold text-gray-800 mb-3">
									{section.title}
								</h4>
								<ul className="space-y-2 text-gray-700">
									{section.items.map((item, idx) => (
										<li key={idx} className="flex items-start gap-2">
											<span className="text-blue-600 font-bold">•</span>
											{item}
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>

				{/* Section 3: Data Sharing */}
				<div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 mb-8 border border-blue-100">
					<h3 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-3">
						<Globe className="w-8 h-8" />
						3. Data Sharing & Third Parties
					</h3>

					<div className="space-y-4 text-gray-700 leading-relaxed">
						<p>
							<strong>
								We do NOT sell your personal data to third parties.
							</strong>{" "}
							However, we may share your information with:
						</p>

						<div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
							<ul className="space-y-3">
								<li>
									<strong>🏦 Payment Processors:</strong> Razorpay, Paytm, and
									other gateways for secure transactions
								</li>
								<li>
									<strong>🚚 Logistics Partners:</strong> For delivery and
									pickup services
								</li>
								<li>
									<strong>👷 Service Providers:</strong> Workers and tractor
									owners for fulfilling bookings
								</li>
								<li>
									<strong>📊 Analytics Tools:</strong> Google Analytics,
									Firebase for platform improvement (anonymized data)
								</li>
								<li>
									<strong>⚖️ Legal Authorities:</strong> When required by law or
									to protect rights and safety
								</li>
							</ul>
						</div>

						<p className="mt-4">
							<strong>Anonymized Data:</strong> We may share aggregated,
							non-personally identifiable data with partners for research,
							market analysis, and advertising purposes.
						</p>
					</div>
				</div>

				{/* Section 4: Data Security */}
				<div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 mb-8 border border-blue-100">
					<h3 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-3">
						<Lock className="w-8 h-8" />
						4. Data Security & Protection
					</h3>

					<div className="space-y-4 text-gray-700 leading-relaxed">
						<p>
							We implement industry-standard security measures to protect your{" "}
						</p>

						<div className="grid md:grid-cols-2 gap-4 mt-4">
							{[
								{
									icon: "🔐",
									title: "Encryption",
									desc: "SSL/TLS encryption for data transmission",
								},
								{
									icon: "🛡️",
									title: "Secure Storage",
									desc: "Encrypted databases with access controls",
								},
								{
									icon: "🔒",
									title: "Authentication",
									desc: "Multi-factor authentication options",
								},
								{
									icon: "👁️",
									title: "Monitoring",
									desc: "24/7 security monitoring and threat detection",
								},
								{
									icon: "🔄",
									title: "Backups",
									desc: "Regular data backups and disaster recovery",
								},
								{
									icon: "👥",
									title: "Access Control",
									desc: "Limited employee access on need-to-know basis",
								},
							].map((item, index) => (
								<div
									key={index}
									className="bg-blue-50 rounded-lg p-4 flex items-start gap-3"
								>
									<span className="text-2xl">{item.icon}</span>
									<div>
										<h4 className="font-bold text-gray-800">{item.title}</h4>
										<p className="text-sm text-gray-600">{item.desc}</p>
									</div>
								</div>
							))}
						</div>

						<p className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
							<strong>⚠️ Important:</strong> While we take extensive security
							measures, no system is 100% secure. Please use strong passwords
							and keep your account credentials confidential.
						</p>
					</div>
				</div>

				{/* Section 5: Data Retention */}
				<div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 mb-8 border border-blue-100">
					<h3 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-3">
						<FileText className="w-8 h-8" />
						5. Data Retention
					</h3>

					<div className="space-y-4 text-gray-700 leading-relaxed">
						<p>
							We retain your personal data only as long as necessary for the
							purposes outlined in this policy:
						</p>
						<ul className="list-disc list-inside space-y-2 ml-4">
							<li>
								<strong>Active Accounts:</strong> Data retained while your
								account is active
							</li>
							<li>
								<strong>Transaction Records:</strong> Retained for 7 years as
								per Indian tax and accounting laws
							</li>
							<li>
								<strong>Legal Compliance:</strong> Retained as required by
								applicable laws and regulations
							</li>
							<li>
								<strong>Dispute Resolution:</strong> Retained until disputes are
								resolved
							</li>
							<li>
								<strong>Usage Data:</strong> Generally retained for shorter
								periods (12-24 months)
							</li>
						</ul>
						<p className="mt-4 font-semibold">
							Upon account deletion, we will delete or anonymize your personal
							data within 90 days, except where retention is required by law.
						</p>
					</div>
				</div>

				{/* Section 6: Your Rights */}
				<div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 mb-8 border border-blue-100 bg-gradient-to-br from-green-50 to-emerald-50">
					<h3 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
						<UserCheck className="w-8 h-8" />
						6. Your Privacy Rights
					</h3>

					<div className="space-y-4 text-gray-700 leading-relaxed">
						<p className="font-semibold">
							Under Indian data protection laws, you have the right to:
						</p>

						<div className="grid md:grid-cols-2 gap-4">
							{[
								{
									icon: "👁️",
									title: "Access",
									desc: "Request a copy of your personal data",
								},
								{
									icon: "✏️",
									title: "Correction",
									desc: "Update or correct inaccurate information",
								},
								{
									icon: "🗑️",
									title: "Deletion",
									desc: "Request deletion of your personal data",
								},
								{
									icon: "⛔",
									title: "Opt-Out",
									desc: "Unsubscribe from marketing communications",
								},
								{
									icon: "🔒",
									title: "Restrict Processing",
									desc: "Limit how we use your data",
								},
								{
									icon: "📦",
									title: "Data Portability",
									desc: "Receive your data in a structured format",
								},
							].map((item, index) => (
								<div
									key={index}
									className="bg-white rounded-lg p-4 shadow-md border border-green-100"
								>
									<div className="flex items-center gap-3 mb-2">
										<span className="text-2xl">{item.icon}</span>
										<h4 className="font-bold text-gray-800">{item.title}</h4>
									</div>
									<p className="text-sm text-gray-600">{item.desc}</p>
								</div>
							))}
						</div>

						<p className="mt-6 bg-green-100 border-l-4 border-green-500 p-4 rounded-r-lg">
							<strong>✉️ To exercise your rights:</strong> Contact us at
							privacy@cropconnect.com or call +91 98765 43210. We will respond
							within 30 days.
						</p>
					</div>
				</div>

				{/* Section 7: Cookies */}
				<div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 mb-8 border border-blue-100">
					<h3 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-3">
						<Bell className="w-8 h-8" />
						7. Cookies & Tracking Technologies
					</h3>

					<div className="space-y-4 text-gray-700 leading-relaxed">
						<p>
							We use cookies and similar technologies to enhance your
							experience:
						</p>

						<div className="space-y-3">
							<div className="bg-blue-50 p-4 rounded-lg">
								<h4 className="font-bold mb-2">🍪 Essential Cookies</h4>
								<p className="text-sm">
									Required for platform functionality (login, cart, security)
								</p>
							</div>
							<div className="bg-indigo-50 p-4 rounded-lg">
								<h4 className="font-bold mb-2">📊 Analytics Cookies</h4>
								<p className="text-sm">
									Help us understand how users interact with our platform
								</p>
							</div>
							<div className="bg-purple-50 p-4 rounded-lg">
								<h4 className="font-bold mb-2">📢 Marketing Cookies</h4>
								<p className="text-sm">
									Used to show relevant ads and measure campaign effectiveness
								</p>
							</div>
						</div>

						<p className="mt-4">
							You can manage cookie preferences through your browser settings.
							Note that disabling cookies may limit platform functionality.
						</p>
					</div>
				</div>

				{/* Section 8: Children's Privacy */}
				<div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 mb-8 border border-blue-100">
					<h3 className="text-2xl font-bold text-blue-800 mb-4">
						8. Children's Privacy
					</h3>
					<p className="text-gray-700 leading-relaxed">
						CropConnect is not intended for users under 18 years of age. We do
						not knowingly collect personal information from children. If you
						believe we have collected data from a child, please contact us
						immediately at privacy@cropconnect.com, and we will take steps to
						delete such information.
					</p>
				</div>

				{/* Section 9: Changes to Privacy Policy */}
				<div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 mb-12 border border-blue-100">
					<h3 className="text-2xl font-bold text-blue-800 mb-4">
						9. Updates to This Policy
					</h3>
					<p className="text-gray-700 leading-relaxed mb-4">
						We may update this Privacy Policy from time to time to reflect
						changes in our practices or applicable laws. We will notify you of
						significant changes via email or platform notification.
					</p>
					<p className="text-gray-700 font-semibold">
						Your continued use of CropConnect after policy updates constitutes
						acceptance of the revised policy. Please review this page
						periodically.
					</p>
				</div>

				{/* Contact Section */}
				<div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 md:p-10 text-white">
					<h3 className="text-3xl font-bold mb-6 text-center">
						📧 Contact Our Privacy Team
					</h3>
					<div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
						<div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
							<h4 className="font-bold text-lg mb-3">
								Data Protection Officer
							</h4>
							<p className="leading-relaxed">
								<strong>CropConnect Technologies Pvt. Ltd.</strong>
								<br />
								123 Tech Park, Whitefield
								<br />
								Bangalore 560066, Karnataka, India
							</p>
						</div>
						<div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
							<h4 className="font-bold text-lg mb-3">Get Privacy Support</h4>
							<p className="leading-relaxed">
								📧 Email: privacy@cropconnect.com
								<br />
								📞 Phone: +91 98765 43210
								<br />⏰ Mon-Sat: 9 AM - 6 PM IST
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PrivacyPolicy;
