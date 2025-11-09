import React from "react";
import { Link } from "react-router-dom";
import {
	Sprout,
	Mail,
	Phone,
	MapPin,
	Facebook,
	Twitter,
	Instagram,
	Linkedin,
	Shield,
	CreditCard,
	Clock,
	ArrowUp,
	Heart,
} from "lucide-react";
import { subscriptionService } from "../services/subscriptionService";

/**
 * Comprehensive Dashboard Footer for CropConnect
 * Features:
 * - Multi-column layout with About, Quick Links, Contact
 * - Social media links
 * - Trust badges (Verified, Secure, 24/7 Support)
 * - Newsletter subscription (optional)
 * - Agricultural pattern background
 * - Quick action buttons
 */
export default function DashboardFooter({ actions = [], note, role, fullWidth = false }) {
	const year = new Date().getFullYear();
	const [email, setEmail] = React.useState("");
	const [subscribed, setSubscribed] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [statusMsg, setStatusMsg] = React.useState("");

	const handleSubscribe = async (e) => {
		e.preventDefault();
		if (!email) return;
		setLoading(true);
		setStatusMsg("");
		try {
			const source = role ? `${String(role).toLowerCase()}-footer` : "footer";
			const res = await subscriptionService.subscribe(email, source);
			setSubscribed(true);
			setStatusMsg(res?.message || "Thanks for subscribing!");
			setEmail("");
			setTimeout(() => {
				setSubscribed(false);
				setStatusMsg("");
			}, 4000);
		} catch (err) {
			const msg = err?.response?.data?.message || "Something went wrong. Please try again.";
			setStatusMsg(msg);
		} finally {
			setLoading(false);
		}
	};

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<footer className="mt-8 w-full border-t border-slate-800 bg-slate-900 text-slate-200">
<div className={fullWidth ? "relative w-full px-4 sm:px-8 lg:px-12 py-12" : "relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"}>
				{/* Quick Actions */}
				{actions.length > 0 && (
					<div className="mb-12">
						<h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
							<Sprout className="w-5 h-5 text-emerald-400" />
							Quick Actions
						</h3>
						<div className="flex flex-wrap gap-3">
							{actions.map((a, i) => {
								const Icon = a.icon;
								const renderIcon = () => {
									if (!Icon) return null;
									// If a JSX element was passed
									if (React.isValidElement(Icon)) {
										return React.cloneElement(Icon, { className: "w-5 h-5" });
									}
									// If a component/function was passed
									if (typeof Icon === "function") {
										return <Icon className="w-5 h-5" />;
									}
									// Otherwise (e.g., icon definition objects), skip rendering
									return null;
								};
								return (
									<button
										key={i}
										onClick={a.onClick}
										className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-xl transition-all duration-300 font-semibold transform hover:scale-105"
									>
										{renderIcon()}
										<span>{a.label}</span>
									</button>
								);
							})}
						</div>
					</div>
				)}

				{/* Main Footer Content */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
					{/* About CropConnect */}
					<div>
						<div className="flex items-center gap-3 mb-4">
							<div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
								<Sprout className="w-6 h-6 text-white" strokeWidth={2.5} />
							</div>
							<h3 className="text-xl font-bold text-white">CropConnect</h3>
						</div>
						<p className="text-sm text-slate-300 leading-relaxed mb-4">
							Empowering farmers by connecting them with Tractors,workers,
							equipment, and markets. Building a sustainable agricultural
							ecosystem for everyone.
						</p>
						<div className="flex gap-3">
							<a
								href="https://facebook.com"
								target="_blank"
								rel="noopener noreferrer"
className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition"
							>
								<Facebook className="w-5 h-5" />
							</a>
							<a
								href="https://twitter.com"
								target="_blank"
								rel="noopener noreferrer"
className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition"
							>
								<Twitter className="w-5 h-5" />
							</a>
							<a
								href="https://instagram.com"
								target="_blank"
								rel="noopener noreferrer"
className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-pink-300 transition"
							>
								<Instagram className="w-5 h-5" />
							</a>
							<a
								href="https://linkedin.com"
								target="_blank"
								rel="noopener noreferrer"
className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-blue-300 transition"
							>
								<Linkedin className="w-5 h-5" />
							</a>
						</div>
					</div>

					{/* Quick Links */}
					<div>
						<h4 className="text-sm font-bold text-slate-100 mb-4 uppercase tracking-wide">
							Quick Links
						</h4>
						<ul className="space-y-2">
							<li>
								<Link
									to="/dashboard"
className="text-sm text-slate-300 hover:text-emerald-400 transition flex items-center gap-2"
								>
									<span>Dashboard</span>
								</Link>
							</li>
							<li>
								<Link
									to="/help"
									className="text-sm text-gray-600 hover:text-green-600 transition flex items-center gap-2"
								>
									<span>Help Center</span>
								</Link>
							</li>
							<li>
								<Link
									to="/blog"
									className="text-sm text-gray-600 hover:text-green-600 transition flex items-center gap-2"
								>
									<span>Blog & Resources</span>
								</Link>
							</li>
							<li>
								<Link
									to="/terms"
									className="text-sm text-gray-600 hover:text-green-600 transition flex items-center gap-2"
								>
									<span>Terms of Service</span>
								</Link>
							</li>
							<li>
								<Link
									to="/privacy"
									className="text-sm text-gray-600 hover:text-green-600 transition flex items-center gap-2"
								>
									<span>Privacy Policy</span>
								</Link>
							</li>
						</ul>
					</div>

					{/* Contact Information */}
					<div>
						<h4 className="text-sm font-bold text-slate-100 mb-4 uppercase tracking-wide">
							Contact Us
						</h4>
						<ul className="space-y-3">
<li className="flex items-start gap-3 text-sm text-slate-300">
								<Mail className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
								<div>
<p className="font-medium text-slate-100">Email</p>
									<a
										href="mailto:support@cropconnect.com"
className="hover:text-emerald-400 transition"
									>
										support@cropconnect.com
									</a>
								</div>
							</li>
<li className="flex items-start gap-3 text-sm text-slate-300">
								<Phone className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
								<div>
<p className="font-medium text-slate-100">Phone</p>
									<a
										href="tel:+911234567890"
										className="hover:text-green-600 transition"
									>
										+91 6309639767
									</a>
								</div>
							</li>
<li className="flex items-start gap-3 text-sm text-slate-300">
								<MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
								<div>
<p className="font-medium text-slate-100">Address</p>
									<p>
										Agricultural Innovation Hub
										<br />
										Hyderabad, Telangana, India
									</p>
								</div>
							</li>
						</ul>
					</div>

					{/* Newsletter */}
					<div>
						<h4 className="text-sm font-bold text-slate-100 mb-4 uppercase tracking-wide">
							Stay Updated
						</h4>
						<p className="text-sm text-slate-300 mb-4">
							Subscribe to get updates on new features, market prices, and
							farming tips.
						</p>
						{subscribed ? (
							<div className="p-4 rounded-xl bg-green-100 border border-green-200 text-green-800 text-sm font-semibold flex items-center gap-2" aria-live="polite">
								<Heart className="w-4 h-4" />
								{statusMsg || "Thanks for subscribing!"}
							</div>
						) : (
							<form onSubmit={handleSubscribe} className="space-y-2">
<input
									type="email"
									name="email"
									autoComplete="email"
									inputMode="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="Your email address"
									className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition"
									required
								/>
								{statusMsg && (
									<p className="text-xs text-red-400" role="alert">{statusMsg}</p>
								)}
								<button
									type="submit"
									disabled={loading}
									className="w-full px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 font-semibold text-sm shadow-md hover:shadow-lg transition"
								>
									{loading ? "Subscribing..." : "Subscribe"}
								</button>
							</form>
						)}
					</div>
				</div>

				{/* Trust Badges */}
				<div className="py-6 border-y border-slate-800">
					<div className="flex flex-wrap items-center justify-center gap-6">
						<div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm">
							<Shield className="w-5 h-5 text-green-600" />
							<span className="text-sm font-semibold text-gray-700">
								Verified Platform
							</span>
						</div>
						<div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm">
							<CreditCard className="w-5 h-5 text-green-600" />
							<span className="text-sm font-semibold text-gray-700">
								Secure Payments
							</span>
						</div>
						<div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm">
							<Clock className="w-5 h-5 text-green-600" />
							<span className="text-sm font-semibold text-gray-700">
								24/7 Support
							</span>
						</div>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
					<div className="text-sm text-slate-400 text-center sm:text-left">
						<span className="font-semibold text-white">CropConnect</span> © {year}
						<span className="mx-2">•</span>
						<span>All rights reserved</span>
						<span className="mx-2">•</span>
						<span className="hidden sm:inline">
							Bridging farmers, buyers, workers and services
						</span>
					</div>
					<button
						onClick={scrollToTop}
						className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition"
						aria-label="Back to top"
					>
						<ArrowUp className="w-4 h-4" />
						<span>Back to top</span>
					</button>
				</div>

				{note && (
					<p className="mt-4 text-xs text-gray-500 text-center">{note}</p>
				)}

				{/* Platform version */}
				<p className="mt-2 text-xs text-slate-500 text-center">
					Platform v1.0.0 {role && `• ${role} Dashboard`}
				</p>
			</div>
		</footer>
	);
}
