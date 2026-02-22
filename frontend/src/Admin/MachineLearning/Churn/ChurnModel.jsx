import React, { useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import ChurnModelExplanation from './ChurnModelExplanation';
import ModelHealthOverview from './ModelHealthOverview';
import ChurnRiskDashboard from './ChurnRiskDashboard';

const CHURN_API_ENDPOINT = '/prediction/churn'; 

const ChurnModel = () => { 

    // Safely retrieve the user ID (uid) from Redux state
    const loggedInUser = useSelector((state) => state.user.currentUser?.user);
    const uid = loggedInUser?.uid;

    const [predictionData, setPredictionData] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const [useManualInput, setUseManualInput] = useState(false);
    
    const [manualMetrics, setManualMetrics] = useState({
        // Demographic
        gender: 'Male',
        satisfactionScore: 3,
        cityTier: 2,
        maritalStatus: 'Single',
        
        // Order Behavior
        preferredOrderCategory: 'Laptop & Accessory',
        totalOrders: 5,
        totalSpent: 5000,
        daysSinceLastPurchase: 30,
        averageOrderValue: 1000,
        orderAmountHikeFromLastYear: 10,
        
        // Engagement
        accountAge: 365,
        purchaseFrequency: 2,
        hourSpendOnApp: 2,
        
        // Coupons & Rewards
        couponUsed: 1,
        cashbackAmount: 150,
        
        // Support & Issues
        supportTickets: 0,
        productReturns: 0,
        
        // Logistics
        warehouseToHome: 15,
        numberOfAddress: 2,
        
        // Platform Preferences
        preferredLoginDevice: 'Mobile Phone',
        preferredPaymentMode: 'Credit Card'
    });
    
    // The user ID to be used in the API call
    const TEST_USER_ID = uid; 

    /**
     * Function to run the prediction request against the backend stack.
     */
    const runChurnTest = async () => {
        // --- STEP 1: GUARD CLAUSE ---
        if (!useManualInput && !TEST_USER_ID) {
            setPredictionData({ 
                success: false, 
                message: "Authentication Error: User ID (uid) is missing. Please ensure you are logged in or use manual input mode."
            });
            return; // Stop execution if ID is missing
        }

        setLoading(true);
        setPredictionData(null);

        const testPayload = useManualInput 
            ? {
                customerId: "manual_test",
                manualMetrics: manualMetrics
              }
            : {
                customerId: TEST_USER_ID
              };

        try {
            // 1. Send the POST request to the Node.js backend
            const response = await axios.post(CHURN_API_ENDPOINT, testPayload);
            
            // 2. The backend response only needs to provide churn_probability and risk_tier
            setPredictionData({ 
                success: true, 
                data: response.data 
            });

        } catch (error) {
            console.error('Test failed:', error);
            
            const message = error.response 
                ? `Backend Error (${error.response.status}): ${error.response.data.message || 'Check Node.js logs.'}` 
                : `Connection Error: Ensure Node.js and Flask services are running.`;

            setPredictionData({ 
                success: false, 
                message: message
            });
        } finally {
            setLoading(false);
        }
    };
    
    /**
     * Handle input changes for manual metrics
     */
    const handleMetricChange = (field, value) => {
        // For dropdowns and text fields, use value as-is
        // For number fields, parse appropriately
        const numericFields = [
            'satisfactionScore', 'cityTier', 'totalOrders', 'totalSpent',
            'daysSinceLastPurchase', 'averageOrderValue', 'orderAmountHikeFromLastYear',
            'accountAge', 'purchaseFrequency', 'hourSpendOnApp',
            'couponUsed', 'cashbackAmount', 'supportTickets', 'productReturns',
            'warehouseToHome', 'numberOfAddress'
        ];
        
        if (numericFields.includes(field)) {
            setManualMetrics(prev => ({
                ...prev,
                [field]: parseFloat(value) || 0
            }));
        } else {
            setManualMetrics(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    // --- Component Render ---
    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <h1>🏃‍♂️ Customer Churn Prediction Test</h1>
            <p style={{ color: '#555', marginBottom: '20px' }}>
                Test the ML model's churn prediction by using real user data or entering custom metrics manually.
            </p>
            
            {/* Mode Selector */}
            <div style={{ 
                marginBottom: '25px', 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                border: '1px solid #dee2e6'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Select Test Mode:</h3>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        padding: '10px 15px',
                        backgroundColor: !useManualInput ? '#3498db' : 'white',
                        color: !useManualInput ? 'white' : '#333',
                        borderRadius: '6px',
                        border: '2px solid #3498db',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease'
                    }}>
                        <input 
                            type="radio" 
                            checked={!useManualInput}
                            onChange={() => setUseManualInput(false)}
                            style={{ marginRight: '8px' }}
                        />
                        Use My Account Data
                    </label>
                    <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        padding: '10px 15px',
                        backgroundColor: useManualInput ? '#9b59b6' : 'white',
                        color: useManualInput ? 'white' : '#333',
                        borderRadius: '6px',
                        border: '2px solid #9b59b6',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease'
                    }}>
                        <input 
                            type="radio" 
                            checked={useManualInput}
                            onChange={() => setUseManualInput(true)}
                            style={{ marginRight: '8px' }}
                        />
                        Enter Custom Metrics
                    </label>
                </div>
            </div>

            {/* Manual Input Form */}
            {useManualInput && (
                <div style={{ 
                    marginBottom: '25px', 
                    padding: '20px', 
                    backgroundColor: '#fff', 
                    borderRadius: '8px',
                    border: '2px solid #9b59b6',
                    boxShadow: '0 2px 8px rgba(155, 89, 182, 0.1)'
                }}>
                    <h3 style={{ marginTop: 0, color: '#9b59b6', marginBottom: '20px' }}>
                         Enter Customer Metrics
                    </h3>
                    
                    {/* Demographics Section */}
                    <div style={{ marginBottom: '25px' }}>
                        <h4 style={{ color: '#34495e', marginBottom: '15px', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
                             Demographics
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                                    Gender
                                </label>
                                <select 
                                    value={manualMetrics.gender}
                                    onChange={(e) => handleMetricChange('gender', e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                                    Satisfaction Score (1-5)
                                </label>
                                <input 
                                    type="number"
                                    value={manualMetrics.satisfactionScore}
                                    onChange={(e) => handleMetricChange('satisfactionScore', e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                    min="1"
                                    max="5"
                                />
                                <small style={{ color: '#777' }}>Customer satisfaction rating</small>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                                    City Tier (1-3)
                                </label>
                                <select 
                                    value={manualMetrics.cityTier}
                                    onChange={(e) => handleMetricChange('cityTier', e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                >
                                    <option value="1">Tier 1 (Metro)</option>
                                    <option value="2">Tier 2</option>
                                    <option value="3">Tier 3</option>
                                </select>
                                <small style={{ color: '#777' }}>City classification</small>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                                    Marital Status
                                </label>
                                <select 
                                    value={manualMetrics.maritalStatus}
                                    onChange={(e) => handleMetricChange('maritalStatus', e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                >
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Divorced">Divorced</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    {/* Order Behavior Section */}
                    <div style={{ marginBottom: '25px' }}>
                        <h4 style={{ color: '#34495e', marginBottom: '15px', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
                             Order Behavior
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                                    Preferred Category
                                </label>
                                <select 
                                    value={manualMetrics.preferredOrderCategory}
                                    onChange={(e) => handleMetricChange('preferredOrderCategory', e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                >
                                    <option value="Laptop & Accessory">Laptop & Accessory</option>
                                    <option value="Mobile Phone">Mobile Phone</option>
                                    <option value="Grocery">Grocery</option>
                                    <option value="Others">Others</option>
                                </select>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                                    Total Orders
                                </label>
                                <input 
                                    type="number"
                                    value={manualMetrics.totalOrders}
                                    onChange={(e) => handleMetricChange('totalOrders', e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                    min="0"
                                />
                                <small style={{ color: '#777' }}>Lifetime order count</small>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                                    Total Spent (PKR)
                                </label>
                                <input 
                                    type="number"
                                    value={manualMetrics.totalSpent}
                                    onChange={(e) => handleMetricChange('totalSpent', e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                    min="0"
                                />
                                <small style={{ color: '#777' }}>Lifetime spending</small>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                                    Days Since Last Purchase
                                </label>
                                <input 
                                    type="number"
                                    value={manualMetrics.daysSinceLastPurchase}
                                    onChange={(e) => handleMetricChange('daysSinceLastPurchase', e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                    min="0"
                                />
                                <small style={{ color: '#777' }}>Recency metric</small>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                                    Order Amount Hike (%)
                                </label>
                                <input 
                                    type="number"
                                    value={manualMetrics.orderAmountHikeFromLastYear}
                                    onChange={(e) => handleMetricChange('orderAmountHikeFromLastYear', e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                />
                                <small style={{ color: '#777' }}>YoY spending change</small>
                            </div>
                        </div>
                    </div>
                    
                    {/* Engagement Section */}
                    <div style={{ marginBottom: '25px' }}>
                        <h4 style={{ color: '#34495e', marginBottom: '15px', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
                             Engagement & Activity
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                                    Account Age (days)
                                </label>
                                <input 
                                    type="number"
                                    value={manualMetrics.accountAge}
                                    onChange={(e) => handleMetricChange('accountAge', e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                    min="0"
                                />
                                <small style={{ color: '#777' }}>Days since registration</small>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                                    Purchase Frequency (per month)
                                </label>
                                <input 
                                    type="number"
                                    step="0.1"
                                    value={manualMetrics.purchaseFrequency}
                                    onChange={(e) => handleMetricChange('purchaseFrequency', e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                    min="0"
                                />
                                <small style={{ color: '#777' }}>Orders per month</small>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                                    Hours Spent on App
                                </label>
                                <input 
                                    type="number"
                                    step="0.5"
                                    value={manualMetrics.hourSpendOnApp}
                                    onChange={(e) => handleMetricChange('hourSpendOnApp', e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                    min="0"
                                />
                                <small style={{ color: '#777' }}>Average monthly hours</small>
                            </div>
                        </div>
                    </div>
                    
                    {/* Coupons & Rewards Section */}
                    <div style={{ marginBottom: '25px' }}>
                        <h4 style={{ color: '#34495e', marginBottom: '15px', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
                             Coupons & Rewards
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                                    Coupons Used
                                </label>
                                <input 
                                    type="number"
                                    value={manualMetrics.couponUsed}
                                    onChange={(e) => handleMetricChange('couponUsed', e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                    min="0"
                                />
                                <small style={{ color: '#777' }}>Total coupons redeemed</small>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                                    Cashback Amount (PKR)
                                </label>
                                <input 
                                    type="number"
                                    value={manualMetrics.cashbackAmount}
                                    onChange={(e) => handleMetricChange('cashbackAmount', e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                    min="0"
                                />
                                <small style={{ color: '#777' }}>Total cashback received</small>
                            </div>
                        </div>
                    </div>
                    
                    {/* Support & Issues Section */}
                    <div style={{ marginBottom: '25px' }}>
                        <h4 style={{ color: '#34495e', marginBottom: '15px', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
                             Support & Issues
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                                    Support Tickets / Complaints
                                </label>
                                <input 
                                    type="number"
                                    value={manualMetrics.supportTickets}
                                    onChange={(e) => handleMetricChange('supportTickets', e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                    min="0"
                                    max="1"
                                />
                                <small style={{ color: '#777' }}>0 = No complaint, 1 = Has complaint</small>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                                    Product Returns
                                </label>
                                <input 
                                    type="number"
                                    value={manualMetrics.productReturns}
                                    onChange={(e) => handleMetricChange('productReturns', e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                    min="0"
                                />
                                <small style={{ color: '#777' }}>Number of returns</small>
                            </div>
                        </div>
                    </div>
                    
                    {/* Logistics Section */}
                    <div style={{ marginBottom: '25px' }}>
                        <h4 style={{ color: '#34495e', marginBottom: '15px', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
                             Logistics & Location
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                                    Warehouse to Home (km)
                                </label>
                                <input 
                                    type="number"
                                    step="0.1"
                                    value={manualMetrics.warehouseToHome}
                                    onChange={(e) => handleMetricChange('warehouseToHome', e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                    min="0"
                                />
                                <small style={{ color: '#777' }}>Distance in kilometers</small>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                                    Number of Addresses
                                </label>
                                <input 
                                    type="number"
                                    value={manualMetrics.numberOfAddress}
                                    onChange={(e) => handleMetricChange('numberOfAddress', e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                    min="1"
                                />
                                <small style={{ color: '#777' }}>Saved delivery addresses</small>
                            </div>
                        </div>
                    </div>
                    
                    {/* Platform Preferences Section */}
                    <div>
                        <h4 style={{ color: '#34495e', marginBottom: '15px', borderBottom: '2px solid #ecf0f1', paddingBottom: '8px' }}>
                             Platform Preferences
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                                    Preferred Login Device
                                </label>
                                <select 
                                    value={manualMetrics.preferredLoginDevice}
                                    onChange={(e) => handleMetricChange('preferredLoginDevice', e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                >
                                    <option value="Mobile Phone">Mobile Phone</option>
                                    <option value="Phone">Phone</option>
                                    <option value="Computer">Computer</option>
                                </select>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                                    Preferred Payment Mode
                                </label>
                                <select 
                                    value={manualMetrics.preferredPaymentMode}
                                    onChange={(e) => handleMetricChange('preferredPaymentMode', e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                                >
                                    <option value="Credit Card">Credit Card</option>
                                    <option value="Debit Card">Debit Card</option>
                                    <option value="E wallet">E-Wallet</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Cash on Delivery">Cash on Delivery</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Guard against running the test without a valid ID in auto mode */}
            { !useManualInput && !TEST_USER_ID && (
                 <div style={{ 
                     color: '#721c24', 
                     backgroundColor: '#f8d7da',
                     border: '1px solid #f5c6cb', 
                     padding: '12px', 
                     marginBottom: '15px', 
                     borderRadius: '4px' 
                 }}>
                    ⚠️ Prediction with account data requires login. Please log in or switch to manual input mode.
                 </div>
            )}
            
            <button 
                onClick={runChurnTest} 
                disabled={loading || (!useManualInput && !TEST_USER_ID)} 
                style={{ 
                    padding: '14px 30px', 
                    fontSize: '16px', 
                    cursor: loading || (!useManualInput && !TEST_USER_ID) ? 'not-allowed' : 'pointer', 
                    backgroundColor: loading || (!useManualInput && !TEST_USER_ID) ? '#bdc3c7' : '#2ecc71', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s ease'
                }}
            >
                {loading 
                    ? '🔄 Analyzing...' 
                    : useManualInput 
                        ? ' Predict Churn with Custom Data'
                        : ' Predict My Churn Risk'}
            </button>
            
            {/* --------------------------- BASIC PREDICTION RESULT DISPLAY --------------------------- */}
            {predictionData && (
                <div style={{ 
                    marginTop: '30px', 
                    padding: '25px', 
                    borderRadius: '10px', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: '2px solid', 
                    borderColor: predictionData.success ? '#27ae60' : '#e74c3c', 
                    backgroundColor: predictionData.success ? '#e8f8f5' : '#fadbd8' 
                }}>
                    {predictionData.success ? (
                        <>
                            <h3 style={{ marginTop: 0, color: '#2c3e50' }}>
                                 Prediction Successful!
                            </h3>
                            <p style={{ color: '#555', marginBottom: '20px' }}>
                                {useManualInput 
                                    ? 'Model analyzed the custom metrics you provided.' 
                                    : 'Model analyzed your account data and purchase history.'}
                            </p>
                            
                            <div style={{ 
                                padding: '20px', 
                                backgroundColor: 'white', 
                                borderRadius: '8px',
                                marginBottom: '15px'
                            }}>
                                <p style={{ 
                                    fontSize: '1.1rem', 
                                    fontWeight: '600', 
                                    margin: '0 0 10px 0', 
                                    color: '#34495e' 
                                }}>
                                    Churn Risk Level:
                                </p>
                                <p style={{ 
                                    fontSize: '2rem', 
                                    fontWeight: '800', 
                                    margin: '10px 0', 
                                    color: predictionData.data.risk_tier === 'High' 
                                        ? '#c0392b' 
                                        : predictionData.data.risk_tier === 'Medium' 
                                            ? '#f39c12' 
                                            : '#27ae60'
                                }}>
                                    {predictionData.data.risk_tier}
                                </p>
                                <p style={{ 
                                    fontSize: '1.3rem', 
                                    fontWeight: '600', 
                                    color: '#7f8c8d' 
                                }}>
                                    Probability: {predictionData.data.churn_probability}%
                                </p>
                            </div>
                            
                            <div style={{ 
                                padding: '15px', 
                                backgroundColor: '#fff3cd', 
                                borderLeft: '4px solid #ffc107',
                                borderRadius: '4px',
                                marginTop: '15px'
                            }}>
                                <p style={{ margin: 0, fontSize: '0.95rem', color: '#856404' }}>
                                    💡 <strong>Interpretation:</strong> {
                                        predictionData.data.risk_tier === 'High' 
                                            ? 'This customer has a high likelihood of churning. Immediate retention strategies recommended.'
                                            : predictionData.data.risk_tier === 'Medium'
                                                ? 'This customer shows moderate churn risk. Consider engagement campaigns.'
                                                : 'This customer is likely to remain active. Continue standard engagement.'
                                    }
                                </p>
                            </div>
                        </>
                    ) : (
                        // --- Failure State ---
                        <>
                            <h3 style={{ marginTop: 0 }}>❌ Prediction Failed!</h3>
                            <p><strong>Error Details:</strong> {predictionData.message}</p>
                            <p>Ensure your Node.js backend and Flask service are running.</p>
                        </>
                    )}
                </div>
            )}
        {/* <ChurnModelExplanation /> */}
        <ModelHealthOverview />
        <ChurnRiskDashboard />
        </div>

        
    );
};

export default ChurnModel;