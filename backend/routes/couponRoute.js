
// File: /backend-node/routes/CouponRoute.js (New File)
const express = require('express');
const router = express.Router();
const { createCoupon, validateCoupon } = require('../controller/couponController');

// Admin Route
router.post('/create', createCoupon); 

// Checkout Route
router.post('/validate', validateCoupon);

module.exports = router;

// Don't forget to mount this in your server file: app.use('/coupon', require('./routes/CouponRoute'));