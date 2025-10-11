// src/pages/dashboards/TractorDashboard.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Truck,
	DollarSign,
	Clock,
	Calendar,
	Star,
	Phone,
	Gauge,
	X,
	Plus,
	Tractor,
	ArrowLeft,
} from "lucide-react";

const mockBookings = [
	{
		id: 1,
		farmer: "Green Acres Farm",
		date: "Nov 5, 2025",
		status: "Confirmed",
		work: "Deep Plowing (10 acres)",
	},
	{
		id: 2,
		farmer: "Riverbend Orchards",
		date: "Nov 12, 2025",
		status: "Pending",
		work: "Tilling (5 acres)",
	},
];

// const mockRatings = [
	// {
		// id: 1,
		// farmer: "Sun Valley Crops",
		// rating: 5,
		// comment: "Tractor was modern, and the plowing was perfect.",
	// },
	// {
		// id: 2,
		// farmer: "Hillside Dairy",
		// rating: 4,
		// comment: "Arrived slightly late, but finished the job quickly.",
	// },
// ];

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

const TractorForm = ({ formData, handleChange, handleSubmit, handleClose }) => (
	<div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
		<div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl max-w-md w-full">
			<div className="flex justify-between items-center mb-6 border-b pb-3">
				<h3 className="text-2xl font-semibold text-green-700">
					Post Tractor Service
				</h3>
				<button
					onClick={handleClose}
					className="text-gray-400 hover:text-gray-700 transition"
				>
					<X className="w-6 h-6" />
				</button>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="flex space-x-4">
					<input
						name="driverName"
						placeholder="Driver Name"
						value={formData.driverName}
						onChange={handleChange}
						className="w-1/2 p-2 border rounded-lg focus:ring-green-500"
						required
					/>
					<input
						name="age"
						type="number"
						placeholder="Age"
						value={formData.age}
						onChange={handleChange}
						className="w-1/2 p-2 border rounded-lg focus:ring-green-500"
						min="16"
						required
					/>
				</div>

				<div className="flex space-x-4">
					<select
						name="gender"
						value={formData.gender}
						onChange={handleChange}
						className="w-1/2 p-2 border rounded-lg focus:ring-green-500"
						required
					>
						<option value="">Select Gender</option>
						<option value="male">Male</option>
						<option value="female">Female</option>
						<option value="other">Other</option>
					</select>
					<input
						name="experience"
						type="number"
						placeholder="Driving Exp (years)"
						value={formData.experience}
						onChange={handleChange}
						className="w-1/2 p-2 border rounded-lg focus:ring-green-500"
						min="0"
					/>
				</div>

				<div className="flex space-x-4">
					<input
						name="vehicleNumber"
						placeholder="Vehicle Plate/ID"
						value={formData.vehicleNumber}
						onChange={handleChange}
						className="w-1/2 p-2 border rounded-lg focus:ring-green-500"
						required
					/>
					<input
						name="model"
						placeholder="Tractor Model"
						value={formData.model}
						onChange={handleChange}
						className="w-1/2 p-2 border rounded-lg focus:ring-green-500"
						required
					/>
				</div>

				<div className="flex space-x-4">
					<input
						name="chargePerAcre"
						type="number"
						placeholder="Charge / Acre (₹)"
						value={formData.chargePerAcre}
						onChange={handleChange}
						className="w-1/2 p-2 border rounded-lg focus:ring-green-500"
						min="1"
						required
					/>
					<input
						name="typeOfPlowing"
						placeholder="Service Type"
						value={formData.typeOfPlowing}
						onChange={handleChange}
						className="w-1/2 p-2 border rounded-lg focus:ring-green-500"
						required
					/>
				</div>

				<button
					type="submit"
					className="w-full bg-green-600 text-white p-3 rounded-xl font-semibold hover:bg-green-700 transition shadow-md mt-6"
				>
					Submit Service Post
				</button>
			</form>
		</div>
	</div>
);

function TractorDashboard() {
	const navigate = useNavigate();
	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState({
		driverName: "Ramesh Kumar",
		age: "42",
		gender: "male",
		vehicleNumber: "",
		experience: "15",
		model: "",
		chargePerAcre: "3000",
		typeOfPlowing: "",
	});
	const [posts, setPosts] = useState([]);

	const handleChange = (e) =>
		setFormData({ ...formData, [e.target.name]: e.target.value });

	const handleSubmit = (e) => {
		e.preventDefault();
		const newPost = {
			...formData,
			id: Date.now(),
			datePosted: new Date().toLocaleDateString(),
		};
		setPosts([newPost, ...posts]);
		setFormData((prev) => ({
			...prev,
			vehicleNumber: "",
			model: "",
			typeOfPlowing: "",
		}));
		setShowForm(false);
	};

	return (
		<div className="min-h-screen bg-gray-50">
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
							Tractor Service Dashboard
						</h1>
					</div>
					<button
						onClick={() => setShowForm(true)}
						className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition shadow-md"
					>
						<Plus className="w-5 h-5" />
						<span>Post New Service</span>
					</button>
				</div>
			</header>

			<main className="max-w-7xl mx-auto p-4 md:p-8 space-y-10">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
					<StatCard
						icon={Calendar}
						title="Confirmed Bookings"
						value={mockBookings.filter((b) => b.status === "Confirmed").length}
						color="border-green-500"
					/>
					<StatCard
						icon={Gauge}
						title="Overall Rating"
						value={4.8}
						unit="/ 5.0"
						color="border-yellow-500"
					/>
					<StatCard
						icon={DollarSign}
						title="Current Rate"
						value={formData.chargePerAcre}
						unit="₹/Acre"
						color="border-blue-500"
					/>
					<StatCard
						icon={Tractor}
						title="Experience"
						value={formData.experience}
						unit="Years"
						color="border-red-500"
					/>
				</div>

				<section className="bg-white p-6 rounded-xl shadow-lg">
					<h3 className="text-xl font-bold mb-4 text-gray-700 flex items-center">
						<Tractor className="w-5 h-5 mr-2" /> Your Active Service Posts
					</h3>
					{posts.length === 0 ? (
						<p className="text-gray-500 p-4 border rounded-lg bg-gray-50">
							You currently have no active service posts. Click "Post New
							Service" to list your availability.
						</p>
					) : (
						<div className="space-y-4">
							{posts.map((post) => (
								<div
									key={post.id}
									className="p-4 border border-green-200 rounded-lg bg-green-50 flex justify-between items-center"
								>
									<div>
										<p className="font-semibold text-green-700">
											{post.typeOfPlowing} Plowing - {post.model}
										</p>
										<p className="text-sm text-gray-600">
											Plate: {post.vehicleNumber} | ₹{post.chargePerAcre} / acre
										</p>
									</div>
									<button className="text-red-500 hover:text-red-700 text-sm font-medium">
										Remove Post
									</button>
								</div>
							))}
						</div>
					)}
				</section>

				{/* Rest of the sections remain the same... */}
			</main>

			{showForm && (
				<TractorForm
					formData={formData}
					handleChange={handleChange}
					handleSubmit={handleSubmit}
					handleClose={() => setShowForm(false)}
				/>
			)}
		</div>
	);
}

export default TractorDashboard;
