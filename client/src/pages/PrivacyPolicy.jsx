import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PrivacyPolicy() {
	const { user } = useAuth();
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12">
				<div className="max-w-4xl mx-auto px-4">
					<h1 className="text-4xl font-bold flex items-center gap-3"><Shield className="w-10 h-10" />Privacy Policy</h1>
					<p className="text-blue-200 mt-2">Your privacy is our priority. Last Updated: November 7, 2024</p>
				</div>
			</div>
			<div className="max-w-4xl mx-auto px-4 py-12">
				<div className="bg-white rounded-xl shadow-lg p-8 prose prose-lg max-w-none">
					<h2>1. Information We Collect</h2>
					<p><strong>Personal Data:</strong> Name, phone, email, Aadhaar (hashed), bank details, address, photos.</p>
					<p><strong>Usage Data:</strong> IP address, browser type, pages visited, device info, location (GPS for deliveries).</p>
					<p><strong>Transaction Data:</strong> Payment history, orders, bookings, ratings/reviews.</p>

					<h2>2. How We Use Your Data</h2>
					<ul>
						<li>Facilitate transactions between users</li>
						<li>Process payments via Razorpay (PCI-DSS compliant)</li>
						<li>Send SMS/email notifications for orders, bookings</li>
						<li>Improve platform features using analytics</li>
						<li>Comply with legal requirements (GST, tax reporting)</li>
					</ul>

					<h2>3. Data Sharing</h2>
					<p>We share data with: Payment processors (Razorpay), Logistics partners (for delivery tracking), Government agencies (tax compliance), Other users (contact info for confirmed transactions only).</p>
					<p><strong>We NEVER sell your data to third parties.</strong></p>

					<h2>4. Data Security</h2>
					<p>256-bit SSL encryption. Passwords hashed with bcrypt. PCI-DSS Level 1 compliance for payments. Regular security audits. Two-factor authentication available.</p>

					<h2>5. Your Rights</h2>
					<ul>
						<li>Access your data: Request export anytime</li>
						<li>Correct inaccuracies: Update profile anytime</li>
						<li>Delete account: Contact support (data retained 3 years for legal compliance)</li>
						<li>Opt-out: Unsubscribe from marketing emails (transactional emails continue)</li>
					</ul>

					<h2>6. Cookies</h2>
					<p>We use cookies for authentication, preferences, analytics. You can disable cookies in browser settings (may affect functionality).</p>

					<h2>7. Third-Party Services</h2>
					<p>Google Maps (location services), Razorpay (payments), AWS (cloud hosting). Each has their own privacy policies.</p>

					<h2>8. Children's Privacy</h2>
					<p>Platform restricted to users 18+. We don't knowingly collect data from minors.</p>

					<h2>9. Changes to Policy</h2>
					<p>We may update this policy. Users notified via email 30 days before changes take effect.</p>

					<h2>10. Contact Us</h2>
					<p>Data Protection Officer: privacy@cropconnect.com | Phone: +91 6309639767</p>
					<p>Address: Agricultural Innovation Hub, Hyderabad, Telangana 500001</p>

					<div className="bg-green-50 border-l-4 border-green-600 p-4 mt-6">
						<p className="text-sm font-semibold">✓ GDPR Compliant | ✓ ISO 27001 Certified | ✓ PCI-DSS Level 1</p>
					</div>
				</div>
				<div className="mt-8 text-center">
					<Link to={user ? `/${user.role.toLowerCase()}-dashboard` : '/'} className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
						<ArrowLeft className="w-5 h-5" />Back to Dashboard
					</Link>
				</div>
			</div>
		</div>
	);
}