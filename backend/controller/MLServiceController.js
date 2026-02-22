
const axios = require('axios');
// --- IMPORT REQUIRED MONGOOSE MODELS ---
const CustomerProfile = require('../models/customerProfileModel');
const CustomerMetrics = require('../models/customerMetrics');

// Configuration: The URL where the external Python/Flask service is running
const PYTHON_API_URL = 'http://127.0.0.1:5000/api/ml/predict'; 


/**
 * @param {string} customerId - The identifier used to fetch data from the database.
 * @returns {Object} The complete feature payload required by the Python ML model.
 */
const fetchCustomerDataFromDB = async (customerId) => {
    console.log(`[DATA ORCHESTRATION] Fetching profile and metrics for ID: ${customerId}...`);

    // Fetch Static Profile Data and Dynamic Metrics Data simultaneously
    const [profileDoc, metricsDoc] = await Promise.all([
        CustomerProfile.findOne({ user: customerId }).lean(),
        CustomerMetrics.findOne({ user: customerId }).lean()
    ]);

    // --- CRITICAL CHECK FOR MISSING DATA ---
    if (!profileDoc) {
        throw new Error(`Customer Profile data not found for ID: ${customerId}. Please ensure the survey is saved.`);
    }
    if (!metricsDoc) {
        throw new Error(`Customer Metrics data not found for ID: ${customerId}. Please ensure the calculation job has run.`);
    }

    // 3. Assemble the FINAL Payload for the Python ML Model
    const finalPayload = {
        // --- DATA FROM CUSTOMER PROFILE (Static/Survey) ---
        'Gender': [profileDoc.gender || 'Unknown'],
        'SatisfactionScore': [profileDoc.satisfactionScore || 3], 
        'CityTier': [profileDoc.cityTier || 3],
        'MaritalStatus': [profileDoc.maritalStatus || 'Single'],

        // --- DATA FROM CUSTOMER METRICS (Dynamic/Aggregated) ---
        'Tenure': [metricsDoc.tenure || 0],
        'Complain_Raw': [metricsDoc.complain || 0],
        'CashbackAmount': [metricsDoc.cashbackAmountAvg || 0], 
        
        // Data derived from Orders/Aggregations
        'OrderCount': [metricsDoc.orderCount || 0], 
        'CouponUsed': [metricsDoc.couponUsed || 0],
        'OrderAmountHikeFromlastYear': [metricsDoc.orderAmountHikeFromLastYear || 0],
        'DaySinceLastOrder': [metricsDoc.daysSinceLastOrder || 7],

        // --- DATA FROM OTHER SOURCES / DEFAULTS (Placeholders/TO DO) ---
        'WarehouseToHome': [metricsDoc.warehouseToHome || 12.0],
        'PreferedOrderCategory': [
             profileDoc.preferredCategories && profileDoc.preferredCategories.length > 0 
            ? profileDoc.preferredCategories[0] // Use the first category in the array
            : 'Others' // Fallback if array is null or empty
        ],
        'HourSpendOnApp': [1.5], 
        'NumberOfAddress': [3], 
        'PreferredLoginDevice': ['Mobile Phone'], 
        'PreferredPaymentMode': ['Credit Card'], 
        
        // --- String/Categorical Feature required by Python ---
        'Complain_Str': [metricsDoc.complain === 1 ? 'Recent Complaint' : 'No Complain'], 
    };
    
    return finalPayload;
};

/**
 * Function to call the external Python Prediction API.
 * This is also defined using the cleaner 'const async' arrow function syntax.
 * @param {string} customerID - The identifier used to fetch data from the database.
 * @param {Object} manualMetrics - Optional manual metrics for testing (bypasses DB lookup)
 */
const getChurnPrediction = async (customerID, manualMetrics = null) => {
    console.log('--- Calling external Python service (Port 5000) ---');
    
    try {
        let fullCustomerDataPayload;
        
        // If manual metrics are provided, use them instead of fetching from DB
        if (manualMetrics) {
            console.log('[MANUAL METRICS MODE] Using provided metrics for testing...');
            fullCustomerDataPayload = {
                // Demographics
                'Gender': [manualMetrics.gender || 'Male'],
                'SatisfactionScore': [parseInt(manualMetrics.satisfactionScore) || 3],
                'CityTier': [parseInt(manualMetrics.cityTier) || 2],
                'MaritalStatus': [manualMetrics.maritalStatus || 'Single'],
                
                // Order Behavior
                'PreferedOrderCategory': [manualMetrics.preferredOrderCategory || 'Laptop & Accessory'],
                'OrderCount': [parseInt(manualMetrics.totalOrders) || 0],
                'DaySinceLastOrder': [parseInt(manualMetrics.daysSinceLastPurchase) || 0],
                'OrderAmountHikeFromlastYear': [parseFloat(manualMetrics.orderAmountHikeFromLastYear) || 0],
                
                // Engagement
                'Tenure': [Math.floor((manualMetrics.accountAge || 365) / 30)], // Convert days to months
                'HourSpendOnApp': [parseInt(manualMetrics.hourSpendOnApp) || 2],
                
                // Coupons & Rewards
                'CouponUsed': [parseInt(manualMetrics.couponUsed) || 0],
                'CashbackAmount': [parseFloat(manualMetrics.cashbackAmount) || 0],
                
                // Support & Issues
                'Complain_Raw': [parseInt(manualMetrics.supportTickets) > 0 ? 1 : 0],
                'Complain_Str': [parseInt(manualMetrics.supportTickets) > 0 ? 'Recent Complaint' : 'No Complain'],
                
                // Logistics
                'WarehouseToHome': [parseFloat(manualMetrics.warehouseToHome) || 15],
                'NumberOfAddress': [parseInt(manualMetrics.numberOfAddress) || 1],
                
                // Platform Preferences
                'PreferredLoginDevice': [manualMetrics.preferredLoginDevice || 'Mobile Phone'],
                'PreferredPaymentMode': [manualMetrics.preferredPaymentMode || 'Credit Card']
            };
        } else {
            // 1. Data Orchestration: Fetch the complete profile from the database
            fullCustomerDataPayload = await fetchCustomerDataFromDB(customerID);
        }
        
        console.log('[PAYLOAD SENT TO PYTHON]', JSON.stringify(fullCustomerDataPayload));
        
        // 2. Use Axios to make a POST request to the Flask server
        const response = await axios.post(PYTHON_API_URL, fullCustomerDataPayload, {
            timeout: 5000 
        });

        // 3. Returns the clean JSON result from Python
        return response.data;

    } catch (error) {
        if (error.response) {
            console.error('Python API Error Response:', error.response.data);
            throw new Error(`Python API returned status ${error.response.status}`);
        } else {
            console.error('API is unreachable or failed:', error.message);
            throw new Error('Prediction service is currently offline or unreachable.');
        }
    }
};

const makeChurnPrediction = async (req, res) => {
    try {
        const { customerId, manualMetrics } = req.body; 

        if (!customerId) {
            return res.status(400).json({ message: 'Missing required field: customerId.' });
        }

        //  Pass manualMetrics to getChurnPrediction if provided
        const predictionResult = await getChurnPrediction(customerId, manualMetrics); 

        return res.status(200).json(predictionResult);

    } catch (error) {
        console.error('Error during prediction process:', error.message);
        // We catch the error from getChurnPrediction and format it for the user.
        return res.status(500).json({ 
            message: 'Prediction service is currently unavailable or returned invalid data.',
            details: error.message 
        });
    }
}

const makeSentimentAnalysis = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || typeof text !== 'string' || text.trim() === '') {
            return res.status(400).json({ message: 'Missing or invalid required field: text.' });
        }

        console.log('--- Calling external Python sentiment service (Port 5000) ---');
        
        const response = await axios.post('http://127.0.0.1:5000/api/ml/sentiment/predict', {
            text: text.trim()
        }, {
            timeout: 10000  // 10 second timeout for sentiment analysis
        });

        return res.status(200).json(response.data);

    } catch (error) {
        console.error('Error during sentiment analysis:', error.message);
        return res.status(500).json({ 
            message: 'Sentiment analysis service is currently unavailable or returned invalid data.',
            details: error.response?.data?.detail || error.message 
        });
    }
};

module.exports = {
    getChurnPrediction,
    makeChurnPrediction,
    makeSentimentAnalysis
};