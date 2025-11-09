const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
	{
		rater: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'Rater is required'],
		},
		ratee: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'Ratee is required'],
		},
		ratingType: {
			type: String,
			enum: [
				'farmer_to_worker',
				'farmer_to_tractor_owner',
				'farmer_to_buyer',
				'worker_to_farmer',
				'tractor_owner_to_farmer',
				'buyer_to_farmer',
			],
			required: true,
		},
		rating: {
			type: Number,
			required: [true, 'Rating is required'],
			min: [1, 'Rating must be at least 1'],
			max: [5, 'Rating must be at most 5'],
		},
		review: {
			type: String,
			maxlength: [500, 'Review cannot exceed 500 characters'],
			trim: true,
		},
		// Reference to related transaction
		relatedOrder: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Order',
		},
		relatedBooking: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Booking',
		},
		relatedHireRequest: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'WorkerHireRequest',
		},
		// Helpful metrics
		isVerifiedTransaction: {
			type: Boolean,
			default: true,
		},
		isEdited: {
			type: Boolean,
			default: false,
		},
		editedAt: Date,
	},
	{ timestamps: true }
);

// Indexes for performance
ratingSchema.index({ rater: 1, ratee: 1 });
ratingSchema.index({ ratee: 1, ratingType: 1 });
ratingSchema.index({ relatedOrder: 1 });
ratingSchema.index({ relatedBooking: 1 });
ratingSchema.index({ relatedHireRequest: 1 });

// Compound index to prevent duplicate ratings for same transaction
ratingSchema.index(
	{ rater: 1, ratee: 1, relatedOrder: 1 },
	{ unique: true, sparse: true }
);
ratingSchema.index(
	{ rater: 1, ratee: 1, relatedBooking: 1 },
	{ unique: true, sparse: true }
);
ratingSchema.index(
	{ rater: 1, ratee: 1, relatedHireRequest: 1 },
	{ unique: true, sparse: true }
);

// Static method to calculate average rating for a user
ratingSchema.statics.getAverageRating = async function (userId, ratingType = null) {
	// Convert string to ObjectId if needed for proper MongoDB matching
	const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
	
	const query = { ratee: userObjectId };
	if (ratingType) query.ratingType = ratingType;

	console.log('📊 getAverageRating called with userId:', userId, 'Type:', typeof userId);
	console.log('📊 Converted to ObjectId:', userObjectId);
	console.log('📊 Query for aggregation:', query);

	const result = await this.aggregate([
		{ $match: query },
		{
			$group: {
				_id: null,
				averageRating: { $avg: '$rating' },
				totalRatings: { $sum: 1 },
				fiveStars: {
					$sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] },
				},
				fourStars: {
					$sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] },
				},
				threeStars: {
					$sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] },
				},
				twoStars: {
					$sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] },
				},
				oneStar: {
					$sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] },
				},
			},
		},
	]);

	console.log('📊 Aggregation result:', result);

	return result.length > 0
		? {
				averageRating: Math.round(result[0].averageRating * 10) / 10,
				totalRatings: result[0].totalRatings,
				distribution: {
					5: result[0].fiveStars,
					4: result[0].fourStars,
					3: result[0].threeStars,
					2: result[0].twoStars,
					1: result[0].oneStar,
				},
		  }
		: { averageRating: 0, totalRatings: 0, distribution: {} };
};

module.exports = mongoose.model('Rating', ratingSchema);