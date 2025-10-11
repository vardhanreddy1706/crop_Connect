// src/pages/dashboards/BuyerDashboard.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	ShoppingCart,
	Package,
	TrendingUp,
	Heart,
	Star,
	Filter,
	Search,
	MapPin,
	ArrowLeft,
	Eye,
	Plus,
} from "lucide-react";

const mockOrders = [
	{
		id: 1,
		seller: "Green Valley Farm",
		crop: "Wheat",
		quantity: "100 kg",
		price: "₹4,500",
		date: "Nov 1, 2025",
		status: "Delivered",
	},
	{
		id: 2,
		seller: "Organic Harvest",
		crop: "Rice (Basmati)",
		quantity: "50 kg",
		price: "₹3,800",
		date: "Nov 5, 2025",
		status: "In Transit",
	},
	{
		id: 3,
		seller: "Fresh Farms Co.",
		crop: "Tomatoes",
		quantity: "20 kg",
		price: "₹600",
		date: "Nov 8, 2025",
		status: "Processing",
	},
];

const mockWishlist = [
	{
		id: 1,
		seller: "Sunrise Organics",
		crop: "Organic Wheat",
		price: "₹52/kg",
		rating: 4.8,
	},
	{
		id: 2,
		seller: "Valley Fresh",
		crop: "Red Onions",
		price: "₹28/kg",
		rating: 4.5,
	},
];

const StatCard = ({  title, value, unit, color }) => (
	<div
		className={`p-4 bg-white border-l-4 ${color} shadow-lg rounded-xl transition hover:shadow-xl`}
	>
		<div className="flex items-center justify-between">
			<div className="text-sm font-medium text-gray-500">{title}</div>
			<Icon className="w-6 h-6 text-gray-400" />
		</div>
		<p className="mt-1 text-3xl font-bold text-gray-900">
			{value}
			{unit && (
				<span className="ml-1 text-base font-normal text-gray-500">{unit}</span>
			)}
		</p>
	</div>
);

function BuyerDashboard() {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState("");
	const [filterStatus, setFilterStatus] = useState("all");

	const filteredOrders = mockOrders.filter((order) => {
		const matchesSearch =
			order.crop.toLowerCase().includes(searchTerm.toLowerCase()) ||
			order.seller.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus =
			filterStatus === "all" || order.status === filterStatus;
		return matchesSearch && matchesStatus;
	});

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
			<header className="bg-white shadow-md p-4 md:p-6 sticky top-0 z-10">
				<div className="max-w-7xl mx-auto flex justify-between items-center">
					<div className="flex items-center gap-4">
						<button
							onClick={() => navigate(-1)}
							className="text-gray-600 hover:text-gray-800"
						>
							<ArrowLeft className="w-6 h-6" />
						</button>
						<h1 className="text-3xl font-extrabold text-gray-900">
							Buyer Dashboard
						</h1>
					</div>
					<button
						onClick={() => navigate("/crops")}
						className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition shadow-md"
					>
						<Plus className="w-5 h-5" />
						<span>Browse Crops</span>
					</button>
				</div>
			</header>

			<main className="max-w-7xl mx-auto p-4 md:p-8 space-y-10">
				{/* Statistics */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
					<StatCard
						icon={Package}
						title="Total Orders"
						value={mockOrders.length}
						color="border-blue-500"
					/>
					<StatCard
						icon={ShoppingCart}
						title="Active Orders"
						value={mockOrders.filter((o) => o.status !== "Delivered").length}
						color="border-green-500"
					/>
					<StatCard
						icon={TrendingUp}
						title="Total Spent"
						value="₹8,900"
						color="border-purple-500"
					/>
					<StatCard
						icon={Heart}
						title="Wishlist Items"
						value={mockWishlist.length}
						color="border-pink-500"
					/>
				</div>

				{/* Search and Filter */}
				<div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/50">
					<div className="grid md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Search Orders
							</label>
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
								<input
									type="text"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
									placeholder="Search by crop or seller..."
								/>
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Filter by Status
							</label>
							<div className="relative">
								<Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
								<select
									value={filterStatus}
									onChange={(e) => setFilterStatus(e.target.value)}
									className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
								>
									<option value="all">All Orders</option>
									<option value="Processing">Processing</option>
									<option value="In Transit">In Transit</option>
									<option value="Delivered">Delivered</option>
								</select>
							</div>
						</div>
					</div>
				</div>

				{/* Orders List */}
				<section className="bg-white p-6 rounded-xl shadow-lg">
					<h3 className="text-xl font-bold mb-4 text-gray-700 flex items-center">
						<Package className="w-5 h-5 mr-2" /> Your Orders
					</h3>
					<div className="space-y-4">
						{filteredOrders.map((order) => (
							<div
								key={order.id}
								className="p-4 border border-blue-200 rounded-lg bg-blue-50 flex justify-between items-center hover:shadow-md transition"
							>
								<div className="flex-1">
									<p className="font-semibold text-blue-700">
										{order.crop} from {order.seller}
									</p>
									<p className="text-sm text-gray-600">
										Quantity: {order.quantity} | Price: {order.price}
									</p>
									<p className="text-xs text-gray-500">
										Order Date: {order.date}
									</p>
								</div>
								<div className="flex items-center gap-3">
									<span
										className={`px-3 py-1 rounded-full text-xs font-semibold ${
											order.status === "Delivered"
												? "bg-green-100 text-green-800"
												: order.status === "In Transit"
												? "bg-yellow-100 text-yellow-800"
												: "bg-orange-100 text-orange-800"
										}`}
									>
										{order.status}
									</span>
									<button className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
										<Eye className="w-4 h-4" />
										View
									</button>
								</div>
							</div>
						))}
					</div>
				</section>

				{/* Wishlist */}
				<section className="bg-white p-6 rounded-xl shadow-lg">
					<h3 className="text-xl font-bold mb-4 text-gray-700 flex items-center">
						<Heart className="w-5 h-5 mr-2" /> Wishlist
					</h3>
					<div className="grid md:grid-cols-2 gap-4">
						{mockWishlist.map((item) => (
							<div
								key={item.id}
								className="p-4 border rounded-lg bg-pink-50 hover:shadow-md transition"
							>
								<div className="flex justify-between items-start mb-2">
									<div>
										<p className="font-semibold text-gray-800">{item.crop}</p>
										<p className="text-sm text-gray-600">{item.seller}</p>
									</div>
									<button className="text-red-500 hover:text-red-700">
										<Heart className="w-5 h-5 fill-current" />
									</button>
								</div>
								<div className="flex justify-between items-center">
									<p className="text-lg font-bold text-blue-700">
										{item.price}
									</p>
									<div className="flex items-center gap-1">
										<Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
										<span className="text-sm font-medium">{item.rating}</span>
									</div>
								</div>
								<button className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
									Add to Cart
								</button>
							</div>
						))}
					</div>
				</section>
			</main>
		</div>
	);
}

export default BuyerDashboard;
