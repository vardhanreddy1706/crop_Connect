import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, TrendingUp, Droplet, Sprout, Sun, Cloud, Bug, Tractor as TractorIcon, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Blog() {
	const { user } = useAuth();
	const [activeFilter, setActiveFilter] = useState('all');

	const categories = [
		{ id: 'all', label: 'All Articles', icon: Sprout },
		{ id: 'farming', label: 'Farming Tips', icon: Sun },
		{ id: 'market', label: 'Market Trends', icon: TrendingUp },
		{ id: 'technology', label: 'Agri-Tech', icon: TractorIcon },
		{ id: 'weather', label: 'Weather & Season', icon: Cloud },
	];

	const articles = [
		{
			id: 1,
			category: 'farming',
			title: '10 Best Practices for Organic Farming in India',
			excerpt: 'Learn sustainable organic farming techniques that increase yield by 40% while reducing chemical dependency. Government certification process explained.',
			author: 'Dr. Ramesh Kumar',
			date: '2024-11-05',
			readTime: '8 min read',
			image: '🌾',
			content: {
				introduction: 'Organic farming is gaining momentum in India with government support through PKVY (Paramparagat Krishi Vikas Yojana) offering ₹50,000/hectare for 3 years.',
				practices: [
					'Vermicomposting: Use earthworms to convert organic waste into nutrient-rich fertilizer',
					'Crop Rotation: Alternate legumes with cereals to maintain soil nitrogen levels',
					'Green Manuring: Plant Sesbania/Dhaincha before main crop for natural fertilization',
					'Neem-based Pesticides: Natural pest control using neem oil spray (2ml/liter water)',
					'Mulching: Cover soil with organic matter to retain moisture and suppress weeds',
					'Bio-fertilizers: Rhizobium, Azotobacter for nitrogen fixation',
					'Integrated Pest Management: Pheromone traps, sticky traps for pest monitoring',
					'Composting: Create nutrient-rich compost from farm waste in 45-60 days',
					'Water Conservation: Drip irrigation reduces water use by 50%',
					'Soil Testing: Get free soil health cards every 3 years from government'
				],
				benefits: 'Premium pricing: 20-30% higher than conventional produce. Certification: APEDA organic certification opens export markets.',
				resources: 'Apply for PKVY: agricoop.nic.in | Organic certification: apeda.gov.in'
			}
		},
		{
			id: 2,
			category: 'market',
			title: 'Understanding MSP and How to Get Better Prices for Your Crops',
			excerpt: 'Navigate MSP (Minimum Support Price) system, e-NAM platform, and direct buyer connections to maximize your crop income.',
			author: 'Priya Sharma',
			date: '2024-11-03',
			readTime: '6 min read',
			image: '📈',
			content: {
				introduction: 'MSP is announced for 23 crops by CACP (Commission for Agricultural Costs & Prices). Kharif 2024: Paddy ₹2183/quintal, Jowar ₹3180/quintal.',
				strategies: [
					'Check Daily Rates: AGMARKNET (agmarknet.gov.in) shows live mandi prices across India',
					'e-NAM Registration: Trade online, eliminate middlemen, get better prices',
					'Direct Selling: CropConnect connects you with bulk buyers, wholesalers',
					'Storage Options: Warehouse receipts allow selling when prices peak',
					'Futures Trading: Learn commodity futures for price risk management',
					'Quality Grading: A-grade crops fetch 15-20% premium prices',
					'Timing: Avoid immediate post-harvest glut, store 2-3 months if possible',
					'Bulk Selling: Form Farmer Producer Organizations (FPOs) for collective bargaining'
				],
				currentMSP: 'Wheat: ₹2275/quintal | Rice: ₹2183/quintal | Cotton: ₹6620/quintal | Soybean: ₹4600/quintal',
				resources: 'e-NAM: enam.gov.in | MSP list: cacp.dacnet.nic.in | Market prices: agmarknet.gov.in'
			}
		},
		{
			id: 3,
			category: 'technology',
			title: 'How Drip Irrigation Can Save 60% Water and Increase Yield',
			excerpt: 'Complete guide to drip irrigation installation, government subsidies (90% for small farmers), and ROI calculations.',
			author: 'Eng. Suresh Patil',
			date: '2024-10-28',
			readTime: '10 min read',
			image: '💧',
			content: {
				introduction: 'Drip irrigation delivers water directly to plant roots, reducing evaporation. Government subsidy: 55% (general), 90% (SC/ST/small farmers) under PMKSY.',
				benefits: [
					'Water Saving: 40-70% less water than flood irrigation',
					'Yield Increase: 30-50% higher production due to consistent moisture',
					'Fertilizer Efficiency: Fertigation (fertilizer through drip) saves 25-30% nutrients',
					'Labor Reduction: Automated systems reduce irrigation labor by 80%',
					'Weed Control: Only irrigated area gets water, reduces weed growth',
					'Disease Prevention: Dry foliage reduces fungal diseases',
					'Energy Saving: Lower pumping costs due to less water usage'
				],
				costs: 'Installation: ₹40,000-60,000 per acre. After 90% subsidy: ₹4,000-6,000 out of pocket. Payback period: 1.5-2 years from increased yield.',
				maintenance: 'Flush system weekly. Replace filters every season. Check emitters monthly. Clean with acid treatment annually.',
				subsidy: 'Apply through: State Agriculture Department | PMKSY portal: pmksy.gov.in | Contact nearest Krishi Vigyan Kendra'
			}
		},
		{
			id: 4,
			category: 'weather',
			title: 'Monsoon 2024 Forecast: Crop Planning Guide',
			excerpt: 'IMD predicts normal monsoon (96-104% of LPA). District-wise rainfall forecasts and crop selection strategies.',
			author: 'Dr. Anjali Deshmukh',
			date: '2024-10-25',
			readTime: '7 min read',
			image: '🌧️',
			content: {
				forecast: 'IMD (India Meteorological Department) predicts 101% of Long Period Average (LPA) rainfall for 2024. El Niño weakening, positive IOD expected.',
				zoneWise: [
					'Northwest India: 98% LPA - Good for wheat, mustard, gram',
					'Central India: 103% LPA - Excellent for soybean, cotton, maize',
					'Northeast: 105% LPA - Ideal for rice, jute, tea',
					'South Peninsula: 99% LPA - Suitable for groundnut, cotton, pulses'
				],
				cropPlanning: [
					'Excess Rain Areas (>110% LPA): Choose waterlogging-tolerant crops like rice varieties (Swarna, MTU-1010)',
					'Deficit Rain Areas (<90% LPA): Drought-resistant crops like bajra, jowar, pulses (tur, moong)',
					'Normal Rain: Traditional Kharif crops - paddy, cotton, soybean, groundnut',
					'Late Monsoon: Short-duration varieties (90-100 days) to avoid late season drought'
				],
				insurance: 'Enroll in PMFBY before crop season starts. Premium: 2% for Kharif crops. Covers drought, flood, pest damage.',
				resources: 'IMD forecasts: mausam.imd.gov.in | Crop insurance: pmfby.gov.in | Agro-advisories: mkisan.gov.in'
			}
		},
		{
			id: 5,
			category: 'farming',
			title: 'Integrated Pest Management: Reduce Pesticide Costs by 50%',
			excerpt: 'Combine biological, cultural, and chemical methods for effective pest control. Learn about beneficial insects and organic alternatives.',
			author: 'Dr. Vikram Singh',
			date: '2024-10-20',
			readTime: '9 min read',
			image: '🐛',
			content: {
				introduction: 'IPM reduces pesticide dependency through smart monitoring and natural pest control. Saves ₹3,000-5,000 per acre on chemical costs.',
				methods: [
					'Monitoring: Install pheromone traps (₹50-100 each) to track pest population',
					'Biological Control: Release Trichogramma wasps (₹300/ha) for borer control',
					'Cultural Practices: Crop rotation breaks pest life cycles',
					'Mechanical Control: Light traps attract and kill night-flying insects',
					'Botanical Pesticides: Neem oil (Azadirachtin 1500 ppm) - ₹400/liter',
					'Resistant Varieties: BT cotton reduces bollworm damage by 80%',
					'Trap Crops: Plant marigold borders to attract pests away from main crop',
					'Beneficial Insects: Ladybugs eat 50 aphids/day, predatory beetles control caterpillars'
				],
				economicThreshold: 'Spray only when pest population crosses economic threshold level (ETL). For example, spray for stem borer only when 5% stems show dead hearts.',
				safety: 'Always wear PPE (mask, gloves, boots). Follow spray schedule to avoid residue. Pre-harvest interval: 7-15 days.',
				training: 'Free IPM training at Krishi Vigyan Kendras. Contact nearest KVK for workshops.'
			}
		},
		{
			id: 6,
			category: 'technology',
			title: 'Precision Agriculture: Using Drones and Sensors for Better Yields',
			excerpt: 'Drone technology for crop monitoring, soil sensors for smart irrigation, and satellite imagery for disease detection.',
			author: 'Tech Team CropConnect',
			date: '2024-10-15',
			readTime: '8 min read',
			image: '🚁',
			content: {
				introduction: 'Precision agriculture uses technology to optimize inputs (seeds, fertilizer, water) based on field variability. Increases efficiency by 20-30%.',
				technologies: [
					'Agricultural Drones: Spray pesticides (10 acres/hour vs 1 acre/hour manual). Cost: ₹2-3 lakh',
					'Soil Moisture Sensors: Real-time data prevents over/under irrigation. Cost: ₹500-2000 per sensor',
					'NDVI Mapping: Satellite imagery identifies crop stress zones. Free via ISRO Bhuvan',
					'GPS-Guided Tractors: Accurate seeding with 98% precision, reduces seed wastage',
					'Weather Stations: Micro-climate monitoring for optimal spray timing',
					'Yield Mapping: Harvester-mounted sensors create yield maps for next season planning'
				],
				benefits: '15-20% fertilizer saving through variable rate application. 25% reduction in pesticide use through targeted spraying.',
				subsidies: 'Drone subsidy: 40-50% under Agriculture Infrastructure Fund. Apply through DBT Agriculture portal.',
				training: 'Drone pilot training: ₹30,000-50,000 for DGCA certification. ROI: 6-12 months for service providers.'
			}
		},
		{
			id: 7,
			category: 'market',
			title: 'Export Opportunities for Indian Agricultural Products',
			excerpt: 'Tap into international markets for organic products, spices, rice. APEDA registration process and documentation guide.',
			author: 'Export Consultant Team',
			date: '2024-10-10',
			readTime: '11 min read',
			image: '🌍',
			content: {
				introduction: 'India exported $50 billion agricultural products in 2023. Top exports: Basmati rice, spices, tea, fruits, organic products.',
				topExports: [
					'Basmati Rice: $4.7 billion (Middle East, Europe, USA)',
					'Spices: $3.8 billion (USA, China, Bangladesh) - Turmeric, cumin, pepper',
					'Tea: $800 million (Russia, UAE, USA)',
					'Fresh Fruits: $1.2 billion (Bangladesh, UAE, Nepal) - Mango, grapes, pomegranate',
					'Organic Products: Premium markets in EU, USA pay 50-100% higher prices'
				],
				process: [
					'Step 1: Register with APEDA (apeda.gov.in) - ₹5,000 registration fee',
					'Step 2: Obtain IEC (Import Export Code) from DGFT - Free',
					'Step 3: Product certification (FSSAI, organic, phytosanitary)',
					'Step 4: Find buyers through APEDA buyer-seller meets, trade fairs',
					'Step 5: Shipping documentation: Invoice, packing list, certificate of origin',
					'Step 6: Comply with importing country regulations (USFDA, EU standards)'
				],
				marketIntelligence: 'APEDA provides free market reports, buyer contacts, trade leads. Export promotion assistance: 25-50% for participation in trade fairs.',
				opportunities: 'Organic farming products have huge demand. EU organic certification commands 100% premium. FPOs can directly export in bulk.'
			}
		},
		{
			id: 8,
			category: 'farming',
			title: 'Soil Health Management: Boosting Fertility Naturally',
			excerpt: 'Understand NPK ratios, micronutrient deficiencies, and how to improve soil health using compost, vermicompost, and green manure.',
			author: 'Dr. Kavita Reddy',
			date: '2024-10-05',
			readTime: '10 min read',
			image: '🌱',
			content: {
				introduction: 'Soil health directly impacts crop yield. Degraded soils reduce productivity by 30-40%. Get free Soil Health Card every 3 years.',
				soilTesting: [
					'Collect Samples: 15-20 spots per field, 0-15cm depth',
					'Test Parameters: pH, NPK, Organic Carbon, micronutrients (Zn, Fe, Mn, Cu)',
					'Optimal pH: 6.5-7.5 for most crops. Add lime if acidic, gypsum if alkaline',
					'NPK Ratio: 4:2:1 (Nitrogen:Phosphorus:Potassium) for cereals'
				],
				improvement: [
					'Organic Matter: Add 5-10 tons compost/acre annually. Increases water retention by 20%',
					'Crop Rotation: Legumes (pulses) fix 40-80 kg nitrogen/acre naturally',
					'Green Manure: Dhaincha, Sesbania add 50-60 kg nitrogen/acre',
					'Vermicompost: Premium organic fertilizer - ₹8-10/kg. Apply 2-3 tons/acre',
					'Biofertilizers: Rhizobium, Azospirillum, PSB (Phosphate Solubilizing Bacteria)',
					'Mulching: Reduces soil temperature by 5-10°C, retains moisture'
				],
				micronutrients: 'Zinc deficiency common in rice, wheat. Apply ZnSO4 @ 25 kg/ha. Iron deficiency: FeSO4 foliar spray.',
				schemes: 'Free soil testing at district agriculture offices. Soil Health Card scheme provides customized fertilizer recommendations.',
				resources: 'Soil Health Card portal: soilhealth.dac.gov.in | Get your card number: Register with Aadhaar'
			}
		}
	];

	const filteredArticles = activeFilter === 'all' 
		? articles 
		: articles.filter(article => article.category === activeFilter);

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
			{/* Header */}
			<div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white py-16">
				<div className="max-w-7xl mx-auto px-4">
					<h1 className="text-5xl font-bold mb-4">CropConnect Blog & Resources</h1>
					<p className="text-xl text-green-100">Expert agricultural advice, market insights, and farming tips</p>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 py-12">
				{/* Categories */}
				<div className="flex flex-wrap gap-4 mb-12">
					{categories.map(cat => {
						const Icon = cat.icon;
						return (
							<button
								key={cat.id}
								onClick={() => setActiveFilter(cat.id)}
								className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition shadow-md ${
									activeFilter === cat.id
										? 'bg-green-600 text-white scale-105'
										: 'bg-white text-gray-700 hover:bg-green-50'
								}`}
							>
								<Icon className="w-5 h-5" />
								{cat.label}
							</button>
						);
					})}
				</div>

				{/* Articles Grid */}
				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
					{filteredArticles.map(article => (
						<div key={article.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition group">
							{/* Image/Icon */}
							<div className="h-48 bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-8xl">
								{article.image}
							</div>

							{/* Content */}
							<div className="p-6">
								<div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
									<Calendar className="w-4 h-4" />
									<span>{new Date(article.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
									<span>•</span>
									<span>{article.readTime}</span>
								</div>

								<h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition">
									{article.title}
								</h3>

								<p className="text-gray-600 mb-4 line-clamp-3">
									{article.excerpt}
								</p>

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2 text-sm text-gray-600">
										<User className="w-4 h-4" />
										<span>{article.author}</span>
									</div>

									<button className="flex items-center gap-2 text-green-600 font-semibold hover:gap-3 transition-all">
										Read More <ArrowRight className="w-4 h-4" />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Quick Resources */}
				<div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
					<h2 className="text-3xl font-bold mb-6">Quick Resources</h2>
					<div className="grid md:grid-cols-3 gap-6">
						<a href="https://farmer.gov.in" target="_blank" rel="noopener noreferrer" className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition">
							<h3 className="font-bold text-lg mb-2">Farmer Portal</h3>
							<p className="text-sm text-green-100">One-stop portal for all agricultural schemes and services</p>
						</a>
						<a href="https://pmfby.gov.in" target="_blank" rel="noopener noreferrer" className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition">
							<h3 className="font-bold text-lg mb-2">Crop Insurance</h3>
							<p className="text-sm text-green-100">PM Fasal Bima Yojana - Protect your crops</p>
						</a>
						<a href="https://mkisan.gov.in" target="_blank" rel="noopener noreferrer" className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition">
							<h3 className="font-bold text-lg mb-2">mKisan Portal</h3>
							<p className="text-sm text-green-100">Get SMS alerts on weather, prices, and advisories</p>
						</a>
					</div>
				</div>

				{/* Back Button */}
				<div className="mt-12 text-center">
					<Link
						to={user ? `/${user.role.toLowerCase()}-dashboard` : '/'}
						className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition shadow-lg"
					>
						<ArrowLeft className="w-5 h-5" />
						Back to Dashboard
					</Link>
				</div>
			</div>
		</div>
	);
}