import React from "react";
import { Sprout, LogOut, Menu, X } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import LanguageSelector from "./LanguageSelector";
import { Link } from "react-router-dom";

/**
 * Responsive, safe-area aware Dashboard Navbar for CropConnect
 * - Preserves existing logic & API
 * - Handles ultra-small to wide screens gracefully
 * - Reduces layout shift by avoiding fixed heights
 * - Improves overflow behavior for tabs and actions
 */
export default function DashboardNavbar({
	role,
	userName,
	onLogout,
	tabs = [],
	activeTab,
	onTabChange,
}) {
	const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

	const showTabs =
		Array.isArray(tabs) && tabs.length > 0 && typeof onTabChange === "function";

	// Close mobile menu on route change (optional safeguard)
	React.useEffect(() => {
		const onResize = () => {
			// Close the menu if we grow past the small breakpoint
			if (window.innerWidth >= 640 && mobileMenuOpen) setMobileMenuOpen(false);
		};
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, [mobileMenuOpen]);

	// Role-based theme colors
	const roleThemes = {
		Farmer: {
			gradient: "from-green-500 to-emerald-600",
			badge: "bg-green-100 text-green-700",
		},
		Worker: {
			gradient: "from-emerald-500 to-teal-600",
			badge: "bg-emerald-100 text-emerald-700",
		},
		"Tractor Owner": {
			gradient: "from-sky-500 to-blue-600",
			badge: "bg-sky-100 text-sky-700",
		},
		Buyer: {
			gradient: "from-purple-500 to-indigo-600",
			badge: "bg-purple-100 text-purple-700",
		},
	};

	const theme = roleThemes[role] || roleThemes["Farmer"];

	return (
		<header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg supports-[padding:max(0px,env(safe-area-inset-top))]:pt-[max(0px,env(safe-area-inset-top))] dark:bg-gray-900/80 dark:border-gray-800">
			{/* Main bar */}
			<div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
				<div className="flex items-center justify-between py-3 sm:py-4 min-h-[56px] sm:min-h-[64px]">
					{/* Left: Brand + role */}
					<div className="min-w-0 flex items-center gap-3 sm:gap-4">
						<div className="p-2.5 sm:p-3 rounded-2xl bg-green-600 shadow-lg hover:shadow-xl transition-shadow duration-300 shrink-0">
							<Sprout
								className="w-6 h-6 sm:w-7 sm:h-7 text-white"
								strokeWidth={2.5}
							/>
						</div>
						<div className="min-w-0">
							<div className="flex items-center gap-2 sm:gap-3 min-w-0">
								<h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300 truncate">
									CropConnect
								</h1>
								{role && (
									<span
										className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${theme.badge} shadow-sm shrink-0`}
									>
										{role}
									</span>
								)}
							</div>
							<p className="hidden xs:block text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 font-medium tracking-wide dark:text-gray-400">
								Growing Together • Empowering Farmers
							</p>
						</div>
					</div>

					{/* Right: Controls */}
					<div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
						{/* User greeting (desktop) */}
						{userName && (
							<div className="hidden xl:flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-800/60 dark:border-gray-700">
								<div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold shadow-md shrink-0">
									{userName.charAt(0).toUpperCase()}
								</div>
								<div className="min-w-0">
									<p className="text-[11px] text-gray-500 font-medium dark:text-gray-400">
										Welcome back
									</p>
									<p className="text-sm font-bold text-gray-900 dark:text-white truncate">
										{userName}
									</p>
								</div>
							</div>
						)}

						{/* Notification Bell */}
						<div className="shrink-0">
							<NotificationBell />
						</div>

						{/* Language Selector */}
						<div className="hidden xs:block shrink-0">
							<LanguageSelector />
						</div>

						{/* Browse Crops (Buyer only) */}
						{role === "Buyer" && (
							<Link
								to="/crops"
								className="hidden md:inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-white bg-green-600 hover:bg-green-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md shrink-0"
							>
								Browse Crops
							</Link>
						)}

						{/* Logout Button */}
						{typeof onLogout === "function" && (
							<button
								onClick={onLogout}
								className="hidden sm:inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-gray-800 text-white hover:bg-gray-100 hover:text-red-600 border-2 border-transparent hover:border-red-200 transition-all duration-200 font-semibold shadow-sm hover:shadow-md shrink-0"
								title="Logout"
								aria-label="Logout"
							>
								<LogOut className="w-5 h-5" />
								<span className="hidden lg:inline">Logout</span>
							</button>
						)}

						{/* Mobile menu button */}
						<button
							onClick={() => setMobileMenuOpen((v) => !v)}
							className="sm:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 shrink-0"
							aria-label="Toggle menu"
						>
							{mobileMenuOpen ? (
								<X className="w-6 h-6" />
							) : (
								<Menu className="w-6 h-6" />
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Mobile menu */}
			<div
				className={`sm:hidden overflow-hidden transition-[max-height] duration-300 ease-in-out border-t border-gray-200 dark:border-gray-800 ${
					mobileMenuOpen ? "max-h-[520px]" : "max-h-0"
				}`}
			>
				<div className="px-3 py-3 space-y-3 bg-white/95 dark:bg-gray-900/80">
					{userName && (
						<div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
							<div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-base shadow-md">
								{userName.charAt(0).toUpperCase()}
							</div>
							<div>
								<p className="text-xs text-gray-500 font-medium dark:text-gray-400">
									Welcome back
								</p>
								<p className="text-sm font-bold text-gray-900 dark:text-white">
									{userName}
								</p>
							</div>
						</div>
					)}

					{/* Mobile: Language & Actions */}
					<div className="flex items-center gap-2">
						<div className="flex-1 min-w-0">
							<LanguageSelector />
						</div>
						{role === "Buyer" && (
							<Link
								to="/crops"
								className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 flex-shrink-0"
							>
								Browse
							</Link>
						)}
					</div>

					{typeof onLogout === "function" && (
						<button
							onClick={onLogout}
							className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-800 text-white hover:bg-gray-100 hover:text-red-600 transition font-semibold"
						>
							<LogOut className="w-5 h-5" />
							<span>Logout</span>
						</button>
					)}
				</div>
			</div>

			{/* Tabs (Desktop & Mobile) */}
			{showTabs && (
				<div className="border-t border-gray-200 bg-white/80 dark:bg-gray-900/70 dark:border-gray-800">
					<div className="w-full max-w-screen-2xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
						<div
							className="flex gap-1 sm:gap-2 md:gap-3 overflow-x-auto py-1 sm:py-2 -mb-px scroll-px-2 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none]"
							style={{ scrollbarWidth: "none" }}
						>
							{/* Hide scrollbar for WebKit */}
							<style>{`
                .no-scrollbar::-webkit-scrollbar{ display:none; }
              `}</style>
							{tabs.map((t) => (
								<button
									key={t.id}
									onClick={() => onTabChange(t.id)}
									className={`relative py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all duration-200 snap-start rounded-t-lg ${
										activeTab === t.id
											? "border-green-600 text-green-700 bg-green-50/60 dark:border-emerald-400 dark:text-emerald-300 dark:bg-emerald-900/20"
											: "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50/50 dark:text-gray-300 dark:hover:text-white dark:hover:border-gray-600 dark:hover:bg-gray-800/40"
									}`}
								>
									{t.icon ? <t.icon className="w-4 h-4 shrink-0" /> : null}
									<span className="truncate max-w-[40vw] sm:max-w-none">
										{t.label}
									</span>
									{typeof t.badge === "number" && t.badge > 0 && (
										<span className="inline-flex items-center justify-center min-w-[18px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-green-600 text-white shadow-sm dark:bg-emerald-500">
											{t.badge}
										</span>
									)}
								</button>
							))}
						</div>
					</div>
				</div>
			)}
		</header>
	);
}
