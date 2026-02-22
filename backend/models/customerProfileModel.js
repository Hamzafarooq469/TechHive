

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const customerProfileSchema = new Schema({
    // 1. Linking Field: Links this profile back to the core user
    user: { 
        type: String, 
        ref: "User", 
        required: true, 
        unique: true 
    },

    // 2. Demographic & Attitudinal Data (From Initial Survey)
    gender: { 
        type: String, 
        enum: ['Male', 'Female', 'Other'] 
    },
    maritalStatus: { 
        type: String, 
        enum: ['Single', 'Married', 'Divorced'] 
    },
    age: { 
        type: Number, 
        min: 12 
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    
    // 3. Behavioral/Preference Data (From Survey)
    preferredCategories: { 
        type: [String], // Array to store multiple selections
        default: [] 
    },
    monthlySpending: { 
        type: Number, 
        min: 0, 
        default: 0 
    },
    discountImportance: { 
        type: String, 
        enum: ['Low', 'Medium', 'High'], 
        default: 'Medium' 
    },
    communicationPreference: { 
        type: String, 
        enum: ['Email', 'SMS', 'Whatsapp', 'App Push Notifications'], 
        default: 'Email' 
    },

    // 4. ML Feature Storage (Updated by periodic CSAT surveys)
    satisfactionScore: { 
        type: Number, 
        min: 1, 
        max: 5, 
        default: 3 
    },
    satisfaction_score_last_updated: {
        type: Date,
        default: Date.now
    },
    education: {
        type: String,
        enum: ['High School', 'Bachelor', 'Master', 'PhD', 'Other'],
        default: 'High School'
    },
    frequency: { 
        type: String, 
        enum: ['Weekly', 'Monthly', 'Quarterly', 'Yearly', 'Occasionally'], 
        default: 'Occasionally' 
    },
    cityTier: {
        type: Number,
        enum: [1, 2, 3], // Tiers must be 1, 2, or 3
        default: 3 // Default to Tier 3 if address is unknown
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("CustomerProfile", customerProfileSchema);