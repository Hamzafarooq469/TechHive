
const express = require('express');
const router = express.Router();
const { submitComplaint, getComplaintsByUser } = require('../controller/complainController');

/**
 * POST /complain/submit
 * Submits a new complaint.
 * Payload: { "user": "uid123", "reason": "My order was late." }
 */
router.post('/submit', submitComplaint);

/**
 * GET /complain/:userId
 * Retrieves the complete complaint history for a user.
 */
router.get('/:userId', getComplaintsByUser);

module.exports = router;