import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import React, { useEffect} from 'react';
import FarmerResourceCards from "../pages/FarmerResources.jsx";


import { AuthContext } from "../context/AuthContext.jsx";
import "../App.css";
import Footer from "../pages/Footer.jsx";
import FarmerCarousel from "../caurosel/Caurosel.jsx";
import CropPriceSearch from "../pages/CropPriceSearch.jsx";
import CropYieldPredictor from "../pages/CropYieldPredictor.jsx";
import LanguageSelector from "../components/LanguageSelector.jsx";
import { useLanguage } from "../context/LanguageContext";
import Chatbot from "../components/ChatBot";
import { Sprout } from "lucide-react";
// import WeatherWidget from "../components/WeatherWidget";
// import LocationSelector from "../components/LocationSelector";
import IndiaWeatherAdvanced from "../components/IndiaWeatherLocation";


export default function FarmerDashboard() {
	const { user, logout } = useContext(AuthContext);
const nav = useNavigate();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const { tr } = useLanguage();

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


	useEffect(() => {
  function onKey(e) { if (e.key === 'Escape') setIsMobileMenuOpen(false); }
  if (isMobileMenuOpen) window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [isMobileMenuOpen]);
	

	return (
		<>
			<div className="w-full flex flex-col min-h-screen bg-white">
				{/* ====== TOP BAR (Social + Welcome) ====== */}
				<div className="w-full bg-gray-100 py-2 px-4 md:px-8 border-b border-gray-200">
					<div className="w-full flex items-center">
						{/* Scrolling Text - Ticker */}
						<div className="w-full overflow-hidden">
<div className="animate-marquee flex whitespace-nowrap gap-12">
								<span className="text-gray-600 text-sm">🌾 {tr("Welcome to CropConnect")}</span>
								<span className="text-gray-600 text-sm">{tr("Fresh Crops Direct from Farmers")}</span>
								<span className="text-gray-600 text-sm">{tr("Quality Products at Best Prices")}</span>
							</div>
						</div>
					</div>
				</div>

				{/* ====== MAIN NAVBAR ====== */}
				<nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm w-full">
					<div className="max-w-[1920px] mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
						{/* Logo and Brand */}
						<div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
						<div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 xl:w-11 xl:h-11 flex items-center justify-center">
								<div className="w-full h-full p-1.5 bg-green-600 rounded-2xl shadow flex items-center justify-center">
									<Sprout className="w-full h-full text-white" strokeWidth={2.5} />
								</div>
						</div>
							<div className="text-gray-900 text-base sm:text-lg md:text-xl lg:text-2xl xl:text-2xl 2xl:text-3xl font-semibold whitespace-nowrap cursor-pointer">
								CropConnect
							</div>
						</div>

						{/* Desktop Navigation - Hidden on mobile/tablet */}
						<div className="hidden lg:flex items-center gap-8 xl:gap-10 flex-1 justify-center">
							<Link
								to="/"
								className="text-gray-900 text-sm xl:text-base 2xl:text-lg font-medium border-b-2 border-green-600 pb-1 hover:text-green-700 transition-colors"
							>
								{tr("Home")}
							</Link>
							<Link
								to="/about"
								className="text-gray-500 text-sm xl:text-base 2xl:text-lg font-medium hover:text-gray-900 hover:border-b-2 hover:border-green-600 pb-1 transition-all"
							>
								{tr("About")}
							</Link>
							<Link
								to="/products"
								className="text-gray-500 text-sm xl:text-base 2xl:text-lg font-medium hover:text-gray-900 hover:border-b-2 hover:border-green-600 pb-1 transition-all"
							>
								{tr("Products")}
							</Link>
							<Link
								to="/my-crops"
								className="text-gray-500 text-sm xl:text-base 2xl:text-lg font-medium hover:text-gray-900 hover:border-b-2 hover:border-green-600 pb-1 transition-all"
							>
								{tr("Crop Listings")}
							</Link>
							<Link
								to="/farmer-crop-status"
								className="text-gray-500 text-sm xl:text-base 2xl:text-lg font-medium hover:text-gray-900 hover:border-b-2 hover:border-green-600 pb-1 transition-all"
							>
								{tr("Crop status")}
							</Link>
							<Link
								to="/farmer-ratings"
								className="text-gray-500 text-sm xl:text-base 2xl:text-lg font-medium hover:text-gray-900 hover:border-b-2 hover:border-green-600 pb-1 transition-all"
							>
								{tr("My Ratings")}
							</Link>

							{/* ===== BOOKINGS DROPDOWN WITH HOVER ===== */}
							<div className="relative group">
                                <button className="text-gray-500 text-base font-medium hover:text-gray-900 pb-1 transition-all flex items-center gap-1">
									{tr("Booking")}
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
											{tr("Booking Services")}
										</h3>
										<p className="text-green-100 text-xs mt-1">
											{tr("Choose from our services")}
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
													{tr("Book Worker")}
												</h4>
												<p className="text-xs text-gray-500 mt-0.5">
													{tr("Hire skilled farm workers")}
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
													{tr("Book Tractor")}
												</h4>
												<p className="text-xs text-gray-500 mt-0.5">
													{tr("Rent tractors & equipment")}
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
													{tr("Booking History")}
												</h4>
												<p className="text-xs text-gray-500 mt-0.5">
													{tr("Past bookings & records")}
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
                                                       <h4 className="font-semibold text-gray-800 group-hover/item:text-purple-700 transition-colors">
													{tr("Transaction History")}
												</h4>
                                                   <p className="text-xs text-gray-500 mt-0.5">
													{tr("Payment & transaction logs")}
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
										<Link
											to="/farmer/my-bookings"
											className="group/item flex items-start gap-4 px-6 py-4 hover:bg-purple-50 transition-colors"
										>
											<div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover/item:bg-purple-200 transition-colors">
												<span className="text-2xl">🕒</span>
											</div>
											<div className="flex-1">
                                                    <h4 className="font-semibold text-gray-800 group-hover/item:text-purple-700 transition-colors">
													{tr("My Booking")}
												</h4>
												<p className="text-xs text-gray-500 mt-0.5">{tr("Bookings")}</p>
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
									</div>
								</div>
							</div>
						</div>

						{/* Right side - Icons & Buttons */}
                          <div className="flex items-center gap-2 md:gap-3 xl:gap-6 flex-shrink-0">
							<LanguageSelector />
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
									{tr("Logout")}
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
					{/* ---------- MOBILE MENU (Fully Responsive, Matches Desktop Links) ---------- */}
{isMobileMenuOpen && (
  <div
    className="lg:hidden fixed inset-x-0 top-[64px] z-50 bg-white border-t border-gray-200 shadow-xl max-h-[calc(100vh-64px)] overflow-y-auto animate-fade-in"
    role="dialog"
    aria-modal="true"
    aria-label={tr("Mobile menu")}
  >
    {/* Header */}
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center">
          <Sprout className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-semibold text-gray-900">CropConnect</span>
      </div>
      <button
        onClick={() => setIsMobileMenuOpen(false)}
        aria-label={tr("Close menu")}
        className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
      >
        ✕
      </button>
    </div>

    {/* Navigation Links */}
    <div className="px-4 py-4 space-y-2">
      <Link
        to="/"
        className="block px-3 py-2 text-base font-medium text-gray-900 bg-green-50 rounded-md"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {tr("Home")}
      </Link>
      <Link
        to="/about"
        className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {tr("About")}
      </Link>
      <Link
        to="/products"
        className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {tr("Products")}
      </Link>
      <Link
        to="/my-crops"
        className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {tr("Crop Listings")}
      </Link>
      <Link
        to="/farmer-crop-status"
        className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {tr("Crop Status")}
      </Link>
      <Link
        to="/farmer-ratings"
        className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {tr("My Ratings")}
      </Link>
    </div>

    {/* Booking Services Section */}
    <div className="mt-3 border-t border-gray-200 pt-4 px-4 pb-6 bg-gray-50">
      <h3 className="text-sm font-semibold text-gray-600 mb-2">
        {tr("Booking Services")}
      </h3>
      <div className="space-y-3">
        <Link
          to="/worker-bookings"
          className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm hover:bg-green-50 transition"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <span className="text-2xl">👷</span>
          <div>
            <p className="font-semibold text-gray-800">{tr("Book Worker")}</p>
            <p className="text-xs text-gray-500">{tr("Hire skilled farm workers")}</p>
          </div>
        </Link>

        <Link
          to="/tractor-booking"
          className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm hover:bg-emerald-50 transition"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <span className="text-2xl">🚜</span>
          <div>
            <p className="font-semibold text-gray-800">{tr("Book Tractor")}</p>
            <p className="text-xs text-gray-500">{tr("Rent tractors & equipment")}</p>
          </div>
        </Link>

        <Link
          to="/farmer/my-bookings"
          className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm hover:bg-purple-50 transition"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <span className="text-2xl">📋</span>
          <div>
            <p className="font-semibold text-gray-800">{tr("My Booking")}</p>
            <p className="text-xs text-gray-500">{tr("Bookings")}</p>
          </div>
        </Link>

        <Link
          to="/booking-history"
          className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm hover:bg-indigo-50 transition"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <span className="text-2xl">🕒</span>
          <div>
            <p className="font-semibold text-gray-800">{tr("Booking History")}</p>
            <p className="text-xs text-gray-500">{tr("Past bookings & records")}</p>
          </div>
        </Link>

        <Link
          to="/transaction-history"
          className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm hover:bg-yellow-50 transition"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <span className="text-2xl">💰</span>
          <div>
            <p className="font-semibold text-gray-800">{tr("Transaction History")}</p>
            <p className="text-xs text-gray-500">{tr("Payment & transaction logs")}</p>
          </div>
        </Link>
      </div>
    </div>

    {/* Language Selector, Logout, etc. */}
    <div className="px-4 py-4 border-t border-gray-200 flex flex-col gap-3 bg-white">
      <LanguageSelector />

      {user ? (
        <button
          onClick={() => {
            handleLogout();
            setIsMobileMenuOpen(false);
          }}
          className="w-full py-2 text-white bg-red-600 rounded-md text-sm font-medium hover:bg-red-700 transition"
        >
          {tr("Logout")}
        </button>
      ) : (
        <div className="flex gap-3">
          <Link
            to="/login"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex-1 text-center py-2 rounded-md bg-green-600 text-white font-medium hover:bg-green-700 transition"
          >
            {tr("Login")}
          </Link>
          <Link
            to="/register"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex-1 text-center py-2 rounded-md border border-green-600 text-green-700 font-medium hover:bg-green-50 transition"
          >
            {tr("Register")}
          </Link>
        </div>
      )}
    </div>

    {/* Footer small note */}
    <div className="text-center text-xs text-gray-400 py-3 bg-gray-50">
      © {new Date().getFullYear()} CropConnect. All rights reserved.
    </div>
  </div>
)}
{/* ---------- END MOBILE MENU ---------- */}
				</nav>
{/* ====== HERO SECTION (div-based, responsive, no extra gap) ====== */}
<div
  className="relative w-full overflow-hidden"
  style={{
    backgroundImage: "url('./nature.png')",
    backgroundSize: "cover",
    backgroundPosition: "center center",
  }}
>
  {/* Adaptive overlay */}
  <div className="absolute inset-0 bg-black/20 sm:bg-black/15 md:bg-black/10 pointer-events-none" />

  {/* CONTENT WRAPPER
      - On very small screens hero height = viewport minus header (change 64px if needed)
      - On larger screens use fixed heights to preserve desktop look
  */}
  <div
    className="relative z-10 mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20
               h-[calc(100vh-64px)] sm:h-[460px] md:h-[520px] lg:h-[640px] xl:h-[720px] 2xl:h-[800px]
               flex items-center"
  >
    <div className="w-full max-w-[300px] xs:max-w-[350px] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl flex flex-col gap-3 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8">
      
      {/* Welcome Text */}
      <p className="text-white text-[10px] xs:text-xs sm:text-sm md:text-sm lg:text-base xl:text-base font-semibold uppercase tracking-wide sm:tracking-wider leading-snug sm:leading-relaxed">
        WELCOME TO AGRICULTURAL PRODUCTS RURAL ENTREPRENEURSHIP MANAGEMENT SYSTEM
      </p>

      {/* Main Heading */}
      <h1 className="text-white font-extrabold uppercase leading-tight text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-[8rem] drop-shadow-md">
        CROP
        <br />
        CONNECT
      </h1>

      {/* Description */}
      <p className="text-white text-xs xs:text-sm sm:text-base md:text-base lg:text-lg xl:text-xl font-normal leading-relaxed max-w-[90%] sm:max-w-none">
        Empowering Rural Dreams, Nurturing Agricultural Growth — CropConnect cultivates prosperity from the roots up.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 mt-2 sm:mt-4">
        <button
          onClick={handleSellCrop}
          className="px-6 py-3 sm:px-8 sm:py-4 bg-yellow-400 rounded-md text-white text-sm sm:text-base font-semibold uppercase hover:bg-yellow-500 hover:shadow-lg transition-all transform hover:scale-105 whitespace-nowrap"
        >
          SELL HERE
        </button>
      </div>
    </div>
  </div>

  {/* Decorative diamonds - hidden on small screens */}
  <div className="hidden md:flex absolute top-[12%] right-[25%] sm:right-[28%] md:right-[30%] lg:right-[32%] xl:right-[34%] items-center gap-2 pointer-events-none">
    <div className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4 bg-yellow-400 rotate-45" />
    <div className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 bg-yellow-400 rotate-45" />
    <div className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 bg-yellow-400 rotate-45" />
  </div>
</div>
{/* ====== END HERO SECTION ====== */}
    <div>
      {/* your existing hero section */}
      <div className="mt-8 flex justify-center">
        <IndiaWeatherAdvanced />
      </div>
    </div>
			</div>
			<FarmerCarousel />
			  <div>
     
      <FarmerResourceCards /> {/* 👈 Add below the carousel */}
    </div>
			<CropPriceSearch />
			<CropYieldPredictor />
			<Footer />
			<Chatbot />
		</>
	);
}
