// src/components/Footer.jsx
import { Link } from "react-router-dom";

export default function Footer() {
	return (
		<footer className="bg-gray-900 text-gray-200 mt-8">
			<div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
				{/* Logo and description */}
				<div className="mb-8">
					{" "}
					{/* Adds extra bottom margin */}
					<div className="flex items-center mb-4">
						{" "}
						{/* Increased spacing */}
						<span className="text-green-500 text-3xl mr-3">🌱</span>
						<span className="text-2xl font-semibold">CropConnect</span>
					</div>
					<p className="text-gray-400 text-sm mb-1">
						Agricultural Products | Rural Entrepreneurship | Management System
					</p>
					<p className="text-gray-400 text-sm">CropConnect Hub</p>
				</div>

				{/* My Account */}
				<div>
					<h3 className="font-semibold mb-3">My Account</h3>
					<ul className="space-y-2 text-sm">
						<li>
							<a href="/profile" className="hover:underline">
								My Account
							</a>
						</li>
						<li>
							<a href="/orders" className="hover:underline">
								Order History
							</a>
						</li>
						<li>
							<a href="/cart" className="hover:underline">
								Shopping Cart
							</a>
						</li>
						<li>
							<a href="/wishlist" className="hover:underline">
								Wishlist
							</a>
						</li>
					</ul>
				</div>

				{/* Helps */}
				{/* Helps */}
				<div>
					<h3 className="font-semibold mb-3">Helps</h3>
					<ul className="space-y-2 text-sm">
						<li>
							<Link to="/help/contact" className="hover:underline">
								Contact
							</Link>
						</li>
						<li>
							<Link to="/help/faq" className="hover:underline">
								FAQs
							</Link>
						</li>
						<li>
							<Link to="/help/terms" className="hover:underline">
								Terms &amp; Conditions
							</Link>
						</li>
						<li>
							<Link to="/help/privacy" className="hover:underline">
								Privacy Policy
							</Link>
						</li>
					</ul>
				</div>

				{/* Categories */}
				<div>
					<h3 className="font-semibold mb-3">Categories</h3>
					<ul className="space-y-2 text-sm">
						<li>
							<a href="/crops" className="hover:underline">
								Crops
							</a>
						</li>
						<li>
							<a href="/workers" className="hover:underline">
								Workers Bookings
							</a>
						</li>
						<li>
							<a href="/tractors" className="hover:underline">
								Tractor Bookings
							</a>
						</li>
						<li>
							<a href="/products" className="hover:underline">
								Agriculture Products
							</a>
						</li>
						<li>
							<a href="/pesticides" className="hover:underline">
								Pesticides
							</a>
						</li>
					</ul>
				</div>
			</div>
			<div className="border-t border-gray-800 mt-8">
				<p className="text-center text-gray-500 text-xs py-4">
					©️ {new Date().getFullYear()} CropConnect. All rights reserved.
				</p>
			</div>
		</footer>
	);
}
