const Review = require('../models/Review');

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
const getReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find().sort('-createdAt');

        res.status(200).json({
            success: true,
            data: reviews
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create or update review
// @route   POST /api/reviews
// @access  Public
const createReview = async (req, res, next) => {
    try {
        const { email, ...reviewData } = req.body;

        // Check if review with this email exists
        const existingReview = await Review.findOne({ email });

        let review;
        if (existingReview) {
            // Update existing review
            review = await Review.findOneAndUpdate(
                { email },
                reviewData,
                { new: true, runValidators: true }
            );
            res.status(200).json({
                success: true,
                data: review,
                message: 'Review updated successfully'
            });
        } else {
            // Create new review
            review = await Review.create(req.body);
            res.status(201).json({
                success: true,
                data: review,
                message: 'Review created successfully'
            });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get reviews stats
// @route   GET /api/reviews/stats
// @access  Public
const getReviewStats = async (req, res, next) => {
    try {
        const stats = await Review.aggregate([
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    averageRating: { $avg: '$rating' },
                    ratingDistribution: {
                        $push: '$rating'
                    }
                }
            }
        ]);

        if (stats.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    totalReviews: 0,
                    averageRating: 0,
                    ratingDistribution: {}
                }
            });
        }

        const result = stats[0];

        // Calculate rating distribution
        const distribution = {};
        for (let i = 1; i <= 5; i++) {
            distribution[i] = result.ratingDistribution.filter(r => r === i).length;
        }

        res.status(200).json({
            success: true,
            data: {
                totalReviews: result.totalReviews,
                averageRating: Math.round(result.averageRating * 10) / 10,
                ratingDistribution: distribution
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getReviews,
    createReview,
    getReviewStats
};