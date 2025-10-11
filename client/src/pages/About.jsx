import React from "react";

function About() {
	return (
		<div className="bg-white min-h-screen">
			{/* Hero Section with Wave Background */}
			<div className="relative bg-gradient-to-b from-green-600 to-emerald-700 text-white overflow-hidden">
				{/* Animated Wave Pattern */}
				<div className="absolute inset-0 opacity-10">
					<svg
						className="absolute w-full h-full"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 1440 320"
					>
						<path
							fill="#ffffff"
							fillOpacity="1"
							d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,106.7C1248,96,1344,96,1392,96L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
						></path>
					</svg>
				</div>

				<div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
					<div className="inline-block mb-6 px-6 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold">
						🌾 Agricultural Innovation Platform
					</div>
					<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
						Welcome to CropConnect
					</h1>
					<p className="text-lg sm:text-xl max-w-3xl mx-auto text-green-50 leading-relaxed">
						Bridging the gap between farmers and markets through technology
					</p>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
				{/* About Cards */}
				<div className="grid md:grid-cols-2 gap-8 mb-20">
					<div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 sm:p-10 border border-green-100">
						<div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center mb-6">
							<span className="text-3xl">🌱</span>
						</div>
						<h3 className="text-2xl font-bold text-gray-900 mb-4">
							Who We Are
						</h3>
						<p className="text-gray-700 leading-relaxed">
							CropConnect is a digital agriculture platform that connects
							farmers, buyers, and sellers in one unified marketplace. We
							empower farmers by providing direct market access and helping them
							sell crops and farming products at fair, transparent prices.
						</p>
					</div>

					<div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 sm:p-10 border border-emerald-100">
						<div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mb-6">
							<span className="text-3xl">🚜</span>
						</div>
						<h3 className="text-2xl font-bold text-gray-900 mb-4">
							What We Do
						</h3>
						<p className="text-gray-700 leading-relaxed">
							We provide a comprehensive marketplace where farmers and suppliers
							can buy and sell agricultural products including farming tools,
							fertilizers, seeds, and pesticides. All transactions are safe,
							transparent, and designed to make agriculture smarter and more
							profitable.
						</p>
					</div>
				</div>

				{/* Vision & Mission */}
				<div className="mb-20">
					<div className="text-center mb-12">
						<h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
							Our Vision & Mission
						</h2>
						<div className="w-20 h-1 bg-green-600 mx-auto rounded-full"></div>
					</div>

					<div className="grid md:grid-cols-2 gap-8">
						<div className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg border-l-4 border-green-600">
							<div className="flex items-center gap-3 mb-4">
								<span className="text-4xl">🎯</span>
								<h3 className="text-2xl font-bold text-gray-900">Vision</h3>
							</div>
							<p className="text-gray-700 leading-relaxed">
								To create a sustainable and digitally connected farming
								community where every farmer has access to modern tools, fair
								trade opportunities, and the latest agricultural knowledge
								through innovation and transparency.
							</p>
						</div>

						<div className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg border-l-4 border-emerald-600">
							<div className="flex items-center gap-3 mb-4">
								<span className="text-4xl">🤝</span>
								<h3 className="text-2xl font-bold text-gray-900">Mission</h3>
							</div>
							<p className="text-gray-700 leading-relaxed">
								To empower farmers with technology and fair market access, while
								making it easy for buyers and suppliers to connect directly with
								trusted agricultural partners for mutual growth and prosperity.
							</p>
						</div>
					</div>
				</div>

				{/* Features Grid */}
				<div className="mb-20">
					<div className="text-center mb-12">
						<h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
							What We Offer
						</h2>
						<div className="w-20 h-1 bg-green-600 mx-auto rounded-full"></div>
					</div>

					<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{[
							{
								icon: "🌾",
								title: "Direct Trading",
								desc: "Connect directly with buyers and sellers for transparent crop trading",
							},
							{
								icon: "🛒",
								title: "Marketplace",
								desc: "Complete marketplace for tools, fertilizers, and equipment",
							},
							{
								icon: "💰",
								title: "Fair Pricing",
								desc: "Real-time market prices and secure payment transactions",
							},
							{
								icon: "✅",
								title: "Verified Users",
								desc: "All farmers, sellers, and buyers are verified for trust",
							},
							{
								icon: "🌤️",
								title: "Weather Insights",
								desc: "Live weather updates and agricultural forecasting",
							},
							{
								icon: "🎧",
								title: "24/7 Support",
								desc: "Always available customer service and assistance",
							},
						].map((feature, idx) => (
							<div
								key={idx}
								className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:-translate-y-1"
							>
								<div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
									<span className="text-2xl">{feature.icon}</span>
								</div>
								<h3 className="text-lg font-bold text-gray-900 mb-2">
									{feature.title}
								</h3>
								<p className="text-gray-600 text-sm leading-relaxed">
									{feature.desc}
								</p>
							</div>
						))}
					</div>
				</div>

				{/* Contact Section */}
				<div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 sm:p-12 text-white">
					<div className="text-center mb-10">
						<h2 className="text-3xl sm:text-4xl font-bold mb-4">
							Get In Touch
						</h2>
						<p className="text-gray-300 text-lg">
							We'd love to hear from you. Reach out for support or partnerships.
						</p>
					</div>

					<div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
						<a
							href="tel:6309639767"
							className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 text-center group"
						>
							<div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
								<span className="text-2xl">📱</span>
							</div>
							<h4 className="font-semibold mb-2">Phone</h4>
							<p className="text-green-300 text-sm">6309639767</p>
						</a>

						<a
							href="mailto:vardhanreddy@gmail.com"
							className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 text-center group"
						>
							<div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
								<span className="text-2xl">📧</span>
							</div>
							<h4 className="font-semibold mb-2">Email</h4>
							<p className="text-green-300 text-sm break-all">
								vardhanreddy@gmail.com
							</p>
						</a>

						<a
							href="https://instagram.com/cropconnect"
							target="_blank"
							rel="noopener noreferrer"
							className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 text-center group"
						>
							<div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
								<span className="text-2xl">📸</span>
							</div>
							<h4 className="font-semibold mb-2">Instagram</h4>
							<p className="text-green-300 text-sm">@cropconnect</p>
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}

export default About;
