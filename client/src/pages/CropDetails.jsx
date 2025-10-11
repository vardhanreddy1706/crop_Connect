// src/pages/CropDetails.jsx
import { useParams, Link } from "react-router-dom";
import { useState } from "react";

const cropData = {
	1: {
		name: "Onion",
		seller: "Ravi Kumar",
		contact: "+91 9876543210",
		state: "Karnataka",
		district: "Bangalore",
		market: "KR Market",
		commodity: "Onion",
		variety: "Red Onion",
		grade: "A",
		arrival_date: "2025-10-09",
		min_price: 1200,
		max_price: 1500,
		modal_price: 1350,
		description:
			"Premium quality red onions freshly harvested. Ideal for both domestic use and commercial purposes. Grade A quality with excellent shelf life.",
		image: "/onion.jpeg",
	},
	2: {
		name: "Tomato",
		seller: "Sita Devi",
		contact: "+91 9876543211",
		state: "Maharashtra",
		district: "Pune",
		market: "Pune Market",
		commodity: "Tomato",
		variety: "Cherry",
		grade: "A",
		arrival_date: "2025-10-08",
		min_price: 2000,
		max_price: 2500,
		modal_price: 2250,
		description:
			"Fresh cherry tomatoes with vibrant red color. Perfect for salads and cooking. High nutritional value and rich taste.",
		image: "/tomato.jpeg",
	},
	3: {
		name: "Paddy",
		seller: "Mohan Singh",
		contact: "+91 9876543212",
		state: "Punjab",
		district: "Ludhiana",
		market: "Ludhiana Mandi",
		commodity: "Paddy",
		variety: "Basmati",
		grade: "A",
		arrival_date: "2025-10-07",
		min_price: 1600,
		max_price: 2000,
		modal_price: 1800,
		description:
			"Premium basmati paddy with long grains and aromatic fragrance. Ideal for quality rice production.",
		image: "/paddy.jpeg",
	},
	4: {
		name: "Cotton",
		seller: "Lakshmi Reddy",
		contact: "+91 9876543213",
		state: "Gujarat",
		district: "Ahmedabad",
		market: "Ahmedabad Cotton Market",
		commodity: "Cotton",
		variety: "Hybrid",
		grade: "A",
		arrival_date: "2025-10-06",
		min_price: 5000,
		max_price: 6000,
		modal_price: 5500,
		description:
			"High-quality hybrid cotton with excellent fiber length and strength. Suitable for textile manufacturing.",
		image: "/cotton.jpeg",
	},
	5: {
		name: "Wheat",
		seller: "Rajesh Patel",
		contact: "+91 9876543214",
		state: "Madhya Pradesh",
		district: "Indore",
		market: "Indore Grain Market",
		commodity: "Wheat",
		variety: "Durum",
		grade: "A",
		arrival_date: "2025-10-05",
		min_price: 1900,
		max_price: 2300,
		modal_price: 2100,
		description:
			"Premium durum wheat with high protein content. Perfect for making bread, pasta, and other wheat products.",
		image: "/wheat.jpeg",
	},
};

export default function CropDetails() {
	const { id } = useParams();
	const crop = cropData[id];
	const [quantity, setQuantity] = useState(1);

	if (!crop) {
		return <h2 className="p-8 text-center text-red-600">Crop not found!</h2>;
	}

	const handleAddToCart = () => {
		alert(`Added ${quantity} quintal(s) of ${crop.name} to cart!`);
	};

	const handleBuyNow = () => {
		alert(`Proceeding to buy ${quantity} quintal(s) of ${crop.name}`);
	};

	return (
		<div className="p-8 min-h-screen bg-gray-50">
			<Link
				to="/crops"
				className="text-blue-600 hover:underline mb-6 inline-block"
			>
				← Back to Crops
			</Link>

			<div className="flex flex-col lg:flex-row gap-8 bg-white p-6 rounded-xl shadow-lg">
				{/* Left Side: Single Image */}
				<div className="lg:w-1/2">
					<img
						src={crop.image}
						alt={crop.name}
						className="w-full h-96 object-cover rounded-xl shadow-md"
						onError={(e) => {
							e.target.onerror = null;
							e.target.src =
								"https://via.placeholder.com/800x600?text=" + crop.name;
						}}
					/>
				</div>

				{/* Right Side: Details */}
				<div className="lg:w-1/2 space-y-4">
					<h2 className="text-3xl font-bold text-gray-800">{crop.name}</h2>

					<p className="text-gray-600">{crop.description}</p>

					<div className="border-t border-b py-4 space-y-2">
						<div className="grid grid-cols-2 gap-2 text-sm">
							<p>
								<span className="font-semibold">Seller:</span> {crop.seller}
							</p>
							<p>
								<span className="font-semibold">Contact:</span> {crop.contact}
							</p>
							<p>
								<span className="font-semibold">State:</span> {crop.state}
							</p>
							<p>
								<span className="font-semibold">District:</span> {crop.district}
							</p>
							<p>
								<span className="font-semibold">Market:</span> {crop.market}
							</p>
							<p>
								<span className="font-semibold">Variety:</span> {crop.variety}
							</p>
							<p>
								<span className="font-semibold">Grade:</span> {crop.grade}
							</p>
							<p>
								<span className="font-semibold">Arrival Date:</span>{" "}
								{crop.arrival_date}
							</p>
						</div>
					</div>

					{/* Price Section */}
					<div className="bg-green-50 p-4 rounded-lg">
						<div className="flex justify-between items-center mb-2">
							<span className="text-gray-600">Min Price:</span>
							<span className="font-semibold">₹{crop.min_price}/quintal</span>
						</div>
						<div className="flex justify-between items-center mb-2">
							<span className="text-gray-600">Max Price:</span>
							<span className="font-semibold">₹{crop.max_price}/quintal</span>
						</div>
						<div className="flex justify-between items-center border-t pt-2">
							<span className="text-lg font-bold text-gray-800">
								Modal Price:
							</span>
							<span className="text-2xl font-bold text-green-700">
								₹{crop.modal_price}/quintal
							</span>
						</div>
					</div>

					{/* Quantity Selector */}
					<div className="flex items-center gap-4">
						<label className="font-semibold">Quantity (quintals):</label>
						<div className="flex items-center border rounded-lg">
							<button
								onClick={() => setQuantity(Math.max(1, quantity - 1))}
								className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-l-lg"
							>
								-
							</button>
							<input
								type="number"
								value={quantity}
								onChange={(e) =>
									setQuantity(Math.max(1, parseInt(e.target.value) || 1))
								}
								className="w-20 text-center border-x py-2"
								min="1"
							/>
							<button
								onClick={() => setQuantity(quantity + 1)}
								className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-r-lg"
							>
								+
							</button>
						</div>
					</div>

					{/* Total Price */}
					<div className="bg-gray-100 p-4 rounded-lg">
						<div className="flex justify-between items-center">
							<span className="text-lg font-semibold">Total Amount:</span>
							<span className="text-2xl font-bold text-green-700">
								₹{(crop.modal_price * quantity).toLocaleString()}
							</span>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-4 pt-4">
						<button
							onClick={handleAddToCart}
							className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
						>
							🛒 Add to Cart
						</button>
						<button
							onClick={handleBuyNow}
							className="flex-1 bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition"
						>
							Buy Now
						</button>
					</div>

					{/* Contact Seller Button */}
					<a
						href={`tel:${crop.contact}`}
						className="block w-full text-center bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-900 transition"
					>
						📞 Contact Seller
					</a>
				</div>
			</div>
		</div>
	);
}
