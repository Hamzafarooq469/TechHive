// File: /backend-node/models/ComplainModel.js

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const complainSchema = new Schema({
    user: { 
        type: String, 
        ref: "User", 
        required: true 
    },
    
    category: {
        type: String,
        enum: ['Shipping & Delivery', 'Product Quality', 'Billing & Pricing', 'Customer Service', 'Technical Issue', 'Other'],
        required: true // Enforce selection
    },
    
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
        default: 'Open'
    },
    reason: { 
        type: String,
        required: true, 
        maxlength: 500 
    }, 
    
}, { timestamps: true });

module.exports = mongoose.model("Complain", complainSchema);