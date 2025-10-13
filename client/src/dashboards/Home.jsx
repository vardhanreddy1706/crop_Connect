import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import "../App.css";
import Footer from "../pages/Footer.jsx";
import FarmerCarousel from "../caurosel/Caurosel.jsx";
import CropPriceSearch from "../pages/CropPriceSearch.jsx";

export default function FarmerDashboard() {
	const { user, logout } = useContext(AuthContext);
	const nav = useNavigate();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const handleLogout = async () => {
		try {
			await logout();
			nav("/login");
		} catch (error) {
			console.error("Logout failed:", error);
		}
	};

	// Navigation handler for Sell Crop button
	const handleSellCrop = () => {
		nav("/sell-crop");
	};

	

	return (
		<>
			<div className="flex flex-col min-h-screen bg-white">
				{/* ====== TOP BAR (Social + Welcome) ====== */}
				<div className="mx-10 bg-gray-100 py-2 px-8 lg:px-12 xl:px-16 border-b border-gray-200">
					<div className="max-w-[1440px] mx-auto flex items-center gap-8">
						{/* Scrolling Text - Center/Right */}
						<div className="flex-1 overflow-hidden">
							<div className="animate-marquee flex whitespace-nowrap">
								<span className="text-gray-600 text-sm mx-8">
									🌾 Welcome to CropConnect
								</span>
								<span className="text-gray-600 text-sm mx-8">
									Fresh Crops Direct from Farmers
								</span>
								<span className="text-gray-600 text-sm mx-8">
									Quality Products at Best Prices
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* ====== MAIN NAVBAR ====== */}
				<nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm mx-12">
					<div className="max-w-[1920px] mx-auto flex items-center justify-evenly gap-12 sm:gap-4">
						{/* Logo and Brand */}
						<div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 flex-shrink-0">
							<div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 xl:w-11 xl:h-11 flex items-center justify-center">
								<div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9 bg-green-600 rounded"></div>
							</div>
							<div className="text-gray-900 text-base sm:text-lg md:text-xl lg:text-2xl xl:text-2xl 2xl:text-3xl font-semibold whitespace-nowrap cursor-pointer">
								CropConnect
							</div>
						</div>

						{/* Desktop Navigation - Hidden on mobile/tablet */}
						<div className="hidden lg:flex items-center gap-10 xl:gap-6 2xl:gap-28 flex-grow justify-center">
							<Link
								to="/"
								className="text-gray-900 text-sm xl:text-base 2xl:text-lg font-medium border-b-2 border-green-600 pb-1 hover:text-green-700 transition-colors"
							>
								Home
							</Link>
							<Link
								to="/about"
								className="text-gray-500 text-sm xl:text-base 2xl:text-lg font-medium hover:text-gray-900 hover:border-b-2 hover:border-green-600 pb-1 transition-all"
							>
								About
							</Link>
							<Link
								to="/products"
								className="text-gray-500 text-sm xl:text-base 2xl:text-lg font-medium hover:text-gray-900 hover:border-b-2 hover:border-green-600 pb-1 transition-all"
							>
								Products
							</Link>
							<Link
								to="/crops"
								className="text-gray-500 text-base font-medium hover:text-gray-900 hover:border-b-2 hover:border-green-600 pb-1 transition-all"
							>
								Crops
							</Link>

							{/* ===== BOOKINGS DROPDOWN WITH HOVER ===== */}
							<div className="relative group">
								<button className="text-gray-500 text-base font-medium hover:text-gray-900 pb-1 transition-all flex items-center gap-1">
									Booking
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-4 w-4 transition-transform group-hover:rotate-180 duration-300"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M19 9l-7 7-7-7"
										/>
									</svg>
								</button>

								{/* Dropdown Menu */}
								<div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-in-out group-hover:translate-y-0 -translate-y-2 z-50 overflow-hidden">
									{/* Dropdown Header */}
									<div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
										<h3 className="text-white font-bold text-lg">
											Booking Services
										</h3>
										<p className="text-green-100 text-xs mt-1">
											Choose from our services
										</p>
									</div>

									{/* Dropdown Items */}
									<div className="py-2">
										<Link
											to="/worker-bookings"
											className="group/item flex items-start gap-4 px-6 py-4 hover:bg-green-50 transition-colors"
										>
											<div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover/item:bg-green-200 transition-colors">
												<span className="text-2xl">👷</span>
											</div>
											<div className="flex-1">
												<h4 className="font-semibold text-gray-800 group-hover/item:text-green-700 transition-colors">
													Book Worker
												</h4>
												<p className="text-xs text-gray-500 mt-0.5">
													Hire skilled farm workers
												</p>
											</div>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-5 w-5 text-gray-400 group-hover/item:text-green-600 transform group-hover/item:translate-x-1 transition-all"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 5l7 7-7 7"
												/>
											</svg>
										</Link>

										<div className="border-t border-gray-100"></div>

										<Link
											to="/tractor-booking"
											className="group/item flex items-start gap-4 px-6 py-4 hover:bg-emerald-50 transition-colors"
										>
											<div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover/item:bg-emerald-200 transition-colors">
												<span className="text-2xl">🚜</span>
											</div>
											<div className="flex-1">
												<h4 className="font-semibold text-gray-800 group-hover/item:text-emerald-700 transition-colors">
													Book Tractor
												</h4>
												<p className="text-xs text-gray-500 mt-0.5">
													Rent tractors & equipment
												</p>
											</div>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-5 w-5 text-gray-400 group-hover/item:text-emerald-600 transform group-hover/item:translate-x-1 transition-all"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 5l7 7-7 7"
												/>
											</svg>
										</Link>

										<div className="border-t border-gray-100"></div>


										<div className="border-t border-gray-100"></div>

										<Link
											to="/booking-history"
											className="group/item flex items-start gap-4 px-6 py-4 hover:bg-purple-50 transition-colors"
										>
											<div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover/item:bg-purple-200 transition-colors">
												<span className="text-2xl">🕒</span>
											</div>
											<div className="flex-1">
												<h4 className="font-semibold text-gray-800 group-hover/item:text-purple-700 transition-colors">
													Booking History
												</h4>
												<p className="text-xs text-gray-500 mt-0.5">
													Past bookings & records
												</p>
											</div>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-5 w-5 text-gray-400 group-hover/item:text-purple-600 transform group-hover/item:translate-x-1 transition-all"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 5l7 7-7 7"
												/>
											</svg>
										</Link>

										<div className="border-t border-gray-100"></div>

										<Link
											to="/transaction-history"
											className="group/item flex items-start gap-4 px-6 py-4 hover:bg-yellow-50 transition-colors rounded-b-2xl"
										>
											<div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center group-hover/item:bg-yellow-200 transition-colors">
												<span className="text-2xl">💰</span>
											</div>
											<div className="flex-1">
												<h4 className="font-semibold text-gray-800 group-hover/item:text-yellow-700 transition-colors">
													Transaction History
												</h4>
												<p className="text-xs text-gray-500 mt-0.5">
													Payment & transaction logs
												</p>
											</div>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-5 w-5 text-gray-400 group-hover/item:text-yellow-600 transform group-hover/item:translate-x-1 transition-all"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 5l7 7-7 7"
												/>
											</svg>
										</Link>
									</div>
								</div>
							</div>
						</div>

						{/* Right side - Icons & Buttons */}
						<div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-3.5 xl:gap-14 flex-shrink-0">
							{/* Search Icon - Hidden on small mobile */}
							<button className="hidden sm:block w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-gray-500 hover:text-gray-700 transition-colors">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={2}
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
									/>
								</svg>
							</button>

							{/* Cart Icon - Hidden on small mobile */}
							<button className="hidden sm:block w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-gray-500 hover:text-gray-700 transition-colors">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={2}
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
									/>
								</svg>
							</button>

							{/* Logout Button - Conditional & Responsive */}
							{user && (
								<button
									onClick={handleLogout}
									className="hidden sm:block px-2.5 py-1.5 md:px-3 md:py-2 lg:px-4 lg:py-2 rounded-md text-white text-[10px] sm:text-xs md:text-sm lg:text-sm font-medium bg-red-600 hover:bg-red-700 transition-colors whitespace-nowrap"
								>
									Logout
								</button>
							)}

							{/* Mobile Menu Button */}
							<button
								onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
								className="lg:hidden p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={2}
									stroke="currentColor"
									className="w-5 h-5 sm:w-6 sm:h-6"
								>
									{isMobileMenuOpen ? (
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M6 18L18 6M6 6l12 12"
										/>
									) : (
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
										/>
									)}
								</svg>
							</button>
						</div>
					</div>

					{/* Mobile Menu - Responsive */}
					{isMobileMenuOpen && (
						<div className="lg:hidden mt-3 sm:mt-4 pb-3 sm:pb-4 border-t border-gray-200 pt-3 sm:pt-4 animate-fade-in">
							<div className="flex flex-col gap-3 sm:gap-4">
								<Link
									to="/"
									className="text-gray-900 text-sm sm:text-base font-medium py-1 hover:bg-gray-50 rounded px-2 transition-colors"
									onClick={() => setIsMobileMenuOpen(false)}
								>
									Home
								</Link>
								<Link
									to="/about"
									className="text-gray-500 text-sm sm:text-base font-medium hover:text-gray-900 py-1 hover:bg-gray-50 rounded px-2 transition-colors"
									onClick={() => setIsMobileMenuOpen(false)}
								>
									About
								</Link>
								<Link
									to="/products"
									className="text-gray-500 text-sm sm:text-base font-medium hover:text-gray-900 py-1 hover:bg-gray-50 rounded px-2 transition-colors"
									onClick={() => setIsMobileMenuOpen(false)}
								>
									Products
								</Link>
								<Link
									to="/crops"
									className="text-gray-500 text-sm sm:text-base font-medium hover:text-gray-900 py-1 hover:bg-gray-50 rounded px-2 transition-colors"
									onClick={() => setIsMobileMenuOpen(false)}
								>
									Crops
								</Link>

								{/* Mobile Bookings Section */}
								<div className="border-t border-gray-200 pt-2 mt-2">
									<div className="text-gray-700 font-semibold text-sm mb-2 px-2">
										Bookings
									</div>
									<Link
										to="/book-worker"
										className="text-gray-500 text-sm sm:text-base font-medium hover:text-gray-900 py-1 hover:bg-gray-50 rounded px-4 transition-colors flex items-center gap-2"
										onClick={() => setIsMobileMenuOpen(false)}
									>
										<span>👷</span> Book Worker
									</Link>
									<Link
										to="/book-tractor"
										className="text-gray-500 text-sm sm:text-base font-medium hover:text-gray-900 py-1 hover:bg-gray-50 rounded px-4 transition-colors flex items-center gap-2"
										onClick={() => setIsMobileMenuOpen(false)}
									>
										<span>🚜</span> Book Tractor
									</Link>
									<Link
										to="/my-bookings"
										className="text-gray-500 text-sm sm:text-base font-medium hover:text-gray-900 py-1 hover:bg-gray-50 rounded px-4 transition-colors flex items-center gap-2"
										onClick={() => setIsMobileMenuOpen(false)}
									>
										<span>📋</span> My Bookings
									</Link>
									<Link
										to="/booking-history"
										className="text-gray-500 text-sm sm:text-base font-medium hover:text-gray-900 py-1 hover:bg-gray-50 rounded px-4 transition-colors flex items-center gap-2"
										onClick={() => setIsMobileMenuOpen(false)}
									>
										<span>🕒</span> Booking History
									</Link>
									<Link
										to="/transaction-history"
										className="text-gray-500 text-sm sm:text-base font-medium hover:text-gray-900 py-1 hover:bg-gray-50 rounded px-4 transition-colors flex items-center gap-2"
										onClick={() => setIsMobileMenuOpen(false)}
									>
										<span>💰</span> Transaction History
									</Link>
								</div>

								<div className="md:hidden mt-2">
									<div className="flex items-center gap-2 px-3 py-2 bg-yellow-400 rounded-md text-sm">
										<span className="text-white font-medium"></span>
									</div>
								</div>
								{user && (
									<button
										onClick={handleLogout}
										className="text-left px-3 py-2 rounded-md text-white text-sm sm:text-base font-medium bg-red-600 hover:bg-red-700 transition-colors"
									>
										Logout
									</button>
								)}
							</div>
						</div>
					)}
				</nav>

				{/* ====== HERO SECTION ====== */}
				<div className="relative w-full h-[400px] xs:h-[450px] sm:h-[500px] md:h-[550px] lg:h-[650px] xl:h-[700px] 2xl:h-[800px] flex-grow">
					{/* Background Image */}
					<img
						className="absolute inset-0 w-full h-full object-cover object-center"
						src="./nature.png"
						alt="CropConnect hero"
					/>

					{/* Dark Overlay - More prominent on smaller screens */}
					<div className="absolute inset-0 bg-gray bg-opacity-40 sm:bg-opacity-55 md:bg-opacity-50"></div>

					{/* Decorative Yellow Elements - Responsive positioning */}
					<div className="hidden md:flex absolute top-16 md:top-20 lg:top-24 xl:top-32 2xl:top-40 right-[25%] sm:right-[28%] md:right-[30%] lg:right-[32%] xl:right-[35%] items-center gap-1 sm:gap-1.5 md:gap-2">
						<div className="w-2 h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 xl:w-4 xl:h-4 bg-yellow-400 rotate-45"></div>
						<div className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4 xl:w-5 xl:h-5 bg-yellow-400 rotate-45"></div>
						<div className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 bg-yellow-400 rotate-45"></div>
					</div>

					{/* Hero Content - Fully responsive */}
					<div className="relative z-10 max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 h-full flex items-center">
						<div className="w-full max-w-[280px] xs:max-w-[340px] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl flex flex-col gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8">
							{/* Welcome Text - Responsive font */}
							<div className="text-white text-[10px] xs:text-xs sm:text-sm md:text-sm lg:text-base xl:text-base font-semibold uppercase tracking-wide sm:tracking-wider leading-relaxed">
								WELCOME TO AGRICULTURAL PRODUCTS RURAL ENTREPRENEURSHIP
								MANAGEMENT SYSTEM.
							</div>

							{/* Main Heading - Fully responsive sizing */}
							<div className="text-white text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-8xl font-bold uppercase leading-tight">
								CROP
								<br />
								CONNECT
							</div>

							{/* Description - Responsive font */}
							<div className="text-white text-xs xs:text-sm sm:text-base md:text-base lg:text-lg xl:text-lg font-normal leading-relaxed">
								Empowering Rural Dreams, Nurturing Agricultural Growth –
								CropConnect cultivates prosperity from the roots up.
							</div>

							{/* Action Buttons - Fully responsive */}
							<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
								<button
									onClick={handleSellCrop}
									className="px-8 py-3 sm:px-8 sm:py-4 bg-yellow-400 rounded-md text-white text-sm sm:text-base font-semibold uppercase hover:bg-yellow-500 hover:shadow-lg transition-all transform hover:scale-105 whitespace-nowrap"
								>
									SELL HERE
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
			<FarmerCarousel />
			<CropPriceSearch/>
			<Footer />
		</>
	);
}
