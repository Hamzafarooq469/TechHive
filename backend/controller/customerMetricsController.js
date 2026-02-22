const mongoose = require("mongoose");
const CustomerMetrics = require('../models/customerMetrics'); 
const User = require('../models/userModel'); 
const Order = require('../models/orderModel'); 
const Comment = require('../models/commentModel'); 
const Message = require('../models/messageModel'); 
const Complain = require('../models/complainModel'); 

// --- HELPER FUNCTION: TENURE CALCULATION ---
const calculateTenure = (userCreatedAt) => {
    if (!userCreatedAt) return 0;
    const start = new Date(userCreatedAt);
    const end = new Date();
    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();
    return Math.max(0, (years * 12) + months); 
};


const calculateAndSaveMetrics = async (req, res) => {
    const { customerId } = req.body; 

    if (!customerId) {
        return res.status(400).json({ message: 'Missing customerId for metrics calculation.' });
    }

    try {
        const userDoc = await User.findOne({ uid: customerId });
        if (!userDoc) {
            return res.status(404).json({ message: 'User not found for metrics calculation.' });
        }

        const now = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(now.getFullYear() - 2);

        // --- 1. Aggregation Queries ---
        
        // A. ORDER-LEVEL Metrics
        const orderTotalsAgg = await Order.aggregate([
            { $match: { user: customerId } },
            { $group: {
                _id: null,
                totalAmount: { $sum: '$totalAmount' }, 
                orderCount: { $sum: 1 }, 
            }}
        ]);
        
        // B. ITEM-LEVEL Metrics
        const itemMetricsAgg = await Order.aggregate([
            { $match: { user: customerId } },
            { $unwind: "$orderItems" },
            { $group: {
                _id: null,
                totalProductPrice: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } },
                totalProductCount: { $sum: "$orderItems.quantity" },
            }}
        ]);
        
        // C. Behavioral Aggregates
        const commentAgg = await Comment.aggregate([
            { $match: { user: customerId } },
            { $group: {
                _id: null,
                totalRating: { $sum: '$rating' },
                totalComments: { $sum: 1 },
            }}
        ]);
        
        // D. COUPON PIPELINE
        const couponAgg = await Order.aggregate([
            { $match: { user: customerId } },
            { $group: {
                _id: null,
                couponUsed: { $sum: '$couponUsed' } 
            }}
        ]);

        // E. SPENDING HIKE PIPELINE
        const hikeAgg = await Order.aggregate([
            { $match: { 
                user: customerId,
                createdAt: { $gte: twoYearsAgo }
            }},
            { $group: {
                _id: null,
                currentPeriodAmount: {
                    $sum: { $cond: [{ $gte: ['$createdAt', oneYearAgo] }, '$totalAmount', 0] }
                },
                previousPeriodAmount: {
                    $sum: { $cond: [{ $and: [{ $lt: ['$createdAt', oneYearAgo] }, { $gte: ['$createdAt', twoYearsAgo] }]}, '$totalAmount', 0] }
                }
            }}
        ]);
        
        // F. Complaint Flag Query
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30); 
        
        const recentComplaints = await Complain.find({ 
            user: customerId, 
            createdAt: { $gte: thirtyDaysAgo } 
        }).select('createdAt');

        // G. Recency Calculation
        const lastOrderDoc = await Order.findOne({ user: customerId })
            .sort({ createdAt: -1 })
            .select('createdAt');


        // --- 2. Final Data Construction ---
        const orderTotals = orderTotalsAgg[0] || {};
        const itemMetrics = itemMetricsAgg[0] || {};
        const comments = commentAgg[0] || {};
        const couponResult = couponAgg[0] || {}; 
        const hikeResult = hikeAgg[0] || {}; 
        
        const cpAmount = hikeResult.currentPeriodAmount || 0;
        const ppAmount = hikeResult.previousPeriodAmount || 0;
        let orderHikeRatio = 0; 

        if (ppAmount > 0) {
            orderHikeRatio = (cpAmount - ppAmount) / ppAmount;
        } else if (cpAmount > 0) {
            orderHikeRatio = 1.0; 
        }
        const orderAmountHikeFromLastYear = Math.round(orderHikeRatio * 100);
        
        let daysSinceLastOrder = 0;
        if (lastOrderDoc && lastOrderDoc.createdAt) {
            const timeDifferenceMs = now.getTime() - lastOrderDoc.createdAt.getTime();
            daysSinceLastOrder = Math.floor(timeDifferenceMs / (1000 * 60 * 60 * 24));
        }

        const metricsData = {
            user: customerId,
            tenure: calculateTenure(userDoc.createdAt), 
            totalAmountSpent: orderTotals.totalAmount || 0,
            orderCount: orderTotals.orderCount || 0,
            avgProductPrice: (itemMetrics.totalProductPrice && itemMetrics.totalProductCount > 0) 
                             ? (itemMetrics.totalProductPrice / itemMetrics.totalProductCount) : 0, 
            couponUsed: couponResult.couponUsed || 0, 
            orderAmountHikeFromLastYear: orderAmountHikeFromLastYear,
            daysSinceLastOrder: daysSinceLastOrder,
            totalCommentsMade: comments.totalComments || 0,
            avgProductScore: (comments.totalComments > 0) ? (comments.totalRating / comments.totalComments) : 0,
            complain: recentComplaints.length > 0 ? 1 : 0, 
            warehouseToHome: 15.0, 
            cashbackAmountAvg: 12.5,
            calculated_at: new Date(),
        };

        // --- 3. Save/Update Metrics Document ---
        const metrics = await CustomerMetrics.findOneAndUpdate(
            { user: customerId },
            { $set: metricsData },
            { new: true, upsert: true, runValidators: true }
        );

        return res.status(200).json({ 
            message: 'Metrics calculated and saved.',
            metricsId: metrics._id,
            tenure: metrics.tenure,
            totalAmountSpent: metrics.totalAmountSpent,
            avgProductScore: metrics.avgProductScore,
            totalCommentsMade: metrics.totalCommentsMade,
            orderCount: metrics.orderCount, 
            avgProductPrice: metrics.avgProductPrice,
            couponUsed: metrics.couponUsed, 
            orderAmountHikeFromLastYear: metrics.orderAmountHikeFromLastYear, 
            daysSinceLastOrder: metrics.daysSinceLastOrder,
            complain: metrics.complain 
        });

    } catch (error) {
        console.error("FATAL Error calculating metrics for user:", customerId, error);
        return res.status(500).json({ message: 'Failed to calculate metrics due to server error.', details: error.message });
    }
};

module.exports = {
    calculateAndSaveMetrics,
};