import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TermsOfService() {
	const { user } = useAuth();
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12">
				<div className="max-w-4xl mx-auto px-4">
					<h1 className="text-4xl font-bold flex items-center gap-3"><FileText className="w-10 h-10" />Terms of Service</h1>
					<p className="text-gray-300 mt-2">Last Updated: November 7, 2024</p>
				</div>
			</div>
			<div className="max-w-4xl mx-auto px-4 py-12">
				<div className="bg-white rounded-xl shadow-lg p-8 prose prose-lg max-w-none">
					<h2>1. Acceptance of Terms</h2>
					<p>By using CropConnect, you agree to these terms. CropConnect connects Farmers, Buyers, Workers, and Tractor Owners across India.</p>
					
					<h2>2. User Responsibilities</h2>
					<p><strong>Farmers:</strong> Provide accurate crop info, honor orders, comply with APMC regulations.</p>
					<p><strong>Buyers:</strong> Complete payments, inspect deliveries, raise disputes within 24 hours.</p>
					<p><strong>Workers:</strong> Complete work professionally, follow safety protocols, 18+ with valid ID.</p>
					<p><strong>Tractor Owners:</strong> Maintain valid registration/insurance, honor bookings.</p>

					<h2>3. Payments</h2>
					<p>Platform Fee: Farmers 2%, Tractor Owners 5%, Others 0%. GST 5% on fees. Escrow system protects both parties.</p>

					<h2>4. Cancellation Policy</h2>
					<p>48+ hours: Free. 24-48 hours: 25% charge. &lt;24 hours: 50% charge. Force majeure: Full refund.</p>

					<h2>5. Liability</h2>
					<p>CropConnect is a marketplace platform. We don't guarantee crop quality or service delivery. Users transact at own risk.</p>

					<h2>6. Intellectual Property</h2>
					<p>All content, logos, trademarks owned by CropConnect. Users retain rights to their listings/content.</p>

					<h2>7. Governing Law</h2>
					<p>Governed by Indian law. Disputes subject to Hyderabad jurisdiction.</p>

					<p className="text-sm text-gray-600 mt-8">Contact: legal@cropconnect.com | Phone: +91 6309639767</p>
				</div>
				<div className="mt-8 text-center">
					<Link to={user ? `/${user.role.toLowerCase()}-dashboard` : '/'} className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700">
						<ArrowLeft className="w-5 h-5" />Back to Dashboard
					</Link>
				</div>
			</div>
		</div>
	);
}