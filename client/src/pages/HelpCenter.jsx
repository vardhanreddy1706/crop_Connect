import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, Phone, Mail, MessageCircle, Book, User, Tractor, Briefcase, ShoppingCart, ExternalLink, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HelpCenter() {
	const { user } = useAuth();
	const [searchTerm, setSearchTerm] = useState('');
	const [activeCategory, setActiveCategory] = useState('all');
	const [expandedFaq, setExpandedFaq] = useState(null);

	const categories = [
		{ id: 'all', label: 'All Topics', icon: Book },
		{ id: 'farmer', label: 'For Farmers', icon: User },
		{ id: 'buyer', label: 'For Buyers', icon: ShoppingCart },
		{ id: 'worker', label: 'For Workers', icon: Briefcase },
		{ id: 'tractor', label: 'For Tractor Owners', icon: Tractor },
	];

	const faqs = [
		// Farmer FAQs
		{
			category: 'farmer',
			question: 'How do I list my crops for sale on CropConnect?',
			answer: 'Navigate to your Farmer Dashboard → Click "Post New Crop" → Fill in crop details (type, variety, quantity, price/quintal) → Add quality grade (A, B, C) → Upload clear photos → Set availability date → Submit. Your listing appears instantly in the marketplace for buyers to discover.'
		},
		{
			category: 'farmer',
			question: 'What are the best prices I can get for my crops?',
			answer: 'Check our live market rates updated daily from AGMARKNET and e-NAM. We show MSP (Minimum Support Price) for 23 crops. Compare with nearby mandi rates. Set competitive prices 5-10% above mandi to attract direct buyers and eliminate middlemen commission.'
		},
		{
			category: 'farmer',
			question: 'How do I request tractor services?',
			answer: 'Go to "Tractor Services" → Filter by location (within 50km) → Select service type (plowing/tilling, seeding, harvesting, spraying) → Choose date and time → Submit request. Tractor owners respond within 24 hours. Compare rates (₹800-1200/acre for plowing).'
		},
		{
			category: 'farmer',
			question: 'What government schemes can I access?',
			answer: 'PM-KISAN: ₹6000/year direct benefit transfer (pmkisan.gov.in). Kisan Credit Card: Loans up to ₹3 lakh at 4% interest. PM Fasal Bima Yojana: Crop insurance at 2% premium (pmfby.gov.in). Soil Health Card: Free soil testing. e-NAM: Online mandi trading.'
		},
		{
			category: 'farmer',
			question: 'How do I hire farm workers?',
			answer: 'Post work requirements → Specify type (harvesting, irrigation, pesticide spraying) → Set daily wage (₹300-600/day based on skill) → Workers apply → Review profiles and experience → Accept booking → Workers arrive on scheduled date.'
		},

		// Buyer FAQs
		{
			category: 'buyer',
			question: 'How do I place an order for crops?',
			answer: 'Browse Crops → Filter by type, location, quality grade → Add to cart → Specify quantity (minimum 10 quintals) → Enter delivery address → Choose payment method → Verify order details → Complete payment via Razorpay. Confirmation SMS/email sent instantly.'
		},
		{
			category: 'buyer',
			question: 'What are the payment methods accepted?',
			answer: 'UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards (Visa, MasterCard, RuPay), Net Banking (all major banks), Wallets (Paytm, Mobikwik). All transactions via secure Razorpay gateway with 256-bit SSL encryption. Payment held in escrow until delivery confirmed.'
		},
		{
			category: 'buyer',
			question: 'How do I track my crop orders?',
			answer: 'Dashboard → "My Orders" tab → Real-time status (Processing, In Transit, Delivered) → Live GPS tracking of delivery vehicle → Driver contact number → Estimated delivery time. Receive SMS updates at each milestone.'
		},
		{
			category: 'buyer',
			question: 'What if crops are not as described?',
			answer: 'Inspect delivery before acceptance. If quality mismatch, reject shipment → Contact support immediately → Upload photos → Dispute resolved within 48 hours → Full refund processed. Quality disputes handled by third-party agricultural expert assessment.'
		},
		{
			category: 'buyer',
			question: 'Can I get bulk discounts?',
			answer: 'Orders >50 quintals: 5% discount. >100 quintals: 8% discount. >500 quintals: 12% discount + free delivery. Contract farming available for seasonal bulk orders with fixed pricing agreements.'
		},

		// Worker FAQs
		{
			category: 'worker',
			question: 'How do I find work opportunities near me?',
			answer: 'Dashboard → "Available Work" → Filter by location (50km radius), work type, payment range → See 50-200 opportunities daily → Apply with one click → Farmers review and accept within 24 hours. Set job alerts for new postings.'
		},
		{
			category: 'worker',
			question: 'What types of work can I find?',
			answer: 'Harvesting (₹400-600/day), Irrigation management (₹350-500/day), Pesticide/fertilizer application (₹500-700/day), Ploughing assistance (₹400-550/day), Seeding/transplanting (₹350-500/day), General farm labor (₹300-450/day). Seasonal work during harvest peaks.'
		},
		{
			category: 'worker',
			question: 'How do I receive my payments?',
			answer: 'After completing work, farmer marks as "Complete" → You confirm → Payment released to your bank account within 2-3 business days via NEFT/IMPS. Add bank details in Profile → Payments section. View earning history and download payment receipts.'
		},
		{
			category: 'worker',
			question: 'Can I post my services and get hired directly?',
			answer: 'Yes! "My Services" → Add skills (tractor driving, pesticide spraying, irrigation expert) → Set daily rate → Upload experience certificates → Add Aadhaar/voter ID for verification → Farmers directly book your services. Build ratings for more opportunities.'
		},
		{
			category: 'worker',
			question: 'What safety measures are provided?',
			answer: 'Accidental insurance coverage during work hours. PPE (Personal Protective Equipment) mandatory for pesticide work. Training videos for safe chemical handling. Emergency contact numbers. Health check-up camps organized quarterly.'
		},

		// Tractor Owner FAQs
		{
			category: 'tractor',
			question: 'How do I list my tractor for hire?',
			answer: 'Dashboard → "My Services" → Enter tractor details (Brand: Mahindra/John Deere/Swaraj, Model, HP: 35-75, Year) → Service types (plowing, rotavator, seed drill, harvester) → Set rates: ₹800-1200/acre for plowing, ₹150-200/hour → Add availability calendar → Submit.'
		},
		{
			category: 'tractor',
			question: 'What are typical service charges?',
			answer: 'Plowing/Tilling: ₹800-1200/acre. Rotavator: ₹900-1300/acre. Seed Drill: ₹400-600/acre. Harvester/Thresher: ₹1500-2000/acre. Spraying: ₹200-300/acre. Transportation: ₹15-20/km. Rates vary by region, soil type, and tractor HP.'
		},
		{
			category: 'tractor',
			question: 'How are bookings confirmed and scheduled?',
			answer: 'Farmers send requests with date, location, land size → Review details (distance, work type, payment) → Accept/Reject → Coordinate via call → Arrive at scheduled time → Complete work → Farmer confirms → Payment released within 24 hours.'
		},
		{
			category: 'tractor',
			question: 'What if a farmer cancels a booking?',
			answer: 'Cancellation >48 hours before: Free, full refund. 24-48 hours: 25% cancellation charge to you. <24 hours: 50% charge. No-shows: Full payment to you. Policy protects your time and fuel costs.'
		},
		{
			category: 'tractor',
			question: 'How do I maintain good ratings?',
			answer: 'Arrive on time, complete work efficiently, maintain equipment properly, communicate clearly, be professional. 4.5+ star rating gets "Verified Pro" badge, priority listing, 20% more bookings. Top performers get featured placement.'
		},
	];

	const resources = [
		{
			title: 'PM-KISAN Scheme',
			desc: 'Direct income support of ₹6000/year to farmer families. Check status and apply.',
			link: 'https://pmkisan.gov.in',
			category: 'farmer'
		},
		{
			title: 'Kisan Credit Card (KCC)',
			desc: 'Get agricultural credit up to ₹3 lakh at 4% interest. Apply online.',
			link: 'https://www.nabard.org/content1.aspx?id=570&catid=23',
			category: 'farmer'
		},
		{
			title: 'PM Fasal Bima Yojana (Crop Insurance)',
			desc: 'Protect crops from natural calamities. Premium: 2% for Kharif, 1.5% for Rabi.',
			link: 'https://pmfby.gov.in',
			category: 'farmer'
		},
		{
			title: 'e-NAM (National Agriculture Market)',
			desc: 'Online trading platform for agricultural commodities. Register as farmer/buyer.',
			link: 'https://www.enam.gov.in',
			category: 'all'
		},
		{
			title: 'Soil Health Card Scheme',
			desc: 'Get free soil testing and nutrient recommendations every 3 years.',
			link: 'https://soilhealth.dac.gov.in',
			category: 'farmer'
		},
		{
			title: 'AGMARKNET - Market Prices',
			desc: 'Daily mandi prices for 300+ commodities across 3000 markets.',
			link: 'https://agmarknet.gov.in',
			category: 'all'
		},
		{
			title: 'Kisan Call Center',
			desc: '24x7 helpline for agricultural queries: 1800-180-1551 (toll-free)',
			link: 'https://mkisan.gov.in/Home/KCC',
			category: 'farmer'
		},
		{
			title: 'mKisan Portal',
			desc: 'SMS-based advisories on weather, market prices, pest alerts.',
			link: 'https://mkisan.gov.in',
			category: 'farmer'
		},
	];

	const filteredFaqs = faqs.filter(faq => 
		(activeCategory === 'all' || faq.category === activeCategory) &&
		(faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
		 faq.answer.toLowerCase().includes(searchTerm.toLowerCase()))
	);

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50">
			{/* Header */}
			<div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white py-20">
				<div className="max-w-4xl mx-auto px-4 text-center">
					<h1 className="text-5xl font-bold mb-4">CropConnect Help Center</h1>
					<p className="text-xl text-green-100 mb-8">Get instant answers to your questions</p>
					
					{/* Search Bar */}
					<div className="max-w-2xl mx-auto relative">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
						<input
							type="text"
							placeholder="Search for help... (e.g., 'how to list crops', 'payment methods')"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-900 text-lg focus:ring-4 focus:ring-green-300 outline-none shadow-xl"
						/>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 py-12">
				{/* Categories */}
				<div className="flex flex-wrap justify-center gap-4 mb-12">
					{categories.map(cat => {
						const Icon = cat.icon;
						return (
							<button
								key={cat.id}
								onClick={() => setActiveCategory(cat.id)}
								className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition shadow-md ${
									activeCategory === cat.id
										? 'bg-green-600 text-white shadow-lg scale-105'
										: 'bg-white text-gray-700 hover:bg-green-50 hover:scale-102'
								}`}
							>
								<Icon className="w-5 h-5" />
								{cat.label}
							</button>
						);
					})}
				</div>

				<div className="grid lg:grid-cols-3 gap-8">
					{/* FAQs */}
					<div className="lg:col-span-2">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							Frequently Asked Questions
							<span className="text-sm font-normal text-gray-600 ml-3">({filteredFaqs.length} results)</span>
						</h2>
						
						{filteredFaqs.length === 0 ? (
							<div className="bg-white rounded-xl shadow-md p-12 text-center">
								<Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
								<p className="text-gray-600">No results found. Try different keywords.</p>
							</div>
						) : (
							<div className="space-y-4">
								{filteredFaqs.map((faq, idx) => (
									<div key={idx} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
										<button
											onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
											className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
										>
											<span className="font-semibold text-left text-gray-900 pr-4">{faq.question}</span>
											<ChevronDown className={`w-5 h-5 text-green-600 flex-shrink-0 transition-transform ${expandedFaq === idx ? 'rotate-180' : ''}`} />
										</button>
										{expandedFaq === idx && (
											<div className="px-6 py-4 bg-gradient-to-br from-gray-50 to-green-50 border-t">
												<p className="text-gray-700 leading-relaxed">{faq.answer}</p>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Contact Support */}
						<div className="bg-white rounded-xl shadow-md p-6">
							<h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
								<Phone className="w-5 h-5 text-green-600" />
								Contact Support
							</h3>
							<div className="space-y-4">
								<a href="tel:+916309639767" className="flex items-center gap-3 text-gray-700 hover:text-green-600 p-3 rounded-lg hover:bg-green-50 transition">
									<Phone className="w-5 h-5" />
									<div>
										<div className="font-semibold">Call Us</div>
										<div className="text-sm">+91 6309639767</div>
									</div>
								</a>
								<a href="mailto:support@cropconnect.com" className="flex items-center gap-3 text-gray-700 hover:text-green-600 p-3 rounded-lg hover:bg-green-50 transition">
									<Mail className="w-5 h-5" />
									<div>
										<div className="font-semibold">Email</div>
										<div className="text-sm">support@cropconnect.com</div>
									</div>
								</a>
								<button className="flex items-center gap-3 text-gray-700 hover:text-green-600 p-3 rounded-lg hover:bg-green-50 transition w-full">
									<MessageCircle className="w-5 h-5" />
									<div className="text-left">
										<div className="font-semibold">Live Chat</div>
										<div className="text-sm">Available 24/7</div>
									</div>
								</button>
							</div>
						</div>

						{/* Government Resources */}
						<div className="bg-white rounded-xl shadow-md p-6">
							<h3 className="text-xl font-bold text-gray-900 mb-4">Government Resources</h3>
							<div className="space-y-3">
								{resources.filter(r => activeCategory === 'all' || r.category === activeCategory || r.category === 'all').map((res, idx) => (
									<a
										key={idx}
										href={res.link}
										target="_blank"
										rel="noopener noreferrer"
										className="block p-3 rounded-lg hover:bg-gradient-to-br hover:from-green-50 hover:to-blue-50 border border-gray-200 transition group"
									>
										<div className="flex justify-between items-start gap-2">
											<div>
												<h4 className="font-semibold text-gray-900 text-sm group-hover:text-green-600">{res.title}</h4>
												<p className="text-xs text-gray-600 mt-1">{res.desc}</p>
											</div>
											<ExternalLink className="w-4 h-4 text-green-600 flex-shrink-0" />
										</div>
									</a>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Back to Dashboard */}
				<div className="mt-12 text-center">
					<Link
						to={user ? `/${user.role.toLowerCase()}-dashboard` : '/'}
						className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition shadow-lg hover:shadow-xl"
					>
						<ArrowLeft className="w-5 h-5" />
						Back to Dashboard
					</Link>
				</div>
			</div>
		</div>
	);
}