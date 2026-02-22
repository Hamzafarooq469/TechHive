const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const couponSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
    },
    
    createdBy: {
        type: String, 
        ref: 'User',
        required: true, 
    },
    
    type: {
        type: String,
        enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING', 'CASHBACK'],
        required: true,
    },
    value: {
        type: Number,
        required: true,
        min: 0,
    },
    maxUses: {
        type: Number,
        default: 100,
        min: 1,
    },
    timesUsed: {
        type: Number,
        default: 0,
    },
    validUntil: {
        type: Date,
        required: true,
    },
    applicableTo: {
        type: String,
        enum: ['ALL', 'NEW_USERS', 'CHURN_RISK', 'CATEGORY', 'PRODUCT'],
        default: 'ALL',
    },
    categoryRestriction: {
        type: [String],
        default: [],
    },
    userHistory: [{ 
        userId: { type: String, ref: 'User' },
        usedAt: { type: Date, default: Date.now },
    }],

}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);