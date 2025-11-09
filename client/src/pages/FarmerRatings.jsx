import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import api from "../config/api";
import MyRatingsTab from "../components/MyRatingsTab";
import RatingsReceivedTab from "../components/RatingsReceived";
import { Star, ArrowLeft, Loader } from "lucide-react";

function FarmerRatings() {
	const { user } = useAuth();
	const { tr } = useLanguage();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState("reviews-received");
	const [ratingStats, setRatingStats] = useState({
		averageRating: 0,
		totalRatings: 0,
		distribution: {},
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (user) {
			fetchRatingStats();
		}
	}, [user]);

	const fetchRatingStats = async () => {
		try {
			const response = await api.get(`/ratings/user/${user._id}`);
			if (response.data.success) {
				setRatingStats(response.data.data.stats);
			}
		} catch (error) {
			console.error("Fetch rating stats error:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-7xl mx-auto px-4">
				{/* Header */}
				<div className="mb-8 flex items-center gap-3">
					<button
						onClick={() => navigate("/farmer-dashboard")}
						className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
					>
						<ArrowLeft className="w-6 h-6" />
					</button>
					<div>
						<h1 className="text-3xl font-bold text-gray-900">
							{tr("My Ratings & Reviews")}
						</h1>
						<p className="text-gray-600 mt-1">
							{tr("View and manage your ratings")}
						</p>
					</div>
				</div>

				{/* Stats Card */}
				{!loading && (
					<div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl shadow-lg p-6 mb-6 text-white">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-2xl font-bold mb-2">
									{tr("Your Overall Rating")}
								</h2>
								<div className="flex items-center gap-3">
									<div className="flex items-center gap-2">
										<span className="text-5xl font-bold">
											{ratingStats.averageRating > 0
												? ratingStats.averageRating.toFixed(1)
												: "0.0"}
										</span>
										<Star className="w-12 h-12 fill-white" />
									</div>
								</div>
								<p className="mt-2 text-yellow-100">
									{tr("Based on")} {ratingStats.totalRatings}{" "}
									{ratingStats.totalRatings === 1
										? tr("review")
										: tr("reviews")}
								</p>
							</div>
							<div className="hidden md:flex items-center justify-center">
								<div className="flex gap-2">
									{[5, 4, 3, 2, 1].map((rating) => (
										<Star
											key={rating}
											className="w-8 h-8 fill-white opacity-80"
										/>
									))}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Tabs */}
				<div className="bg-white rounded-xl shadow-sm mb-6">
					<div className="flex border-b">
						<button
							onClick={() => setActiveTab("reviews-received")}
							className={`flex-1 px-6 py-4 font-semibold transition-all ${
								activeTab === "reviews-received"
									? "text-green-600 border-b-2 border-green-600 bg-green-50"
									: "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
							}`}
						>
							<div className="flex items-center justify-center gap-2">
								<Star className="w-5 h-5" />
								{tr("Reviews Received")}
							</div>
						</button>
						<button
							onClick={() => setActiveTab("my-ratings")}
							className={`flex-1 px-6 py-4 font-semibold transition-all ${
								activeTab === "my-ratings"
									? "text-green-600 border-b-2 border-green-600 bg-green-50"
									: "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
							}`}
						>
							<div className="flex items-center justify-center gap-2">
								<Star className="w-5 h-5" />
								{tr("My Ratings")}
							</div>
						</button>
					</div>
				</div>

				{/* Tab Content */}
				{loading ? (
					<div className="flex items-center justify-center py-12">
						<Loader className="w-12 h-12 animate-spin text-green-600" />
					</div>
				) : (
					<>
						{activeTab === "reviews-received" && <RatingsReceivedTab />}
						{activeTab === "my-ratings" && <MyRatingsTab />}
					</>
				)}
			</div>
		</div>
	);
}

export default FarmerRatings;
