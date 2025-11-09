import React from "react";

export default function FarmerResourceCards() {
	// ===== Farmer Resources Section =====
	const farmerResources = [
		{
			title: "Kisan Suvidha",
			url: "https://farmer.gov.in/",
			logo: "/kisanSuvidhan.png",
			desc: "Official portal providing weather info, market prices, and advisories for Indian farmers.",
		},
		{
			title: "PM Kisan Samman Nidhi",
			url: "https://pmkisan.gov.in/",
			logo: "/pmkisan.jpeg",
			desc: "Central government scheme providing direct income support to farmers.",
		},
		{
			title: "eNAM – National Agriculture Market",
			url: "https://enam.gov.in/web/",
			logo: "/enam.png",
			desc: "Online trading platform connecting APMC mandis across India for better price discovery.",
		},
		{
			title: "Soil Health Card",
			url: "https://soilhealth.dac.gov.in/",
			logo: "/soil.jpeg",
			desc: "Scheme to provide soil health cards with nutrient status and recommendations.",
		},
		{
			title: "Agmarknet",
			url: "https://agmarknet.gov.in/",
			logo: "/Agmark.jpeg",
			desc: "Agricultural marketing information network for commodity prices and arrivals.",
		},
		{
			title: "IFFCO Kisan",
			url: "https://www.iffcokisan.com/",
			logo: "/iffcokisan.jpeg",
			desc: "Digital platform by IFFCO providing agri-advisory, weather, and expert solutions.",
		},
	];

	return (
		<div className="bg-gradient-to-br from-green-50 to-emerald-50 py-12 sm:py-16">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Section Heading */}
				<h2 className="text-3xl sm:text-4xl font-bold text-center text-green-800 mb-10 flex items-center justify-center gap-2">
					🌾 <span>Farmer Resources in India</span>
				</h2>

				{/* Cards Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
					{farmerResources.map((res, idx) => (
						<a
							key={idx}
							href={res.url}
							target="_blank"
							rel="noopener noreferrer"
							className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden flex flex-col"
						>
							{/* Card Content */}
							<div className="p-8 flex flex-col items-center text-center flex-grow">
								{/* Logo */}
								<div className="w-20 h-20 mb-5 flex items-center justify-center bg-green-50 rounded-full shadow-inner">
									<img
										src={res.logo}
										alt={`${res.title} logo`}
										className="w-16 h-16 object-contain transition-transform duration-300 group-hover:scale-110"
										onError={(e) => (e.target.style.display = "none")}
									/>
								</div>

								{/* Title */}
								<h3 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-green-700 mb-3">
									{res.title}
								</h3>

								{/* Description */}
								<p className="text-sm text-gray-600 leading-relaxed mb-6 flex-grow">
									{res.desc}
								</p>

								{/* Button */}
								<span className="inline-block px-5 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-full group-hover:bg-green-600 group-hover:text-white transition-all">
									Visit Website →
								</span>
							</div>
						</a>
					))}
				</div>
			</div>
		</div>
	);
}
