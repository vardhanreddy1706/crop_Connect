import React, { useState, useEffect } from 'react';
import { Star, User as UserIcon, TrendingUp, Award, Package, MapPin, Calendar, Briefcase, IndianRupee } from 'lucide-react';
import RatingStars from './RatingStars';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function RatingsReceivedTab() {
	const { user } = useAuth();
	const [ratingsReceived, setRatingsReceived] = useState([]);
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (user?._id) {
			fetchRatingsReceived();
		}
	}, [user]);

	const fetchRatingsReceived = async () => {
		try {
			console.log('🔍 Fetching ratings for user:', user._id);
			console.log('🌐 API URL:', `/ratings/user/${user._id}`);
			
			const response = await api.get(`/ratings/user/${user._id}`, {
				params: { limit: 50 }
			});
			
			console.log('📊 Full API Response:', response);
			console.log('📊 Response Data:', response.data);
			
			if (response.data.success) {
				console.log('✅ Ratings received count:', response.data.data.ratings.length);
				console.log('📝 Actual ratings array:', response.data.data.ratings);
				console.log('📈 Stats:', response.data.data.stats);
				
				// Debug transaction details
				response.data.data.ratings.forEach((r, idx) => {
					console.log(`Rating ${idx + 1}:`);
					console.log('  - relatedOrder:', r.relatedOrder);
					console.log('  - relatedBooking:', r.relatedBooking);
					console.log('  - relatedHireRequest:', r.relatedHireRequest);
				});
				
				if (response.data.data.ratings.length === 0) {
					console.warn('⚠️ No ratings found for user:', user._id);
				}
				
				setRatingsReceived(response.data.data.ratings);
				setStats(response.data.data.stats);
			} else {
				console.error('❌ API returned success: false');
			}
		} catch (error) {
			console.error('❌ Fetch ratings received error:', error);
			console.error('❌ Error response:', error.response);
			console.error('❌ Error message:', error.message);
			toast.error('Failed to load ratings');
		} finally {
			setLoading(false);
		}
	};

	const getRatingTypeLabel = (type) => {
		const labels = {
			farmer_to_worker: 'Farmer',
			farmer_to_tractor_owner: 'Farmer',
			farmer_to_buyer: 'Farmer',
			worker_to_farmer: 'Worker',
			tractor_owner_to_farmer: 'Tractor Owner',
			buyer_to_farmer: 'Buyer',
		};
		return labels[type] || 'User';
	};

	const renderTransactionDetails = (rating) => {
		// Render Order Details
		if (rating.relatedOrder) {
			const order = rating.relatedOrder;
			return (
				<div className="mt-3 bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
					<div className="flex items-center gap-2 mb-2">
						<Package className="w-4 h-4 text-blue-600" />
						<span className="font-semibold text-blue-900 text-sm">Order Details</span>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-800">
						<div className="flex items-center gap-1">
							<Calendar className="w-3 h-3" />
							<span>Order Date: {new Date(order.createdAt).toLocaleDateString()}</span>
						</div>
						<div className="flex items-center gap-1">
							<IndianRupee className="w-3 h-3" />
							<span>Total: ₹{order.totalAmount?.toLocaleString()}</span>
						</div>
						{order.items && order.items.length > 0 && (
							<div className="col-span-2">
								<span className="font-medium">Items: </span>
								{order.items.map((item, idx) => (
									<span key={idx}>
										{item.crop?.name || 'Crop'}
										{idx < order.items.length - 1 ? ', ' : ''}
									</span>
								))}
							</div>
						)}
					</div>
				</div>
			);
		}

		// Render Booking Details
		if (rating.relatedBooking) {
			const booking = rating.relatedBooking;
			const isTractor = booking.serviceType === 'tractor';
			return (
				<div className="mt-3 bg-green-50 border-l-4 border-green-500 p-3 rounded-r-lg">
					<div className="flex items-center gap-2 mb-2">
						<Briefcase className="w-4 h-4 text-green-600" />
						<span className="font-semibold text-green-900 text-sm">
							{isTractor ? 'Tractor Booking' : 'Worker Booking'}
						</span>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-green-800">
						<div className="flex items-center gap-1">
							<Calendar className="w-3 h-3" />
							<span>Date: {new Date(booking.bookingDate).toLocaleDateString()}</span>
						</div>
						{isTractor ? (
							<div className="flex items-center gap-1">
								<span>Tractor: {booking.tractorType}</span>
							</div>
						) : (
							<div className="flex items-center gap-1">
								<span>Worker Type: {booking.workerType}</span>
							</div>
						)}
						{booking.location && (
							<div className="flex items-center gap-1 col-span-2">
								<MapPin className="w-3 h-3" />
								<span>
									{booking.location.district}, {booking.location.state}
								</span>
							</div>
						)}
						<div className="flex items-center gap-1">
							<span>
								{isTractor 
									? `Duration: ${booking.duration || 8} hours`
									: `Working Hours: ${booking.workingHours || 8} hrs/day`
								}
							</span>
						</div>
						{booking.totalCost && (
							<div className="flex items-center gap-1">
								<IndianRupee className="w-3 h-3" />
								<span>Total: ₹{booking.totalCost.toLocaleString()}</span>
							</div>
						)}
					</div>
				</div>
			);
		}

		// Render Hire Request Details
		if (rating.relatedHireRequest) {
			const hire = rating.relatedHireRequest;
			return (
				<div className="mt-3 bg-purple-50 border-l-4 border-purple-500 p-3 rounded-r-lg">
					<div className="flex items-center gap-2 mb-2">
						<Briefcase className="w-4 h-4 text-purple-600" />
						<span className="font-semibold text-purple-900 text-sm">Worker Hire Request</span>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-purple-800">
						<div className="flex items-center gap-1">
							<span>Work Type: {hire.workType}</span>
						</div>
						<div className="flex items-center gap-1">
							<Calendar className="w-3 h-3" />
							<span>Start: {new Date(hire.startDate).toLocaleDateString()}</span>
						</div>
						<div className="flex items-center gap-1">
							<span>Duration: {hire.duration} days</span>
						</div>
						{hire.offeredWage && (
							<div className="flex items-center gap-1">
								<IndianRupee className="w-3 h-3" />
								<span>Wage: ₹{hire.offeredWage.toLocaleString()}/day</span>
							</div>
						)}
					</div>
				</div>
			);
		}

		return null;
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<h2 className="text-2xl font-bold text-gray-900">Ratings Received</h2>
				<div className="bg-white rounded-xl shadow-md p-6">
					<div className="animate-pulse space-y-4">
						{[1, 2, 3].map(i => (
							<div key={i} className="space-y-3">
								<div className="h-6 bg-gray-200 rounded w-1/3"></div>
								<div className="h-4 bg-gray-200 rounded"></div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (!stats || stats.totalRatings === 0) {
		return (
			<div className="space-y-6">
				<h2 className="text-2xl font-bold text-gray-900">Ratings Received</h2>
				<div className="bg-white rounded-xl shadow-md p-12 text-center">
					<Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 mb-2">No Ratings Yet</h3>
					<p className="text-gray-600">Complete some work to receive ratings from customers</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header with Overall Stats */}
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold text-gray-900">Ratings Received</h2>
				<div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-6 py-3 rounded-xl shadow-lg">
					<Award className="w-6 h-6" />
					<div>
						<div className="text-2xl font-bold">{stats.averageRating} ⭐</div>
						<div className="text-xs opacity-90">{stats.totalRatings} reviews</div>
					</div>
				</div>
			</div>

			{/* Rating Distribution */}
			<div className="bg-white rounded-xl shadow-md p-6">
				<h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
					<TrendingUp className="w-5 h-5 text-green-600" />
					Rating Distribution
				</h3>
				<div className="space-y-3">
					{[5, 4, 3, 2, 1].map(star => {
						const count = stats.distribution[star] || 0;
						const percentage = stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;
						return (
							<div key={star} className="flex items-center gap-3">
								<span className="text-sm font-medium text-gray-700 w-16">{star} ⭐</span>
								<div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
									<div
										className={`h-full transition-all duration-500 ${
											star === 5 ? 'bg-green-500' :
											star === 4 ? 'bg-lime-500' :
											star === 3 ? 'bg-yellow-500' :
											star === 2 ? 'bg-orange-500' : 'bg-red-500'
										}`}
										style={{ width: `${percentage}%` }}
									></div>
								</div>
								<span className="text-sm text-gray-600 w-16 text-right">
									{count} ({Math.round(percentage)}%)
								</span>
							</div>
						);
					})}
				</div>
			</div>

			{/* Reviews List */}
			<div className="bg-white rounded-xl shadow-md p-6">
				<h3 className="text-lg font-bold text-gray-900 mb-4">Recent Reviews</h3>
				<div className="space-y-4">
					{ratingsReceived.map((rating) => (
						<div key={rating._id} className="border-b border-gray-200 pb-4 last:border-0 hover:bg-gray-50 p-4 rounded-lg transition">
							<div className="flex items-start gap-4">
								{/* Profile */}
								<div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
									{rating.rater?.profileImage ? (
										<img 
											src={rating.rater.profileImage} 
											alt="" 
											className="w-12 h-12 rounded-full object-cover" 
										/>
									) : (
										<UserIcon className="w-6 h-6 text-green-600" />
									)}
								</div>

								{/* Content */}
								<div className="flex-1">
									<div className="flex items-center justify-between mb-2">
										<div>
											<h4 className="font-bold text-gray-900">{rating.rater?.name}</h4>
											<p className="text-xs text-gray-500">
												{getRatingTypeLabel(rating.ratingType)}
											</p>
										</div>
										<span className="text-xs text-gray-500">
											{new Date(rating.createdAt).toLocaleDateString('en-US', {
												year: 'numeric',
												month: 'short',
												day: 'numeric'
											})}
										</span>
									</div>

									<RatingStars rating={rating.rating} readonly size="md" />
									
									{rating.review && (
										<p className="text-gray-700 mt-3 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">
											"{rating.review}"
										</p>
									)}

									{/* Transaction Details */}
									{renderTransactionDetails(rating)}

									<div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
										{rating.isEdited && (
											<span className="italic">Edited</span>
										)}
										{rating.isVerifiedTransaction && (
											<span className="text-green-600 font-semibold flex items-center gap-1">
												<span className="inline-block w-4 h-4 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</span>
												Verified Purchase
											</span>
										)}
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}