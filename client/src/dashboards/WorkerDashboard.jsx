// src/pages/dashboards/WorkerDashboard.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

import { useNavigate } from "react-router-dom";
import {
	User,
	DollarSign,
	Clock,
	Hammer,
	Calendar,
	Star,
	Phone,
	Gauge,
	X,
	Plus,
	ArrowLeft,
} from "lucide-react";

// Mock Data
const mockBookings = [
	{
		id: 1,
		farmer: "Green Acres Farm",
		date: "Oct 25, 2025",
		status: "Confirmed",
		type: "Harvesting",
	},
	{
		id: 2,
		farmer: "Riverbend Orchards",
		date: "Oct 28, 2025",
		status: "Pending",
		type: "Pruning",
	},
];

const mockRatings = [
	{
		id: 1,
		farmer: "Sun Valley Crops",
		rating: 5,
		comment: "Excellent work ethic, very fast and efficient.",
	},
	{
		id: 2,
		farmer: "Hillside Dairy",
		rating: 4,
		comment: "Arrived on time. Minor delay in finishing the task.",
	},
];

const StatCard = ({  title, value, unit, color }) => (
	<div
		className={`p-4 bg-white border-l-4 ${color} shadow-lg rounded-lg transition hover:shadow-xl`}
	>
		<div className="flex items-center justify-between">
			<div className="text-sm font-medium text-gray-500">{title}</div>
			
		</div>
		<p className="mt-1 text-3xl font-bold text-gray-900">
			{value}
			{unit && (
				<span className="ml-1 text-base font-normal text-gray-500">{unit}</span>
			)}
		</p>
	</div>
);

const WorkerForm = ({ formData, handleChange, handleSubmit, handleClose }) => (
	<div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
		<div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300">
			<div className="flex justify-between items-center mb-6 border-b pb-3">
				<h3 className="text-2xl font-semibold text-indigo-700">
					Post Your Availability
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
						name="name"
						placeholder="Name"
						value={formData.name}
						onChange={handleChange}
						className="w-1/2 p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
						required
					/>
					<input
						name="age"
						type="number"
						placeholder="Age"
						value={formData.age}
						onChange={handleChange}
						className="w-1/2 p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
						min="16"
						required
					/>
				</div>

				<div className="flex space-x-4">
					<select
						name="gender"
						value={formData.gender}
						onChange={handleChange}
						className="w-1/2 p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
						required
					>
						<option value="">Select Gender</option>
						<option value="male">Male</option>
						<option value="female">Female</option>
						<option value="other">Other</option>
					</select>
					<input
						name="phone"
						placeholder="Phone Number"
						value={formData.phone}
						onChange={handleChange}
						className="w-1/2 p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
						type="tel"
						required
					/>
				</div>

				<div className="flex space-x-4">
					<input
						name="workerType"
						placeholder="Job Title (e.g., Tractor Operator)"
						value={formData.workerType}
						onChange={handleChange}
						className="w-2/3 p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
						required
					/>
					<input
						name="experience"
						type="number"
						placeholder="Exp (years)"
						value={formData.experience}
						onChange={handleChange}
						className="w-1/3 p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
						min="0"
					/>
				</div>

				<div className="flex space-x-4">
					<input
						name="hours"
						type="number"
						placeholder="Hours/Day"
						value={formData.hours}
						onChange={handleChange}
						className="w-1/2 p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
						min="1"
					/>
					<input
						name="chargePerDay"
						type="number"
						placeholder="Charge Per Day (₹)"
						value={formData.chargePerDay}
						onChange={handleChange}
						className="w-1/2 p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
						min="10"
					/>
				</div>

				<button
					type="submit"
					className="w-full bg-indigo-600 text-white p-3 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-md hover:shadow-lg mt-6"
				>
					Submit Work Post
				</button>
			</form>
		</div>
	</div>
);

function WorkerDashboard() {
	const navigate = useNavigate();
	const [showForm, setShowForm] = useState(false);
	const { user, logout } = useAuth();
	const [formData, setFormData] = useState({
		name: "John Doe",
		age: "35",
		gender: "male",
		phone: "555-1234",
		experience: "10",
		workerType: "General Farm Hand",
		hours: "8",
		chargePerDay: "120",
	});
	const [posts, setPosts] = useState([]);

	// Logout logic: sessionStorage, redirect, block back
	const handleLogout = () => {
		logout();
		navigate("/", { replace: true });
	};

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
		setFormData({
			name: newPost.name,
			age: newPost.age,
			gender: newPost.gender,
			phone: newPost.phone,
			experience: newPost.experience,
			workerType: "",
			hours: "",
			chargePerDay: "",
		});
		setShowForm(false);
	};

	return (
		<div className="min-h-screen bg-gray-50 font-sans">
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
							Worker Dashboard
						</h1>
					</div>
					{user && (
						<button
							onClick={handleLogout}
							className="px-4 py-2 rounded-md text-white font-medium bg-red-600 hover:bg-red-700 transition-colors"
						>
							Logout
						</button>
					)}
					<button
						onClick={() => setShowForm(true)}
						className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-600 transition shadow-md active:scale-95"
					>
						<Plus className="w-5 h-5" />
						<span>Post New Work</span>
					</button>
				</div>
			</header>

			<main className="max-w-7xl mx-auto p-4 md:p-8 space-y-10">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
					<StatCard
						icon={Calendar}
						title="Confirmed Bookings"
						value={mockBookings.filter((b) => b.status === "Confirmed").length}
						color="border-indigo-500"
					/>
					<StatCard
						icon={Gauge}
						title="Overall Rating"
						value={4.5}
						unit="/ 5.0"
						color="border-yellow-500"
					/>
					<StatCard
						icon={DollarSign}
						title="Daily Rate"
						value={formData.chargePerDay || "120"}
						unit="₹"
						color="border-green-500"
					/>
					<StatCard
						icon={Clock}
						title="Experience"
						value={formData.experience}
						unit="Years"
						color="border-blue-500"
					/>
				</div>

				<section className="bg-white p-6 rounded-xl shadow-lg">
					<h3 className="text-xl font-bold mb-4 text-gray-700 flex items-center">
						<Hammer className="w-5 h-5 mr-2" /> Your Active Posts
					</h3>
					{posts.length === 0 ? (
						<p className="text-gray-500 p-4 border rounded-lg bg-gray-50">
							You currently have no active work posts. Click "Post New Work" to
							list your availability.
						</p>
					) : (
						<div className="space-y-4">
							{posts.map((post) => (
								<div
									key={post.id}
									className="p-4 border border-indigo-200 rounded-lg bg-indigo-50 flex justify-between items-center transition hover:shadow-md"
								>
									<div>
										<p className="font-semibold text-indigo-700">
											{post.workerType} - {post.datePosted}
										</p>
										<p className="text-sm text-gray-600">
											₹{post.chargePerDay} / day for {post.hours} hrs
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

				<section className="bg-white p-6 rounded-xl shadow-lg">
					<h3 className="text-xl font-bold mb-4 text-gray-700 flex items-center">
						<Calendar className="w-5 h-5 mr-2" /> Bookings from Farmers
					</h3>
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead>
								<tr className="bg-gray-50">
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Farmer
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Work Type
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Date
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Status
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{mockBookings.map((booking) => (
									<tr key={booking.id} className="hover:bg-gray-50 transition">
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
											{booking.farmer}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{booking.type}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{booking.date}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
													booking.status === "Confirmed"
														? "bg-green-100 text-green-800"
														: "bg-yellow-100 text-yellow-800"
												}`}
											>
												{booking.status}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<button className="text-indigo-600 hover:text-indigo-900 mr-3">
												View
											</button>
											{booking.status === "Pending" && (
												<button className="text-green-600 hover:text-green-900">
													Accept
												</button>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>

				<section className="bg-white p-6 rounded-xl shadow-lg">
					<h3 className="text-xl font-bold mb-4 text-gray-700 flex items-center">
						<Star className="w-5 h-5 mr-2" /> Ratings from Farmers
					</h3>
					<div className="space-y-4">
						{mockRatings.map((rating) => (
							<div key={rating.id} className="border p-4 rounded-lg bg-gray-50">
								<div className="flex items-center mb-1">
									<p className="font-semibold text-gray-800 mr-3">
										{rating.farmer}
									</p>
									<div className="flex">
										{[...Array(5)].map((_, i) => (
											<Star
												key={i}
												className={`w-4 h-4 ${
													i < rating.rating
														? "text-yellow-400 fill-yellow-400"
														: "text-gray-300"
												}`}
											/>
										))}
									</div>
								</div>
								<p className="text-gray-600 italic">"{rating.comment}"</p>
							</div>
						))}
					</div>
				</section>
			</main>

			{showForm && (
				<WorkerForm
					formData={formData}
					handleChange={handleChange}
					handleSubmit={handleSubmit}
					handleClose={() => setShowForm(false)}
				/>
			)}
		</div>
	);
}

export default WorkerDashboard;
