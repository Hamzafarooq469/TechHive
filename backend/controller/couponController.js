const Coupon = require('../models/couponModel');

// --- Helper to generate a random coupon code ---
const generateCode = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};


const createCoupon = async (req, res) => {
    try {
        const { type, value, validUntil, maxUses, applicableTo, categoryRestriction, code, createdBy } = req.body; 
        
        if (!type || !value || !validUntil || !createdBy) {
            return res.status(400).json({ message: 'Missing required fields: type, value, validUntil, and creator ID.' });
        }

        const couponCode = code || generateCode();

        const newCoupon = new Coupon({
            code: couponCode,
            createdBy: createdBy,
            type,
            value,
            validUntil,
            maxUses: maxUses || 100,
            applicableTo,
            categoryRestriction,
        });

        const savedCoupon = await newCoupon.save();
        
        return res.status(201).json({ 
            message: 'Coupon created successfully.',
            couponCode: savedCoupon.code,
            couponId: savedCoupon._id 
        });

    } catch (error) {
        console.error("Error creating coupon:", error);
        if (error.code === 11000) {
             return res.status(409).json({ message: 'Coupon code already exists. Try generating a new one.' });
        }
        return res.status(500).json({ message: 'Failed to create coupon.' });
    }
};


const validateCoupon = async (req, res) => {
    try {
        const { code, userId, cartTotal } = req.body; 
        
        if (!code || !userId || cartTotal === undefined || cartTotal < 0) {
            return res.status(400).json({ message: 'Code, user ID, and a non-negative cart total are required for validation.' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        // 1. Check Existence and Expiry
        if (!coupon) {
            return res.status(404).json({ valid: false, message: 'Invalid coupon code.' });
        }
        if (coupon.validUntil < new Date()) {
            return res.status(400).json({ valid: false, message: 'Coupon has expired.' });
        }
        
        // 2. Check Usage Limits
        if (coupon.timesUsed >= coupon.maxUses) {
            return res.status(400).json({ valid: false, message: 'Coupon has reached its maximum usage limit.' });
        }

        // Check Per-User Usage Limit
        const hasUsed = coupon.userHistory.some(history => history.userId === userId);
        if (hasUsed) {
             return res.status(400).json({ valid: false, message: 'You have already used this coupon.' });
        }
        
        let discountApplied = 0;
        let newTotal = cartTotal;
        const couponValue = coupon.value;
        
        switch (coupon.type) {
            case 'PERCENTAGE':
                discountApplied = cartTotal * (couponValue / 100);
                break;
            case 'FIXED_AMOUNT':
                discountApplied = couponValue;
                break;
            case 'FREE_SHIPPING':
            case 'CASHBACK':
                discountApplied = 0; 
                break;
            default:
                return res.status(400).json({ valid: false, message: 'Invalid coupon type.' });
        }

        newTotal = Math.max(0, cartTotal - discountApplied);

        return res.status(200).json({ 
            valid: true, 
            message: `Coupon applied successfully.`,
            discount: discountApplied,
            newTotal: newTotal,
            couponType: coupon.type,
            cashbackValue: coupon.type === 'CASHBACK' ? couponValue : 0 
        });

    } catch (error) {
        console.error("Validation error:", error);
        return res.status(500).json({ valid: false, message: 'An internal error occurred during validation.' });
    }
};

module.exports = {
    createCoupon,
    validateCoupon,
};