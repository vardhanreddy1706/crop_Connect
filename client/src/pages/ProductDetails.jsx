import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { products } from "./Products";

function ProductDetails() {
	const { id } = useParams();
	const navigate = useNavigate();
	const product = products.find((item) => item.id === parseInt(id));

	if (!product) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-red-600 mb-4">
						Product not found!
					</h2>
					<Link
						to="/products"
						className="text-green-700 font-semibold hover:underline"
					>
						← Back to Products
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-green-700 text-white py-12">
				<div className="max-w-7xl mx-auto px-8">
					<button
						onClick={() => navigate(-1)}
						className="text-white hover:underline mb-4 flex items-center gap-2"
					>
						<span>←</span> Back
					</button>
					<h1 className="text-3xl font-bold">{product.name}</h1>
				</div>
			</div>

			{/* Product Details */}
			<div className="max-w-7xl mx-auto px-8 py-12">
				<div className="bg-white rounded-lg shadow-lg overflow-hidden">
					<div className="flex flex-col md:flex-row gap-8 p-8">
						{/* Product Image */}
						<div className="md:w-1/2">
							<img
								src={product.image}
								alt={product.name}
								className="w-full h-96 object-cover rounded-xl shadow-md"
							/>
						</div>

						{/* Product Information */}
						<div className="md:w-1/2 flex flex-col justify-between">
							<div>
								<span className="inline-block text-xs font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full mb-4">
									{product.category}
								</span>

								<h2 className="text-3xl font-bold mb-4 text-gray-900">
									{product.name}
								</h2>

								<p className="text-gray-700 mb-6 text-lg leading-relaxed">
									{product.description}
								</p>

								<div className="bg-gray-50 p-6 rounded-lg mb-6">
									<p className="text-green-700 text-4xl font-bold mb-2">
										₹{product.price}
									</p>
									<p className="text-gray-500 text-sm">
										Price inclusive of all taxes
									</p>
								</div>

								{/* Additional Product Details */}
								<div className="space-y-3 mb-6">
									<div className="flex items-center gap-2">
										<span className="text-gray-600">✓</span>
										<span className="text-gray-700">
											Free delivery on orders above ₹500
										</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-gray-600">✓</span>
										<span className="text-gray-700">
											100% Authentic products
										</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-gray-600">✓</span>
										<span className="text-gray-700">7-day return policy</span>
									</div>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-4">
								<button className="flex-1 bg-green-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-800 transition-colors">
									Buy Now
								</button>
								<button className="flex-1 bg-yellow-400 text-white px-8 py-4 rounded-lg font-semibold hover:bg-yellow-500 transition-colors">
									Add to Cart
								</button>
							</div>

							<div className="mt-6">
								<Link
									to="/products"
									className="text-green-700 font-semibold hover:underline"
								>
									← Back to Products
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ProductDetails;
