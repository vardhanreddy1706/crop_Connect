import React, { useState, useEffect } from 'react';
import { Star, User as UserIcon, Trash2, Package, Briefcase, ShoppingBag } from 'lucide-react';
import RatingStars from './RatingStars';
import api from '../config/api';
import toast from 'react-hot-toast';

export default function MyRatingsTab() {
	const [myRatings, setMyRatings] = useState([]);
	const [loading, setLoading] = useState(true);
	const [deleting, setDeleting] = useState(null);

	useEffect(() => {
		fetchMyRatings();
	}, []);

	const fetchMyRatings = async () => {
		try {
			const response = await api.get('/ratings/my-ratings', {
				params: { limit: 50 }
			});
			if (response.data.success) {
				setMyRatings(response.data.data.ratings);
			}
		} catch (error) {
			console.error('Fetch my ratings error:', error);
			toast.error('Failed to load your ratings');
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (ratingId) => {
		if (!window.confirm('Are you sure you want to delete this rating?')) return;
		
		setDeleting(ratingId);
		try {
			const response = await api.delete(`/ratings/${ratingId}`);
			if (response.data.success) {
				toast.success('Rating deleted successfully');
				setMyRatings(myRatings.filter(r => r._id !== ratingId));
			}
		} catch (error) {
			console.error('Delete rating error:', error);
			toast.error(error.response?.data?.message || 'Failed to delete rating');
		} finally {
			setDeleting(null);
		}
	};

	const getTransactionIcon = (rating) => {
		if (rating.relatedOrder) return <ShoppingBag className="w-5 h-5 text-blue-600" />;
		if (rating.relatedBooking) return <Briefcase className="w-5 h-5 text-green-600" />;
		if (rating.relatedHireRequest) return <Package className="w-5 h-5 text-purple-600" />;
		return null;
	};

	const getRatingTypeLabel = (type) => {
		const labels = {
			farmer_to_worker: 'Worker',
			farmer_to_tractor_owner: 'Tractor Owner',
			farmer_to_buyer: 'Buyer',
			worker_to_farmer: 'Farmer',
			tractor_owner_to_farmer: 'Farmer',
			buyer_to_farmer: 'Farmer',
		};
		return labels[type] || type;
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<h2 className="text-2xl font-bold text-gray-900">My Ratings</h2>
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

	if (myRatings.length === 0) {
		return (
			<div className="space-y-6">
				<h2 className="text-2xl font-bold text-gray-900">My Ratings</h2>
				<div className="bg-white rounded-xl shadow-md p-12 text-center">
					<Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 mb-2">No Ratings Given Yet</h3>
					<p className="text-gray-600">Ratings you give to others will appear here</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold text-gray-900">My Ratings</h2>
				<div className="text-sm text-gray-600">
					{myRatings.length} rating{myRatings.length !== 1 ? 's' : ''} given
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4">
				{myRatings.map((rating) => (
					<div key={rating._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
						<div className="flex items-start justify-between gap-4">
							<div className="flex items-start gap-4 flex-1">
								{/* Profile */}
								<div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
									{rating.ratee?.profileImage ? (
										<img 
											src={rating.ratee.profileImage} 
											alt="" 
											className="w-12 h-12 rounded-full object-cover" 
										/>
									) : (
										<UserIcon className="w-6 h-6 text-green-600" />
									)}
								</div>

								{/* Content */}
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-2">
										<h3 className="font-bold text-gray-900">{rating.ratee?.name}</h3>
										<span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
											{getRatingTypeLabel(rating.ratingType)}
										</span>
										{getTransactionIcon(rating)}
									</div>

									<RatingStars rating={rating.rating} readonly size="md" />
									
									{rating.review && (
										<p className="text-gray-700 mt-3 text-sm leading-relaxed">
											{rating.review}
										</p>
									)}

									<div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
										<span>
											{new Date(rating.createdAt).toLocaleDateString('en-US', {
												year: 'numeric',
												month: 'short',
												day: 'numeric'
											})}
										</span>
										{rating.isEdited && (
											<span className="italic">• Edited</span>
										)}
										{rating.isVerifiedTransaction && (
											<span className="text-green-600 font-semibold">• ✓ Verified</span>
										)}
									</div>
								</div>
							</div>

							{/* Actions */}
							<button
								onClick={() => handleDelete(rating._id)}
								disabled={deleting === rating._id}
								className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
								title="Delete rating"
							>
								{deleting === rating._id ? (
									<div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
								) : (
									<Trash2 className="w-5 h-5" />
								)}
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}