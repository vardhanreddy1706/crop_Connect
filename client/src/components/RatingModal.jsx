import React, { useState } from 'react';
import { X, Star, Send } from 'lucide-react';
import RatingStars from './RatingStars';
import api from '../config/api';
import toast from 'react-hot-toast';

export default function RatingModal({ 
	isOpen, 
	onClose, 
	rateeId, 
	rateeName, 
	rateeRole,
	ratingType,
	relatedOrder,
	relatedBooking,
	relatedHireRequest,
	onRatingSubmitted 
}) {
	const [rating, setRating] = useState(0);
	const [review, setReview] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (rating === 0) {
			toast.error('Please select a rating');
			return;
		}

		setSubmitting(true);
		try {
			// Build payload with only defined transaction references
			const payload = {
				rateeId,
				rating,
				review,
				ratingType,
			};

			// Only include transaction reference fields if they have values
			if (relatedOrder) payload.relatedOrder = relatedOrder;
			if (relatedBooking) payload.relatedBooking = relatedBooking;
			if (relatedHireRequest) payload.relatedHireRequest = relatedHireRequest;

			const response = await api.post('/ratings', payload);

			if (response.data.success) {
				toast.success('⭐ Rating submitted successfully!');
				onRatingSubmitted && onRatingSubmitted(response.data.data);
				onClose();
			}
		} catch (error) {
			console.error('Submit rating error:', error);
			toast.error(error.response?.data?.message || 'Failed to submit rating');
		} finally {
			setSubmitting(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b">
					<h2 className="text-2xl font-bold text-gray-900">Rate Your Experience</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				{/* Content */}
				<form onSubmit={handleSubmit} className="p-6 space-y-6">
					{/* User Info */}
					<div className="text-center">
						<p className="text-gray-600">
							How was your experience with
						</p>
						<p className="text-xl font-bold text-gray-900 mt-1">{rateeName}</p>
						<p className="text-sm text-gray-500 capitalize">({rateeRole?.replace('_', ' ')})</p>
					</div>

					{/* Stars */}
					<div className="flex flex-col items-center space-y-3">
						<RatingStars rating={rating} onRate={setRating} size="lg" />
						<p className="text-sm text-gray-600">
							{rating === 0 && 'Click to rate'}
							{rating === 1 && '😞 Poor'}
							{rating === 2 && '😕 Fair'}
							{rating === 3 && '😐 Good'}
							{rating === 4 && '😊 Very Good'}
							{rating === 5 && '🤩 Excellent'}
						</p>
					</div>

					{/* Review */}
					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2">
							Write a review (optional)
						</label>
						<textarea
							value={review}
							onChange={(e) => setReview(e.target.value)}
							placeholder="Share your experience..."
							maxLength={500}
							rows={4}
							className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition resize-none"
						/>
						<p className="text-xs text-gray-500 mt-1">
							{review.length}/500 characters
						</p>
					</div>

					{/* Actions */}
					<div className="flex gap-3">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={submitting || rating === 0}
							className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
						>
							{submitting ? (
								<>
									<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									Submitting...
								</>
							) : (
								<>
									<Send className="w-5 h-5" />
									Submit Rating
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}