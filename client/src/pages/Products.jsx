import React from "react";
import { Link } from "react-router-dom"; 
const products = [
	{
		id: 1,
		name: "Organic Fertilizer",
		price: 350,
		category: "Fertilizers",
		image: "/orgonic.jpg",
		description: "Eco-friendly fertilizer made from composted organic matter.",
	},
	{
		id: 2,
		name: "Nitrogen Fertilizer[UREA]",
		price: 420,
		category: "Fertilizers",
		image: "/urea.jpg",
		description: "Boosts crop yield and promotes leaf growth.",
	},
	{
		id: 3,
		name: "Phosphate Fertilizer",
		price: 390,
		category: "Fertilizers",
		image: "/phosphate.webp",
		description: "Improves root development and crop strength.",
	},
	{
		id: 4,
		name: "Pesticide Spray",
		price: 320,
		category: "Pesticides",
		image: "/spray.jpg",
		description: "Effective pesticide for crop protection.",
	},
	{
		id: 5,
		name: "Wheat Seeds",
		price: 180,
		category: "Seeds",
		image: "/seeds.jpg",
		description: "Premium quality wheat seeds.",
	},
	{
		id: 6,
		name: "Farming Tools Kit",
		price: 1200,
		category: "Tools",
		image: "/toolkit.jpg",
		description: "Complete farming tools kit.",
	},
];

// Export products array for use in ProductDetails
// eslint-disable-next-line react-refresh/only-export-components
export { products };


function Products() {
	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header Section */}
			<div className="bg-green-700 text-white py-16">
				<div className="max-w-7xl mx-auto px-8">
					<h1 className="text-4xl font-bold mb-4">Our Products</h1>
					<p className="text-lg">Quality agricultural products for farmers</p>
				</div>
			</div>

			{/* Products Grid */}
			<div className="max-w-7xl mx-auto px-8 py-12">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{products.map((product) => (
						<Link
							key={product.id}
							to={`/products/${product.id}`}
							className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
						>
							{/* Product Image */}
							<img
								src={product.image}
								alt={product.name}
								className="w-full h-64 object-cover"
							/>

							{/* Product Info */}
							<div className="p-6">
								<div className="flex items-center justify-between mb-2">
									<span className="text-xs font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
										{product.category}
									</span>
								</div>

								<h3 className="text-xl font-semibold text-gray-800 mb-2">
									{product.name}
								</h3>

								<p className="text-gray-600 text-sm mb-4">
									{product.description}
								</p>

								<div className="flex items-center justify-between">
									<div className="text-2xl font-bold text-green-600">
										₹{product.price}
									</div>
									<button className="px-4 py-2 bg-yellow-400 text-white rounded-md font-semibold hover:bg-yellow-500 transition-colors">
										View Details
									</button>
								</div>
							</div>
						</Link>
					))}
				</div>

				{/* Back to Home */}
				<div className="mt-8 text-center">
					<Link to="/" className="text-green-700 font-semibold hover:underline">
						← Back to Home
					</Link>
				</div>
			</div>
		</div>
	);
}

export default Products;
