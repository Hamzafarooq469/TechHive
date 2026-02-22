

const Complain = require('../models/complainModel');


const submitComplaint = async (req, res) => {
    try {
        const { user, reason, category, status } = req.body;

        if (!user || !reason || !category) {
            return res.status(400).json({ message: 'User ID, reason, and category are required.' });
        }

        const newComplaint = new Complain({
            user,
            reason,
            category, // ✅ CHANGE 3: Include the new field in the document creation
            status: status || 'Open' 
        });

        const savedComplaint = await newComplaint.save();

        return res.status(201).json({
            message: 'Complaint submitted successfully.',
            complaintId: savedComplaint._id,
            status: savedComplaint.status
        });
        } catch (error) {
        console.error("Error submitting complaint:", error);
        // Handle Mongoose validation errors gracefully
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Complaint validation failed: ' + error.message });
        }
        return res.status(500).json({ message: 'Failed to submit complaint due to a server error.' });
    }
};


const getComplaintsByUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID parameter is required.' });
        }

        // Fetch all complaints, sorted by newest first
        const complaints = await Complain.find({ user: userId }).sort({ createdAt: -1 });

        if (complaints.length === 0) {
            return res.status(404).json({ message: 'No complaint history found for this user.' });
        }

        return res.status(200).json(complaints);

    } catch (error) {
        console.error("Error fetching complaints:", error);
        return res.status(500).json({ message: 'Failed to fetch complaints.' });
    }
};

module.exports = {
    submitComplaint,
    getComplaintsByUser,
};