
const express = require('express');
const router = express.Router();
const { saveCustomerProfile } = require('../controller/customerProfileController');

/**
 * POST /profile/save
 * Endpoint for the frontend survey to submit customer demographic and attitudinal data.
 */
router.post('/save', saveCustomerProfile);


// --- Update your main server file (server.js or index.js) to mount this router ---

// In server.js:
// const profileRoute = require('./routes/ProfileRoute');
// app.use("/profile", profileRoute); 
// 
// The final endpoint URL will be: POST /profile/save

module.exports = router;