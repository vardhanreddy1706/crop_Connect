const Rating = require('../models/Rating');
const User = require('../models/User');
const Order = require('../models/Order');
const Booking = require('../models/Booking');
const WorkerHireRequest = require('../models/WorkerHireRequest');
const sendEmail = require('../utils/sendEmail');
const { createNotification } = require('../utils/createNotification');

// @desc    Create a new rating
// @route   POST /api/ratings
// @access  Private
exports.createRating = async (req, res) => {
	try {
		const { rateeId, rating, review, ratingType, relatedOrder, relatedBooking, relatedHireRequest } = req.body;

		// Validation
		if (!rateeId || !rating || !ratingType) {
			return res.status(400).json({
				success: false,
				message: 'Please provide ratee, rating, and rating type',
			});
		}

		// Validate rating type matches user roles
		const rater = await User.findById(req.user.id);
		const ratee = await User.findById(rateeId);

		console.log('\n📝 Rating Submission Details:');
		console.log('   Rater:', rater?.name, `(${rater?.role})`, '| Email:', rater?.email);
		console.log('   Ratee:', ratee?.name, `(${ratee?.role})`, '| Email:', ratee?.email);
		console.log('   Rating Type:', ratingType);
		console.log('   Rating:', rating, 'stars');

		if (!ratee) {
			console.error('❌ Ratee not found! ID:', rateeId);
			return res.status(404).json({
				success: false,
				message: 'User to rate not found',
			});
		}

		if (!ratee.email) {
			console.error('❌ Ratee has no email address!');
			// Continue anyway but log the error
		}

		// Check if user can rate (based on role and ratingType)
		const validRatingTypes = {
			farmer: ['farmer_to_worker', 'farmer_to_tractor_owner', 'farmer_to_buyer'],
			worker: ['worker_to_farmer'],
			tractor_owner: ['tractor_owner_to_farmer'],
			buyer: ['buyer_to_farmer'],
		};

		if (!validRatingTypes[rater.role]?.includes(ratingType)) {
			return res.status(403).json({
				success: false,
				message: 'Invalid rating type for your role',
			});
		}

		// Require at least one transaction reference
		if (!relatedOrder && !relatedBooking && !relatedHireRequest) {
			return res.status(400).json({
				success: false,
				message: 'Please provide a transaction reference (order, booking, or hire request)',
			});
		}

		// Verify the transaction exists and is completed
		let isValidTransaction = false;
		if (relatedOrder) {
			const order = await Order.findById(relatedOrder);
			if (order && order.status === 'completed' && 
				(order.buyer.toString() === req.user.id || order.seller.toString() === req.user.id)) {
				isValidTransaction = true;
			}
		} else if (relatedBooking) {
			const booking = await Booking.findById(relatedBooking);
			if (booking && booking.status === 'completed' && 
				(booking.farmer.toString() === req.user.id || booking.tractorOwnerId.toString() === req.user.id)) {
				isValidTransaction = true;
			}
		} else if (relatedHireRequest) {
			const hireRequest = await WorkerHireRequest.findById(relatedHireRequest);
			const relatedBooking = await Booking.findById(hireRequest?.bookingId);
			if (relatedBooking && relatedBooking.status === 'completed' && 
				(hireRequest.farmer.toString() === req.user.id || hireRequest.worker.toString() === req.user.id)) {
				isValidTransaction = true;
			}
		}

		if (!isValidTransaction) {
			return res.status(403).json({
				success: false,
				message: 'You can only rate after completing a transaction',
			});
		}

		// Check for duplicate rating
		const existingRating = await Rating.findOne({
			rater: req.user.id,
			ratee: rateeId,
			...(relatedOrder && { relatedOrder }),
			...(relatedBooking && { relatedBooking }),
			...(relatedHireRequest && { relatedHireRequest }),
		});

		if (existingRating) {
			return res.status(400).json({
				success: false,
				message: 'You have already rated this transaction',
			});
		}

		// Create rating with only defined transaction references
		const ratingData = {
			rater: req.user.id,
			ratee: rateeId,
			rating,
			review: review || '',
			ratingType,
			isVerifiedTransaction: isValidTransaction,
		};

		// Only include transaction reference fields if they have values
		if (relatedOrder) ratingData.relatedOrder = relatedOrder;
		if (relatedBooking) ratingData.relatedBooking = relatedBooking;
		if (relatedHireRequest) ratingData.relatedHireRequest = relatedHireRequest;

		const newRating = await Rating.create(ratingData);

		// Populate rater details
		await newRating.populate('rater', 'name email role profileImage');
		await newRating.populate('ratee', 'name email role');

		// Calculate new average rating
		const ratingStats = await Rating.getAverageRating(rateeId);

		// Send notification
		await createNotification({
			recipientId: rateeId,
			type: 'rating_received',
			title: `New ${rating}⭐ Rating!`,
			message: `${rater.name} rated you ${rating} stars${review ? ': "' + review.substring(0, 50) + '..."' : ''}`,
			relatedUserId: req.user.id,
		});

		// Fetch transaction details for email
		let transactionDetails = '';
		let transactionType = '';
		const ratingDate = new Date().toLocaleString('en-IN', { 
			timeZone: 'Asia/Kolkata',
			dateStyle: 'long',
			timeStyle: 'short'
		});

		if (relatedOrder) {
			const order = await Order.findById(relatedOrder).populate('items.crop', 'name');
			if (order) {
				transactionType = 'Crop Order';
				const itemsList = order.items.map(item => 
					`<li>${item.crop?.name || 'Crop'} - ${item.quantity} ${item.unit} @ ₹${item.pricePerUnit}/unit</li>`
				).join('');
				transactionDetails = `
					<div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
						<h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">📦 Order Details:</h3>
						<p style="color: #6b7280; margin: 5px 0;"><strong>Order ID:</strong> #${order._id.toString().slice(-8).toUpperCase()}</p>
						<p style="color: #6b7280; margin: 5px 0;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
						<p style="color: #6b7280; margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.totalAmount.toLocaleString()}</p>
						<p style="color: #6b7280; margin: 8px 0 5px 0;"><strong>Items:</strong></p>
						<ul style="color: #6b7280; margin: 5px 0; padding-left: 20px;">${itemsList}</ul>
					</div>
				`;
			}
		} else if (relatedBooking) {
			const booking = await Booking.findById(relatedBooking)
				.populate('farmer', 'name')
				.populate('tractorOwnerId', 'name');
			if (booking) {
				if (booking.serviceType === 'tractor') {
					transactionType = 'Tractor Booking';
					transactionDetails = `
						<div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
							<h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">🚜 Booking Details:</h3>
							<p style="color: #6b7280; margin: 5px 0;"><strong>Booking ID:</strong> #${booking._id.toString().slice(-8).toUpperCase()}</p>
							<p style="color: #6b7280; margin: 5px 0;"><strong>Service:</strong> ${booking.tractorType || 'Tractor Service'}</p>
							<p style="color: #6b7280; margin: 5px 0;"><strong>Booking Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString('en-IN')}</p>
							<p style="color: #6b7280; margin: 5px 0;"><strong>Duration:</strong> ${booking.duration || 8} hours</p>
							<p style="color: #6b7280; margin: 5px 0;"><strong>Location:</strong> ${booking.location?.district || 'N/A'}, ${booking.location?.state || ''}</p>
							<p style="color: #6b7280; margin: 5px 0;"><strong>Total Cost:</strong> ₹${booking.totalCost?.toLocaleString() || 'N/A'}</p>
						</div>
					`;
				} else {
					transactionType = 'Worker Booking';
					transactionDetails = `
						<div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
							<h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">👷 Booking Details:</h3>
							<p style="color: #6b7280; margin: 5px 0;"><strong>Booking ID:</strong> #${booking._id.toString().slice(-8).toUpperCase()}</p>
							<p style="color: #6b7280; margin: 5px 0;"><strong>Service:</strong> ${booking.workerType || 'Worker Service'}</p>
							<p style="color: #6b7280; margin: 5px 0;"><strong>Booking Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString('en-IN')}</p>
							<p style="color: #6b7280; margin: 5px 0;"><strong>Working Hours:</strong> ${booking.workingHours || 8} hours/day</p>
							<p style="color: #6b7280; margin: 5px 0;"><strong>Location:</strong> ${booking.location?.district || 'N/A'}, ${booking.location?.state || ''}</p>
							<p style="color: #6b7280; margin: 5px 0;"><strong>Total Cost:</strong> ₹${booking.totalCost?.toLocaleString() || 'N/A'}</p>
						</div>
					`;
				}
			}
		} else if (relatedHireRequest) {
			const hireRequest = await WorkerHireRequest.findById(relatedHireRequest)
				.populate('farmer', 'name')
				.populate('worker', 'name');
			if (hireRequest) {
				transactionType = 'Worker Hire';
				transactionDetails = `
					<div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
						<h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">🤝 Hire Request Details:</h3>
						<p style="color: #6b7280; margin: 5px 0;"><strong>Request ID:</strong> #${hireRequest._id.toString().slice(-8).toUpperCase()}</p>
						<p style="color: #6b7280; margin: 5px 0;"><strong>Work Type:</strong> ${hireRequest.workType || 'General Work'}</p>
						<p style="color: #6b7280; margin: 5px 0;"><strong>Start Date:</strong> ${new Date(hireRequest.startDate).toLocaleDateString('en-IN')}</p>
						<p style="color: #6b7280; margin: 5px 0;"><strong>Duration:</strong> ${hireRequest.duration || 'N/A'} days</p>
						<p style="color: #6b7280; margin: 5px 0;"><strong>Daily Wage:</strong> ₹${hireRequest.offeredWage?.toLocaleString() || 'N/A'}/day</p>
					</div>
				`;
			}
		}

		// Get role-specific display names
		const roleDisplayNames = {
			farmer: 'Farmer',
			buyer: 'Buyer',
			worker: 'Worker',
			tractor_owner: 'Tractor Owner'
		};

		const raterRoleDisplay = roleDisplayNames[rater.role] || rater.role;
		const rateeRoleDisplay = roleDisplayNames[ratee.role] || ratee.role;

		// Send email notification with enhanced details
		const emailSubject = `🌟 You received a ${rating}-star rating on CropConnect!`;
		const emailHtml = `
			<div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px;">
				<div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
					<!-- Header -->
					<div style="text-align: center; margin-bottom: 25px;">
						<h1 style="color: #10b981; margin: 0; font-size: 28px;">🌟 New Rating Received!</h1>
						<p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 14px;">${ratingDate}</p>
					</div>

					<!-- Rater Info -->
					<div style="background: #f3f4f6; padding: 18px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
						<p style="font-size: 16px; color: #374151; margin: 0;">
							<strong style="color: #1f2937; font-size: 18px;">${rater.name}</strong>
							<span style="background: #3b82f6; color: white; padding: 3px 10px; border-radius: 12px; font-size: 12px; margin-left: 10px;">${raterRoleDisplay}</span>
						</p>
						<p style="color: #6b7280; margin: 8px 0 0 0; font-size: 14px;">has rated your service</p>
					</div>

					<!-- Rating Display -->
					<div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 10px; text-align: center; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
						<p style="font-size: 40px; margin: 0; letter-spacing: 3px;">${'⭐'.repeat(rating)}${'☆'.repeat(5 - rating)}</p>
						<p style="font-size: 24px; margin: 15px 0 0 0; color: #92400e; font-weight: bold;">${rating} out of 5 Stars</p>
						${review ? `
							<div style="background: white; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 3px solid #f59e0b;">
								<p style="font-style: italic; color: #374151; margin: 0; font-size: 15px; line-height: 1.6;">"${review}"</p>
							</div>
						` : ''}
					</div>

					<!-- Transaction Details -->
					${transactionDetails ? `
						<div style="margin: 20px 0;">
							<h3 style="color: #1f2937; font-size: 18px; margin-bottom: 10px;">Transaction Information</h3>
							${transactionDetails}
						</div>
					` : ''}

					<!-- Rating Summary -->
					<div style="background: #ecfdf5; padding: 20px; border-radius: 10px; margin-top: 25px; border: 2px solid #10b981;">
						<h3 style="color: #065f46; font-size: 18px; margin: 0 0 15px 0;">📊 Your Rating Summary</h3>
						<div style="display: flex; justify-content: space-around; flex-wrap: wrap;">
							<div style="text-align: center; margin: 10px;">
								<p style="font-size: 32px; font-weight: bold; color: #10b981; margin: 0;">${ratingStats.averageRating}</p>
								<p style="color: #065f46; margin: 5px 0 0 0; font-size: 14px;">Average Rating ⭐</p>
							</div>
							<div style="text-align: center; margin: 10px;">
								<p style="font-size: 32px; font-weight: bold; color: #10b981; margin: 0;">${ratingStats.totalRatings}</p>
								<p style="color: #065f46; margin: 5px 0 0 0; font-size: 14px;">Total Reviews</p>
							</div>
						</div>
					</div>

					<!-- Encouragement Message -->
					<div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #0ea5e9;">
						<p style="margin: 0; color: #0c4a6e; font-size: 15px; line-height: 1.6;">
							💡 <strong>Keep up the excellent work!</strong> High ratings boost your visibility and help you attract more customers on CropConnect.
						</p>
					</div>

					<!-- CTA Button -->
					<div style="text-align: center; margin-top: 30px;">
						<a href="${process.env.CLIENT_URL}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3); transition: all 0.3s;">
							📊 View Your Dashboard
						</a>
					</div>

					<!-- User Info -->
					<div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
						<p style="color: #6b7280; font-size: 13px; margin: 0;">
							This rating was for: <strong style="color: #374151;">${ratee.name}</strong> 
							<span style="background: #e5e7eb; padding: 2px 8px; border-radius: 10px; margin-left: 5px;">${rateeRoleDisplay}</span>
						</p>
					</div>
				</div>

				<!-- Footer -->
				<div style="text-align: center; margin-top: 20px;">
					<p style="color: rgba(255,255,255,0.9); font-size: 13px; margin: 0;">
						<strong>CropConnect</strong> - Connecting Farmers, Buyers & Service Providers
					</p>
					<p style="color: rgba(255,255,255,0.7); font-size: 11px; margin: 8px 0 0 0;">
						© ${new Date().getFullYear()} CropConnect. All rights reserved.
					</p>
				</div>
			</div>
		`;

		// Send email notification
		if (ratee.email) {
			try {
				console.log('\n📧 Attempting to send rating email...');
				console.log('   From:', process.env.EMAIL_USER);
				console.log('   To:', ratee.email);
				console.log('   Subject:', emailSubject);
				console.log('   Transaction Type:', transactionType || 'N/A');
				console.log('   Rater:', rater.name, `(${rater.role})`);
				console.log('   Ratee:', ratee.name, `(${ratee.role})`);
				
				const emailResult = await sendEmail({
					to: ratee.email,
					subject: emailSubject,
					html: emailHtml,
				});
				
				if (emailResult.success) {
					console.log(`\n✅ RATING EMAIL SENT SUCCESSFULLY!`);
					console.log(`   To: ${ratee.email}`);
					console.log(`   Message ID: ${emailResult.messageId}`);
					console.log(`   Check ${ratee.email}'s inbox! 📨\n`);
				} else {
					console.error(`\n❌ EMAIL SENDING FAILED!`);
					console.error(`   Error: ${emailResult.error}`);
					console.error(`   To: ${ratee.email}\n`);
				}
			} catch (emailError) {
				console.error('\n❌ EXCEPTION while sending rating email!');
				console.error('   Error:', emailError.message);
				console.error('   To:', ratee.email);
				console.error('   Stack:', emailError.stack);
				// Don't fail the entire request if email fails
			}
		} else {
			console.warn('\n⚠️ Skipping email - Ratee has no email address');
			console.warn(`   Ratee: ${ratee.name} (ID: ${ratee._id})\n`);
		}

		res.status(201).json({
			success: true,
			message: 'Rating submitted successfully',
			data: {
				rating: newRating,
				ratingStats,
			},
		});
	} catch (error) {
		console.error('Create rating error:', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Failed to submit rating',
		});
	}
};

// @desc    Get ratings for a user
// @route   GET /api/ratings/user/:userId
// @access  Public
exports.getUserRatings = async (req, res) => {
	try {
		const { userId } = req.params;
		const { page = 1, limit = 10, ratingType } = req.query;

		const query = { ratee: userId };
		if (ratingType) query.ratingType = ratingType;

		console.log('🔍 Fetching ratings for user:', userId);
		console.log('🔎 Query:', query);

		const ratings = await Rating.find(query)
			.populate('rater', 'name role profileImage')
			.populate({
				path: 'relatedOrder',
				select: 'items totalAmount createdAt status',
				populate: {
					path: 'items.crop',
					select: 'name'
				}
			})
			.populate({
				path: 'relatedBooking',
				select: 'serviceType tractorType workerType bookingDate duration workingHours location totalCost status'
			})
			.populate({
				path: 'relatedHireRequest',
				select: 'workType startDate duration offeredWage status'
			})
			.sort({ createdAt: -1 })
			.limit(limit * 1)
			.skip((page - 1) * limit);

		console.log('✅ Found ratings:', ratings.length);
		console.log('📊 Rating details:', ratings.map(r => ({ rater: r.rater?.name, rating: r.rating, type: r.ratingType })));

		const total = await Rating.countDocuments(query);
		const ratingStats = await Rating.getAverageRating(userId, ratingType);
		console.log('📈 Stats:', ratingStats);

		res.json({
			success: true,
			data: {
				ratings,
				stats: ratingStats,
				pagination: {
					currentPage: parseInt(page),
					totalPages: Math.ceil(total / limit),
					totalRatings: total,
				},
			},
		});
	} catch (error) {
		console.error('Get user ratings error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch ratings',
		});
	}
};

// @desc    Check if user can rate a transaction
// @route   GET /api/ratings/can-rate
// @access  Private
exports.canRate = async (req, res) => {
	try {
		const { rateeId, relatedOrder, relatedBooking, relatedHireRequest } = req.query;

		if (!rateeId || (!relatedOrder && !relatedBooking && !relatedHireRequest)) {
			return res.status(400).json({
				success: false,
				message: 'Please provide rateeId and transaction reference',
			});
		}

		// Check for existing rating
		const existingRating = await Rating.findOne({
			rater: req.user.id,
			ratee: rateeId,
			...(relatedOrder && { relatedOrder }),
			...(relatedBooking && { relatedBooking }),
			...(relatedHireRequest && { relatedHireRequest }),
		});

		res.json({
			success: true,
			canRate: !existingRating,
			existingRating: existingRating || null,
		});
	} catch (error) {
		console.error('Can rate check error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to check rating eligibility',
		});
	}
};

// @desc    Update a rating
// @route   PUT /api/ratings/:id
// @access  Private
exports.updateRating = async (req, res) => {
	try {
		const { id } = req.params;
		const { rating, review } = req.body;

		const existingRating = await Rating.findById(id);

		if (!existingRating) {
			return res.status(404).json({
				success: false,
				message: 'Rating not found',
			});
		}

		// Check if user owns the rating
		if (existingRating.rater.toString() !== req.user.id) {
			return res.status(403).json({
				success: false,
				message: 'You can only edit your own ratings',
			});
		}

		// Update rating
		existingRating.rating = rating || existingRating.rating;
		existingRating.review = review !== undefined ? review : existingRating.review;
		existingRating.isEdited = true;
		existingRating.editedAt = new Date();

		await existingRating.save();

		// Recalculate average
		const ratingStats = await Rating.getAverageRating(existingRating.ratee);

		res.json({
			success: true,
			message: 'Rating updated successfully',
			data: {
				rating: existingRating,
				ratingStats,
			},
		});
	} catch (error) {
		console.error('Update rating error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to update rating',
		});
	}
};

// @desc    Delete a rating
// @route   DELETE /api/ratings/:id
// @access  Private
exports.deleteRating = async (req, res) => {
	try {
		const { id } = req.params;

		const rating = await Rating.findById(id);

		if (!rating) {
			return res.status(404).json({
				success: false,
				message: 'Rating not found',
			});
		}

		// Check if user owns the rating
		if (rating.rater.toString() !== req.user.id) {
			return res.status(403).json({
				success: false,
				message: 'You can only delete your own ratings',
			});
		}

		await rating.deleteOne();

		res.json({
			success: true,
			message: 'Rating deleted successfully',
		});
	} catch (error) {
		console.error('Delete rating error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to delete rating',
		});
	}
};

// @desc    Get my ratings (ratings I've given)
// @route   GET /api/ratings/my-ratings
// @access  Private
exports.getMyRatings = async (req, res) => {
	try {
		const { page = 1, limit = 10 } = req.query;

		const ratings = await Rating.find({ rater: req.user.id })
			.populate('ratee', 'name role profileImage')
			.sort({ createdAt: -1 })
			.limit(limit * 1)
			.skip((page - 1) * limit);

		const total = await Rating.countDocuments({ rater: req.user.id });

		res.json({
			success: true,
			data: {
				ratings,
				pagination: {
					currentPage: parseInt(page),
					totalPages: Math.ceil(total / limit),
					totalRatings: total,
				},
			},
		});
	} catch (error) {
		console.error('Get my ratings error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch your ratings',
		});
	}
};