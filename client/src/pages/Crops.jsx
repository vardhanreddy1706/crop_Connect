import { Link } from "react-router-dom";

const crops = [
	{
		id: 1,
		name: "Onion",
		img: "/onion.jpeg",
		price: 1350,
		seller: "Ravi Kumar",
	},
	{
		id: 2,
		name: "Tomato",
		img: "/tomato.jpeg",
		price: 2250,
		seller: "Sita Devi",
	},
	{
		id: 3,
		name: "Paddy",
		img: "/paddy.jpeg",
		price: 1800,
		seller: "Mohan Singh",
	},
	{
		id: 4,
		name: "Cotton",
		img: "/cotton.jpeg",
		price: 5500,
		seller: "Lakshmi Reddy",
	},
	{
		id: 5,
		name: "Wheat",
		img: "/wheat.jpeg",
		price: 2100,
		seller: "Rajesh Patel",
	},
];

export default function Crops() {
	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-green-700 text-white py-16">
				<div className="max-w-7xl mx-auto px-8">
					<h1 className="text-4xl font-bold mb-4">🌾 Available Crops</h1>
					<p className="text-lg">
						Fresh crops from verified sellers across India
					</p>
				</div>
			</div>

			{/* Crops Grid */}
			<div className="max-w-7xl mx-auto px-8 py-12">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
					{crops.map((crop) => (
						<div
							key={crop.id}
							className="border rounded-xl p-6 shadow-lg hover:shadow-2xl transition bg-white"
						>
							<img
								src={crop.img}
								alt={crop.name}
								className="rounded-lg w-full h-48 object-cover mb-4"
								onError={(e) => {
									e.target.src =
										"https://via.placeholder.com/400x300?text=" + crop.name;
								}}
							/>
							<h3 className="text-xl font-semibold mb-2">{crop.name}</h3>
							<p className="text-gray-600 text-sm mb-2">
								Seller: {crop.seller}
							</p>
							<p className="text-green-700 text-2xl font-bold mb-4">
								₹{crop.price}/quintal
							</p>
							<Link
								to={`/crops/${crop.id}`}
								className="block w-full text-center bg-green-700 text-white px-4 py-3 rounded-lg hover:bg-green-800 transition font-semibold"
							>
								View Details
							</Link>
						</div>
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
