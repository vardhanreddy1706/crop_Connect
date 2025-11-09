const express = require('express');
const router = express.Router();
const {
	createRating,
	getUserRatings,
	canRate,
	updateRating,
	deleteRating,
	getMyRatings,
} = require('../controllers/ratingController');
const { protect } = require('../middlewares/authMiddleware');

// Protected routes
router.post('/', protect, createRating);
router.get('/can-rate', protect, canRate);
router.get('/my-ratings', protect, getMyRatings);
router.put('/:id', protect, updateRating);
router.delete('/:id', protect, deleteRating);

// Public routes
router.get('/user/:userId', getUserRatings);

module.exports = router;