const mongoose = require("mongoose");
const CustomerProfile = require('../models/customerProfileModel');
const Shipping = require('../models/shippingModel'); // Required to fetch the city address


// --- UTILITY/HELPER FUNCTION FOR CITY TIER MAPPING (FIXED) ---
// This defines the business logic for geographical segmentation.
const mapCityToTier = (cityName) => {
    if (!cityName) {
        console.log(`DEBUG: City name is missing, returning Tier 3.`);
        return 3;
    }

    // 1. Normalize the input city (e.g., ' Rawalpindi ' -> 'rawalpindi')
    const normalizedCity = cityName.trim().toLowerCase();

    // 2. Define your city tiers with ALL LOWERCASE STRINGS
    const tier1Cities = ['islamabad', 'karachi', 'lahore'];
    const tier2Cities = ['faisalabad', 'hyderabad', 'rawalpindi', 'multan', 'gujranwala', 'peshawar', 'quetta'];

    if (tier1Cities.includes(normalizedCity)) {
        console.log(`DEBUG: Matched TIER 1 for city: ${normalizedCity}`);
        return 1;
    }
    
    if (tier2Cities.includes(normalizedCity)) {
        console.log(`DEBUG: Matched TIER 2 for city: ${normalizedCity}`);
        return 2;
    }
    
    // Default to Tier 3 if city is not explicitly listed
    console.log(`DEBUG: City '${normalizedCity}' not found in Tiers 1 or 2. Returning 3.`);
    return 3;
};


// --- ASYNCHRONOUS BACKGROUND TASK ---
// This function runs without blocking the main user response thread.
const updateCityTierAsync = async (customerId) => {
    try {
        let calculatedCityTier = 3;

        // 1. Fetch the necessary geographic data from the Shipping model
        const shippingDoc = await Shipping.findOne({ user: customerId }).sort({ createdAt: -1 });

        if (shippingDoc && shippingDoc.city) {
            // Print the exact data fetched from the DB before mapping for full transparency
            console.log(`DB FETCHED CITY: "${shippingDoc.city}"`); 
            
            calculatedCityTier = mapCityToTier(shippingDoc.city);
        }

        // 2. Update the profile document with the calculated tier
        await CustomerProfile.findOneAndUpdate(
            { user: customerId },
            { $set: { cityTier: calculatedCityTier } },
            { new: true, upsert: false }
        );
        
        console.log(`✅ BACKGROUND: Successfully updated City Tier to ${calculatedCityTier} for user ${customerId}.`);

    } catch (error) {
        // Log background task failures for system monitoring
        console.error(`❌ BACKGROUND ERROR: Failed to calculate/save cityTier for user ${customerId}:`, error);
    }
};



const saveCustomerProfile = async (req, res) => {
    // Extracting all survey-based fields from frontend request body
    const { 
        customerId, gender, maritalStatus, age, satisfactionScore, monthlySpending, 
        discountImportance, preferredCategoriesSurvey, communicationPreference, 
        educationLevel, shoppingFrequency  
    } = req.body;

    console.log("📥 Incoming Profile Payload:", req.body);

    // -------- REQUIRED FIELD CHECK --------
    if (
        !customerId || !gender || !maritalStatus || !age || !satisfactionScore || !monthlySpending || 
        !discountImportance || !preferredCategoriesSurvey || preferredCategoriesSurvey.length === 0 || 
        !communicationPreference || !educationLevel || !shoppingFrequency
    ) {
        return res.status(400).json({ 
            message: 'Missing required profile fields. Please complete the entire survey.' 
        });
    }

    // -------- MAP SURVEY DATA TO DB KEYS --------
    const profileData = {
        user: customerId,
        gender,
        maritalStatus,
        age,
        satisfactionScore,
        monthlySpending,
        discountImportance,
        preferredCategories: preferredCategoriesSurvey,
        communicationPreference,
        education: educationLevel,
        frequency: shoppingFrequency
    };

    try {
        // --- PHASE 1: IMMEDIATE SAVE OF SURVEY DATA ---
        const profile = await CustomerProfile.findOneAndUpdate(
            { user: customerId },
            { $set: profileData }, 
            { new: true, upsert: true, runValidators: true }
        );

        // --- PHASE 2: FIRE-AND-FORGET ASYNCHRONOUS UPDATE ---
        // This starts the Tier calculation in the background without making the user wait.
        updateCityTierAsync(customerId);

        // Send immediate success response to the client
        return res.status(201).json({
            message: 'Customer profile data saved successfully. City tier calculation pending.',
            profileId: profile._id
        });

    } catch (error) {
        console.error("❌ Error saving customer profile:", error);
        return res.status(500).json({ 
            message: 'Failed to save profile due to database error.' 
        });
    }
};

module.exports = {
    saveCustomerProfile,
};