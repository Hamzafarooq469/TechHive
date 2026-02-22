const express = require('express');
const router = express.Router();
const { makeChurnPrediction, makeSentimentAnalysis } = require('../controller/MLServiceController');

/**
 * POST /prediction/churn
 * This endpoint accepts a customer ID to trigger a full profile prediction lookup.
 */
router.post('/churn', makeChurnPrediction);

/**
 * POST /prediction/sentiment
 * This endpoint accepts text to analyze sentiment.
 */
router.post('/sentiment', makeSentimentAnalysis);

module.exports = router;