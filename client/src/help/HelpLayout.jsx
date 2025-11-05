// src/components/HelpLayout.jsx
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, HelpCircle, BookOpen } from "lucide-react";

const HelpLayout = ({ title, children }) => {
	const navigate = useNavigate();

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
			{/* Header Section */}
			<div className="bg-gradient-to-r from-green-600 to-emerald-600 py-12 px-4">
				<div className="max-w-4xl mx-auto">
					<button
						onClick={() => navigate(-1)}
						className="flex items-center gap-2 text-white hover:text-green-200 mb-6 transition-colors"
					>
						<ArrowLeft className="w-5 h-5" />
						Back
					</button>

					<div className="flex items-center gap-4 mb-4">
						<HelpCircle className="w-12 h-12 text-white" />
						<h1 className="text-4xl font-bold text-white">{title}</h1>
					</div>

					{/* Breadcrumb Navigation */}
					<nav className="flex items-center gap-2 text-sm text-green-100">
						<Link to="/" className="hover:text-white transition-colors">
							Home
						</Link>
						<span>/</span>
						<Link to="/help/faq" className="hover:text-white transition-colors">
							Help Center
						</Link>
						<span>/</span>
						<span className="text-white">{title}</span>
					</nav>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-4xl mx-auto px-4 py-12">
				<div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-green-100">
					{children}
				</div>

				{/* Help Navigation Sidebar */}
				<div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-green-100">
					<h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
						<BookOpen className="w-5 h-5 text-green-600" />
						More Help Topics
					</h3>
					<ul className="space-y-2 text-sm">
						<li>
							<Link to="/help/contact" className="text-gray-600 hover:text-green-600 hover:underline transition-colors">
								Contact
							</Link>
						</li>
						<li>
							<Link to="/help/faq" className="text-gray-600 hover:text-green-600 hover:underline transition-colors">
								FAQs
							</Link>
						</li>
						<li>
							<Link to="/help/terms" className="text-gray-600 hover:text-green-600 hover:underline transition-colors">
								Terms & Conditions
							</Link>
						</li>
						<li>
							<Link to="/help/privacy" className="text-gray-600 hover:text-green-600 hover:underline transition-colors">
								Privacy Policy
							</Link>
						</li>
					</ul>
				</div>
			</div>

			{/* Contact Section */}
			<div className="max-w-4xl mx-auto px-4 pb-12">
				<div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-xl p-8 text-white text-center">
					<h3 className="text-2xl font-bold mb-3">Still have questions?</h3>
					<p className="text-green-100 mb-6">
						Our support team is here to help you
					</p>
					<Link
						to="/help/contact"
						className="inline-block px-8 py-3 bg-white text-green-700 font-bold rounded-xl hover:bg-green-50 transition-all shadow-lg"
					>
						Contact Support
					</Link>
				</div>
			</div>
		</div>
	);
};

export default HelpLayout;
