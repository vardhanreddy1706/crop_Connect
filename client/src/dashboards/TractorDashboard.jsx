/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../config/api";
import {
	Tractor,
	Plus,
	X,
	ArrowLeft,
	Calendar,
	Gauge,
	DollarSign,
} from "lucide-react";

const StatCard = ({ icon: Icon, title, value, unit, color }) => (
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
				{/* ...same as before... */}
			</form>
		</div>
	</div>
);

function TractorDashboard() {
	const navigate = useNavigate();
	const { user, logout } = useAuth();
	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState({
		driverName: user?.name || "",
		age: user?.age || "",
		gender: user?.gender || "",
		vehicleNumber: "",
		experience: user?.drivingExperience || "",
		model: "",
		chargePerAcre: "",
		typeOfPlowing: "",
	});
	const [posts, setPosts] = useState([]); // Tractor owner's posts
	const [farmerRequests, setFarmerRequests] = useState([]); // Farmer job requests
	const [message, setMessage] = useState(null);

	// Fetch tractor posts and farmer requests from backend
	useEffect(() => {
		async function fetchData() {
			try {
				const postsRes = await api.get("/tractor/posts");
				setPosts(postsRes.data.posts);
				const requestsRes = await api.get("/farmer/tractor-requests");
				setFarmerRequests(requestsRes.data.requests);
			} catch (err) {
				setMessage("Failed to load data");
			}
		}
		fetchData();
	}, []);

	// Logout logic: sessionStorage, redirect, block back
	const handleLogout = () => {
		logout();
		navigate("/", { replace: true });
	};

	// Post new tractor service
	const handleChange = (e) =>
		setFormData({ ...formData, [e.target.name]: e.target.value });
	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const res = await api.post("/tractor/posts", formData);
			setPosts([res.data.post, ...posts]);
			setShowForm(false);
			setMessage("Service posted!");
		} catch (err) {
			setMessage("Failed to post service");
		}
	};

	// Accept/Reject farmer requests
	const handleAccept = async (requestId) => {
		try {
			await api.post(`/farmer/tractor-requests/${requestId}/accept`);
			setFarmerRequests(farmerRequests.filter((r) => r.id !== requestId));
			setMessage("Request accepted!");
		} catch (err) {
			setMessage("Failed to accept request");
		}
	};
	const handleReject = async (requestId) => {
		try {
			await api.post(`/farmer/tractor-requests/${requestId}/reject`);
			setFarmerRequests(farmerRequests.filter((r) => r.id !== requestId));
			setMessage("Request rejected!");
		} catch (err) {
			setMessage("Failed to reject request");
		}
	};

	// Toggle post active/inactive
	const handleToggleActive = async (postId, active) => {
		try {
			await api.patch(`/tractor/posts/${postId}`, { active: !active });
			setPosts(
				posts.map((p) => (p.id === postId ? { ...p, active: !active } : p))
			);
		} catch (err) {
			setMessage("Failed to update post");
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white shadow-md p-4 md:p-6 sticky top-0 z-10">
				<div className="max-w-7xl mx-auto flex justify-between items-center">
					<div className="flex items-center gap-4">
						<button
							onClick={() => navigate("/tractor-dashboard", { replace: true })}
							className="text-gray-600 hover:text-gray-800"
						>
							<ArrowLeft className="w-6 h-6" />
						</button>
						<h1 className="text-3xl font-extrabold text-gray-900">
							Tractor Service Dashboard
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
						title="Active Posts"
						value={posts.filter((p) => p.active).length}
						color="border-green-500"
					/>
					<StatCard
						icon={Gauge}
						title="Overall Rating"
						value={user?.rating || 4.8}
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
				{/* Farmer Requests Section */}
				<section className="bg-white p-6 rounded-xl shadow-lg">
					<h3 className="text-xl font-bold mb-4 text-gray-700 flex items-center">
						<Tractor className="w-5 h-5 mr-2" /> Farmer Tractor Requests
					</h3>
					{farmerRequests.length === 0 ? (
						<p className="text-gray-500 p-4 border rounded-lg bg-gray-50">
							No new requests from farmers.
						</p>
					) : (
						<div className="space-y-4">
							{farmerRequests.map((req) => (
								<div
									key={req.id}
									className="p-4 border border-blue-200 rounded-lg bg-blue-50 flex justify-between items-center"
								>
									<div>
										<p className="font-semibold text-blue-700">
											{req.workType} - {req.acres} acres
										</p>
										<p className="text-sm text-gray-600">
											Farmer: {req.farmerName} | Contact: {req.farmerPhone}
										</p>
									</div>
									<div className="flex gap-2">
										<button
											onClick={() => handleAccept(req.id)}
											className="bg-green-600 text-white px-3 py-1 rounded-lg font-semibold hover:bg-green-700"
										>
											Accept
										</button>
										<button
											onClick={() => handleReject(req.id)}
											className="bg-red-600 text-white px-3 py-1 rounded-lg font-semibold hover:bg-red-700"
										>
											Reject
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</section>
				{/* Tractor Owner's Posts Section */}
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
									<div className="flex gap-2">
										<button
											onClick={() => handleToggleActive(post.id, post.active)}
											className={`px-3 py-1 rounded-lg font-semibold ${
												post.active
													? "bg-yellow-600 text-white"
													: "bg-gray-300 text-gray-700"
											}`}
										>
											{post.active ? "Set Inactive" : "Set Active"}
										</button>
										<button className="text-red-500 hover:text-red-700 text-sm font-medium">
											Remove Post
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</section>
				{message && (
					<div className="mt-4 text-center text-red-600 font-semibold">
						{message}
					</div>
				)}
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
