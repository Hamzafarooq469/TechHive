
const express = require('express');
const router = express.Router();
// const { makeChurnPrediction } = require('../controllers/MLServiceRouterController');
const { calculateAndSaveMetrics } = require('../controller/customerMetricsController'); // 1. Import new controller

// ... existing routes ...

// --- REAL-TIME ENDPOINT (Checks Cache, falls back to Python API) ---
// router.post('/realtime', makeChurnPrediction); 

/**
 * POST /prediction/calculate-metrics
 * This endpoint triggers the heavy calculation job for a specific user.
 * It's intended for internal batch jobs or manual admin refresh.
 * Expects body: { "customerId": "..." }
 */
router.post('/calculate-metrics', calculateAndSaveMetrics); 

module.exports = router;