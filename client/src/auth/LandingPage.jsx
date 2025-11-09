import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Chatbot from "../components/ChatBot";
import LanguageSelector from "../components/LanguageSelector";
import { useLanguage } from "../context/LanguageContext";

import {
	ShoppingCart,
	Tractor,
	Shield,
	Calculator,
	TrendingUp,
	Wheat,
	Package,
	Phone,
	Mail,
	Facebook,
	Instagram,
	Twitter,
	Menu,
	X,
	CheckCircle,
	UserPlus,
	Sprout,
} from "lucide-react";

function CropConnectLanding() {
	const navigate = useNavigate();
	const { tr } = useLanguage();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef(null);

	useEffect(() => {
		function handleClickOutside(event) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setDropdownOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const features = [
		{
			icon: <Wheat className="w-12 h-12 text-green-600" />,
			title: "Crop Selling Platform",
			description:
				"Farmers can directly sell their crops to buyers with transparent pricing and secure transactions",
		},
		{
			icon: <ShoppingCart className="w-12 h-12 text-green-600" />,
			title: "Direct Crop Buying",
			description:
				"Merchants and government agencies can purchase crops directly from farmers at fair market prices",
		},
		{
			icon: <Package className="w-12 h-12 text-green-600" />,
			title: "Agricultural Products",
			description:
				"Buy and sell fertilizers, seeds, tools, and equipment needed for modern farming",
		},
		{
			icon: <Tractor className="w-12 h-12 text-green-600" />,
			title: "Worker & Tractor Booking",
			description:
				"Book skilled farm workers and tractors for your field work with just a few clicks",
		},
		{
			icon: <Shield className="w-12 h-12 text-green-600" />,
			title: "Secure Payment via Razorpay",
			description:
				"Safe and encrypted payment gateway ensuring secure transactions for all users",
		},
		{
			icon: <Calculator className="w-12 h-12 text-green-600" />,
			title: "Real-time Crop Calculator",
			description:
				"Calculate crop prices instantly based on 100kg standard with live market rates",
		},
		{
			icon: <TrendingUp className="w-12 h-12 text-green-600" />,
			title: "Live Government API Prices",
			description:
				"Access real-time crop prices directly from government APIs for accurate market information",
		},
	];

	const milestones = [
		{ number: "10,000+", label: "Active Farmers" },
		{ number: "5,000+", label: "Successful Transactions" },
		{ number: "500+", label: "Verified Merchants" },
		{ number: "₹50Cr+", label: "Total Trade Value" },
	];

	const farmerImages = [
		"/c1.jpeg",
		"/c2.jpeg",
		"/c3.jpeg",
		"/c4.jpeg",
		"/c5.jpeg",
		"/c6.jpeg",
		"/c7.jpeg",
	];

	const sliderSettings = {
		dots: true,
		infinite: true,
		speed: 500,
		slidesToShow: 3,
		slidesToScroll: 1,
		autoplay: true,
		autoplaySpeed: 3000,
		arrows: true,
		responsive: [
			{ breakpoint: 1024, settings: { slidesToShow: 2 } },
			{ breakpoint: 640, settings: { slidesToShow: 1 } },
		],
	};

	return (
		<div className="min-h-screen bg-white">
			{/* Navbar */}
			<nav className="bg-white shadow-md sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-20">
						{/* Logo Section */}
						<div className="flex items-center space-x-3">
							<div className="p-3 rounded-2xl bg-green-600 shadow-md">
								<Sprout className="w-8 h-8 text-white" strokeWidth={2.5} />
							</div>
							<div>
								<h1 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
									Crop Connect
								</h1>
								<p className="text-xs text-gray-600">
									{tr("Connecting Farms to Future")}
								</p>
							</div>
						</div>

						{/* Desktop Menu */}
						<div className="hidden md:flex items-center space-x-8">
							{/* Navigation Links */}
							<ul className="flex space-x-6 text-green-700 font-semibold">
								<li>
									<a href="#home" className="hover:text-green-900 transition">
										{tr("Home")}
									</a>
								</li>
								<li>
									<a href="#about" className="hover:text-green-900 transition">
										{tr("About")}
									</a>
								</li>
								<li>
									<a
										href="#moments"
										className="hover:text-green-900 transition"
									>
										{tr("Moments")}
									</a>
								</li>
								<li>
									<a
										href="#milestones"
										className="hover:text-green-900 transition"
									>
										{tr("Milestones")}
									</a>
								</li>
								<li>
									<a
										href="#features"
										className="hover:text-green-900 transition"
									>
										{tr("Features")}
									</a>
								</li>
								<li>
									<a href="#cta" className="hover:text-green-900 transition">
										{tr("Get Started")}
									</a>
								</li>
							</ul>

{/* Language + Auth Buttons */}
							<div className="flex items-center space-x-4 relative">
								<LanguageSelector />
								<button
									onClick={() => navigate("/login")}
									className="px-6 py-2 text-green-700 font-semibold hover:bg-green-50 rounded-lg transition-all"
								>
									{tr("Login")}
								</button>
								<div ref={dropdownRef} className="relative">
									<button
										onClick={() => setDropdownOpen(!dropdownOpen)}
										className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
									>
										{tr("Register")}
									</button>
									{dropdownOpen && (
										<div className="absolute right-0 top-full mt-2 bg-white rounded-lg border shadow-xl z-40 min-w-[260px]">
											<button
												className="block w-full text-left px-6 py-3 hover:bg-green-50 focus:bg-green-100 border-b last:border-none text-gray-700 font-semibold"
												onClick={() => {
													setDropdownOpen(false);
													navigate("/register-fb");
												}}
											>
												{tr("Register as Farmer or Buyer")}
											</button>
											<button
												className="block w-full text-left px-6 py-3 hover:bg-green-50 focus:bg-green-100 text-gray-700 font-semibold"
												onClick={() => {
													setDropdownOpen(false);
													navigate("/register-wt");
												}}
											>
												{tr("Register as Worker or Tractor Owner")}
											</button>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Mobile Menu Button */}
						<button
							className="md:hidden p-2"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						>
							{mobileMenuOpen ? (
								<X className="w-6 h-6" />
							) : (
								<Menu className="w-6 h-6" />
							)}
						</button>
					</div>

					{/* Mobile Menu */}
					{mobileMenuOpen && (
						<div className="md:hidden pb-4 space-y-2 px-4">
							<a
								href="#home"
								className="block py-2 text-green-700 font-semibold hover:bg-green-50 rounded-lg transition-all"
								onClick={() => setMobileMenuOpen(false)}
							>
								{tr("Home")}
							</a>
							<a
								href="#about"
								className="block py-2 text-green-700 font-semibold hover:bg-green-50 rounded-lg transition-all"
								onClick={() => setMobileMenuOpen(false)}
							>
								{tr("About")}
							</a>
							<a
								href="#moments"
								className="block py-2 text-green-700 font-semibold hover:bg-green-50 rounded-lg transition-all"
								onClick={() => setMobileMenuOpen(false)}
							>
								{tr("Moments")}
							</a>
							<a
								href="#milestones"
								className="block py-2 text-green-700 font-semibold hover:bg-green-50 rounded-lg transition-all"
								onClick={() => setMobileMenuOpen(false)}
							>
								{tr("Milestones")}
							</a>
							<a
								href="#features"
								className="block py-2 text-green-700 font-semibold hover:bg-green-50 rounded-lg transition-all"
								onClick={() => setMobileMenuOpen(false)}
							>
								{tr("Features")}
							</a>
							<a
								href="#cta"
								className="block py-2 text-green-700 font-semibold hover:bg-green-50 rounded-lg transition-all"
								onClick={() => setMobileMenuOpen(false)}
							>
								{tr("Get Started")}
							</a>

							<button
								onClick={() => {
									navigate("/login");
									setMobileMenuOpen(false);
								}}
							className="w-full px-6 py-2 text-green-700 font-semibold hover:bg-green-50 rounded-lg transition-all mt-4"
						>
							{tr("Login")}
							</button>
							<button
								onClick={() => {
									setMobileMenuOpen(false);
									navigate("/register-fb");
								}}
								className="w-full px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
							>
								{tr("Register")}
							</button>
						</div>
					)}
				</div>
			</nav>

			{/* Hero Section */}
			<section
				id="home"
				className="relative py-20 px-4"
				style={{
					backgroundImage:
						"linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=2070)",
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			>
				<div className="max-w-7xl mx-auto text-center text-white">
					<h2 className="text-5xl md:text-6xl font-bold mb-6">
						{tr("Revolutionizing Agriculture")}
					</h2>
					<p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
						{tr("Connect farmers, merchants, and buyers on one powerful platform. Experience seamless crop trading, equipment booking, and real-time market prices.")}
					</p>

					{/* CTA Buttons */}
					<div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
						<button
							onClick={() => navigate("/register-fb")}
							className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-2xl text-lg flex items-center gap-3 transform hover:scale-105"
						>
							<UserPlus className="w-6 h-6" />
							{tr("Register as Farmer/Buyer")}
						</button>
						<button
							onClick={() => navigate("/register-wt")}
							className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-2xl text-lg flex items-center gap-3 transform hover:scale-105"
						>
							<Tractor className="w-6 h-6" />
							{tr("Register as Worker/Tractor Owner")}
						</button>
					</div>
						<p className="text-green-100 text-lg">
							{tr("Already have an account?")}{" "}
							<button
								onClick={() => navigate("/login")}
								className="text-white font-bold underline hover:text-green-200 transition-colors"
							>
								{tr("Login here")}
							</button>
					</p>
				</div>
			</section>

			{/* About Section */}
			<section
				id="about"
				className="py-16 px-4 bg-gradient-to-b from-white to-green-50"
			>
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-12">
							<h2 className="text-4xl font-bold text-gray-800 mb-4">
								{tr("About Crop Connect")}
							</h2>
						<div className="w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-600 mx-auto rounded-full"></div>
					</div>
					<div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
						<p className="text-lg text-gray-700 leading-relaxed mb-6">
							<strong className="text-green-700">Crop Connect</strong> is
							India's premier digital agriculture marketplace, bridging the gap
							between farmers and the agricultural ecosystem. Our mission is to
							empower farmers with technology, providing them direct access to
							buyers, modern equipment, and real-time market intelligence.
						</p>
						<p className="text-lg text-gray-700 leading-relaxed mb-6">
							We eliminate middlemen, ensuring farmers get fair prices for their
							produce while buyers receive quality crops at competitive rates.
							With integrated payment solutions and government-backed price
							data, we're building trust and transparency in agricultural trade.
						</p>
						<div className="flex items-center justify-center gap-3 text-green-700 font-semibold">
							<CheckCircle className="w-6 h-6" />
							<span>Building a Sustainable Agricultural Future</span>
						</div>
					</div>
				</div>
			</section>

			{/* Moments Section */}
			<section id="moments" className="py-16 px-4 bg-white">
				<div className="max-w-7xl mx-auto">
					<h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
						{tr("Moments From The Field")}
					</h2>
					<Slider {...sliderSettings}>
						{farmerImages.map((img, idx) => (
							<div key={idx} className="px-2">
								<img
									src={img}
									alt={`Farmer working ${idx + 1}`}
									className="rounded-lg object-cover w-full h-48"
								/>
							</div>
						))}
					</Slider>
				</div>
			</section>

			{/* Milestones Section */}
			<section
				id="milestones"
				className="py-16 px-4 bg-gradient-to-r from-green-600 to-emerald-600"
			>
				<div className="max-w-7xl mx-auto">
						<h2 className="text-4xl font-bold text-center text-white mb-12">
							{tr("Our Milestones")}
						</h2>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
						{milestones.map((milestone, index) => (
							<div
								key={index}
								className="text-center bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
							>
								<div className="text-4xl font-bold text-white mb-2">
									{milestone.number}
								</div>
								<div className="text-green-100 font-medium">
									{milestone.label}
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="features" className="py-16 px-4 bg-white">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-4xl font-bold text-gray-800 mb-4">
							{tr("Our Features")}
						</h2>
						<p className="text-xl text-gray-600 max-w-2xl mx-auto">
							{tr("Everything you need for modern agriculture in one powerful platform")}
						</p>
						<div className="w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-600 mx-auto rounded-full mt-4"></div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{features.map((feature, index) => (
							<div
								key={index}
								className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 border-2 border-green-100 hover:border-green-300 group"
							>
								<div className="bg-white rounded-xl p-4 inline-block mb-4 group-hover:scale-110 transition-transform">
									{feature.icon}
								</div>
								<h3 className="text-xl font-bold text-gray-800 mb-3">
									{feature.title}
								</h3>
								<p className="text-gray-600 leading-relaxed">
									{feature.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Call to Action Section */}
			<section
				id="cta"
				className="py-16 px-4 bg-gradient-to-r from-green-600 to-emerald-600"
			>
				<div className="max-w-4xl mx-auto text-center text-white">
					<h2 className="text-4xl font-bold mb-6">
						{tr("Ready to Transform Your Farming Experience?")}
					</h2>
					<p className="text-xl mb-8">
						{tr("Join thousands of farmers and merchants already using Crop Connect")}
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<button
							onClick={() => navigate("/register-fb")}
							className="px-8 py-4 bg-white text-green-700 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-xl flex items-center justify-center gap-2"
						>
							<UserPlus className="w-5 h-5" />
							{tr("Register as Farmer/Buyer")}
						</button>
						<button
							onClick={() => navigate("/register-wt")}
							className="px-8 py-4 bg-green-800 text-white font-bold rounded-xl hover:bg-green-900 transition-all shadow-xl flex items-center justify-center gap-2"
						>
							<Tractor className="w-5 h-5" />
							{tr("Register as Worker/Tractor Owner")}
						</button>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-gray-900 text-white py-12 px-4">
				<div className="max-w-7xl mx-auto">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
						{/* About Column */}
						<div>
							<div className="flex items-center space-x-3 mb-4">
								<div className="p-2 rounded-xl bg-green-600 shadow">
									<Sprout className="w-6 h-6 text-white" strokeWidth={2.5} />
								</div>
								<h3 className="text-2xl font-bold">Crop Connect</h3>
							</div>
							<p className="text-gray-400 leading-relaxed">
								Empowering farmers and transforming agriculture through
								technology. Building a sustainable and transparent agricultural
								ecosystem.
							</p>
						</div>
						{/* Contact Column */}
						<div>
							<h3 className="text-xl font-bold mb-4 flex items-center gap-2">
								<Phone className="w-5 h-5" />
								{tr("Contact Us")}
							</h3>
							<div className="space-y-3 text-gray-400">
								<div className="flex items-center gap-3">
									<Phone className="w-5 h-5 text-green-500" />
									<span>+91 98765 43210</span>
								</div>
								<div className="flex items-center gap-3">
									<Mail className="w-5 h-5 text-green-500" />
									<span>support@cropconnect.com</span>
								</div>
								<div className="flex items-center gap-3">
									<Mail className="w-5 h-5 text-green-500" />
									<span>info@cropconnect.com</span>
								</div>
							</div>
						</div>
						{/* Embed Chatbot */}
						<Chatbot />
						{/* Social Media Column */}
						<div>
							<h3 className="text-xl font-bold mb-4">{tr("Follow Us")}</h3>
							<p className="text-gray-400 mb-4">
								{tr("Stay connected on social media")}
							</p>
							<div className="flex gap-4">
								<a
									href="https://facebook.com"
									target="_blank"
									rel="noopener noreferrer"
									className="bg-blue-600 p-3 rounded-lg hover:bg-blue-700 transition-all"
								>
									<Facebook className="w-6 h-6" />
								</a>
								<a
									href="https://instagram.com"
									target="_blank"
									rel="noopener noreferrer"
									className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
								>
									<Instagram className="w-6 h-6" />
								</a>
								<a
									href="https://twitter.com"
									target="_blank"
									rel="noopener noreferrer"
									className="bg-sky-500 p-3 rounded-lg hover:bg-sky-600 transition-all"
								>
									<Twitter className="w-6 h-6" />
								</a>
								<a
									href="mailto:support@cropconnect.com"
									className="bg-green-600 p-3 rounded-lg hover:bg-green-700 transition-all"
								>
									<Mail className="w-6 h-6" />
								</a>
							</div>
						</div>
					</div>
					{/* Bottom Bar */}
					<div className="border-t border-gray-800 pt-8 text-center">
						<p className="text-gray-400">
							2025{" "}
							<span className="text-green-500 font-semibold">Crop Connect</span>
							. {tr("All rights reserved.")}
						</p>
						<p className="text-gray-500 text-sm mt-2">
							{tr("Made with love for Indian Farmers")}
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}

export default CropConnectLanding;
