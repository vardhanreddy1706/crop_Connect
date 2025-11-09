import React, { useState, useEffect } from 'react';
import { Star, User as UserIcon } from 'lucide-react';
import RatingStars from './RatingStars';
import api from '../config/api';

export default function UserRatings({ userId, ratingType = null }) {
	const [ratings, setRatings] = useState([]);
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchRatings();
	}, [userId, ratingType]);

	const fetchRatings = async () => {
		try {
			const response = await api.get(`/ratings/user/${userId}`, {
				params: { ratingType, limit: 10 }
			});
			if (response.data.success) {
				setRatings(response.data.data.ratings);
				setStats(response.data.data.stats);
			}
		} catch (error) {
			console.error('Fetch ratings error:', error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="bg-white rounded-xl shadow-md p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-6 bg-gray-200 rounded w-1/3"></div>
					<div className="h-4 bg-gray-200 rounded"></div>
					<div className="h-4 bg-gray-200 rounded"></div>
				</div>
			</div>
		);
	}

	if (!stats || stats.totalRatings === 0) {
		return (
			<div className="bg-white rounded-xl shadow-md p-8 text-center">
				<Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
				<p className="text-gray-600">No ratings yet</p>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-xl shadow-md p-6">
			{/* Stats Summary */}
			<div className="mb-6">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-xl font-bold text-gray-900">Ratings & Reviews</h3>
					<div className="text-right">
						<div className="flex items-center gap-2">
							<span className="text-3xl font-bold text-green-600">{stats.averageRating}</span>
							<Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
						</div>
						<p className="text-sm text-gray-600">{stats.totalRatings} reviews</p>
					</div>
				</div>

				{/* Distribution */}
				<div className="space-y-2">
					{[5, 4, 3, 2, 1].map(star => {
						const count = stats.distribution[star] || 0;
						const percentage = stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;
						return (
							<div key={star} className="flex items-center gap-3">
								<span className="text-sm font-medium text-gray-700 w-12">{star} ⭐</span>
								<div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
									<div
										className="h-full bg-yellow-400 transition-all duration-300"
										style={{ width: `${percentage}%` }}
									></div>
								</div>
								<span className="text-sm text-gray-600 w-12 text-right">{count}</span>
							</div>
						);
					})}
				</div>
			</div>

			{/* Reviews List */}
			<div className="space-y-4">
				<h4 className="font-semibold text-gray-900">Recent Reviews</h4>
				{ratings.map((rating) => (
					<div key={rating._id} className="border-b border-gray-200 pb-4 last:border-0">
						<div className="flex items-start gap-3">
							<div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
								{rating.rater?.profileImage ? (
									<img src={rating.rater.profileImage} alt="" className="w-10 h-10 rounded-full object-cover" />
								) : (
									<UserIcon className="w-5 h-5 text-green-600" />
								)}
							</div>
							<div className="flex-1">
								<div className="flex items-center justify-between mb-1">
									<p className="font-semibold text-gray-900">{rating.rater?.name}</p>
									<span className="text-xs text-gray-500">
										{new Date(rating.createdAt).toLocaleDateString()}
									</span>
								</div>
								<RatingStars rating={rating.rating} readonly size="sm" />
								{rating.review && (
									<p className="text-gray-700 mt-2 text-sm">{rating.review}</p>
								)}
								{rating.isEdited && (
									<span className="text-xs text-gray-500 italic">Edited</span>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}