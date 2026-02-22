import React, { useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux'; // ✅ Required for creator ID

const CREATE_ENDPOINT = '/coupon/create';
const VALIDATE_ENDPOINT = '/coupon/validate';

const CouponManager = () => {
    
    // ✅ Retrieve Admin/Creator UID from Redux Store
    const loggedInUser = useSelector((state) => state.user.currentUser?.user);
    const adminUid = loggedInUser?.uid || loggedInUser?._id; 
    
    // --- State for Coupon Creation Form (Admin Side) ---
    const [creationData, setCreationData] = useState({
        code: '',
        type: 'PERCENTAGE',
        value: 10,
        validUntil: '',
        maxUses: 100,
        applicableTo: 'ALL',
        categoryRestriction: '', 
    });
    const [createStatus, setCreateStatus] = useState(null);
    const [createLoading, setCreateLoading] = useState(false);

    // --- State for Validation Test Form (Testing Logic) ---
    const [testData, setTestData] = useState({
        code: '',
        userId: 'TEST_USER_ID_123', // Use a placeholder ID for validation tests
        cartTotal: 100,
    });
    const [testStatus, setTestStatus] = useState(null);
    const [testLoading, setTestLoading] = useState(false);

    // --- Handlers ---

    const handleCreateChange = (e) => {
        const { name, value } = e.target;
        setCreationData(prev => ({ ...prev, [name]: value }));
    };

    const handleTestChange = (e) => {
        const { name, value, type } = e.target;
        setTestData(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? Number(value) : value 
        }));
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setCreateStatus(null);
        
        if (!adminUid) {
            setCreateStatus({ success: false, message: "Error: Must be logged in as an Admin to create a coupon." });
            return;
        }

        setCreateLoading(true);

        try {
            const payload = {
                ...creationData,
                // ✅ CRITICAL: Inject the Uid from Redux here
                createdBy: adminUid, 
                // Format date and array data
                validUntil: new Date(creationData.validUntil),
                categoryRestriction: creationData.categoryRestriction.split(',').map(s => s.trim()).filter(s => s)
            };

            const response = await axios.post('/coupon/create', payload);
            setCreateStatus({ success: true, message: `Created code: ${response.data.couponCode}` });
            setCreationData(prev => ({ ...prev, code: response.data.couponCode }));
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            setCreateStatus({ success: false, message: `Creation failed: ${msg}` });
        } finally {
            setCreateLoading(false);
        }
    };

    const handleValidateSubmit = async (e) => {
        e.preventDefault();
        setTestStatus(null);
        setTestLoading(true);
        
        try {
            const response = await axios.post('/coupon/validate', testData);
            setTestStatus({ success: response.data.valid, data: response.data });
        } catch (error) {
            const data = error.response?.data;
            setTestStatus({ success: false, data: data, message: data?.message || "Validation failed on server." });
        } finally {
            setTestLoading(false);
        }
    };

    const styles = {
        container: { 
            padding: '60px 40px', 
            maxWidth: '1100px', 
            margin: '40px auto', 
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
        header: {
            background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
            color: 'white',
            padding: '30px',
            borderRadius: '12px',
            marginBottom: '30px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        },
        section: { 
            padding: '30px', 
            border: '2px solid #dee2e6', 
            borderRadius: '12px', 
            marginBottom: '30px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            backgroundColor: '#ffffff',
        },
        sectionTitle: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontWeight: 'bold',
            fontSize: '18px',
        },
        formRow: { 
            display: 'flex', 
            gap: '20px', 
            marginBottom: '20px',
            flexWrap: 'wrap',
        },
        formGroup: { 
            flex: 1, 
            minWidth: '280px',
        },
        label: {
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#2c3e50',
            fontSize: '14px',
        },
        input: { 
            width: '97%', 
            padding: '12px', 
            borderRadius: '8px', 
            border: '2px solid #e0e0e0',
            fontSize: '14px',
            transition: 'all 0.3s ease',
            backgroundColor: '#fff',
        },
        button: (loading, color) => ({ 
            padding: '15px 50px', 
            background: loading ? '#95a5a6' : (color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'), 
            color: 'white', 
            border: 'none', 
            borderRadius: '10px', 
            cursor: loading ? 'not-allowed' : 'pointer', 
            marginTop: '20px',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease',
        }),
        statusBox: (success) => ({ 
            padding: '20px', 
            background: success 
                ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' 
                : 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)', 
            border: `2px solid ${success ? '#28a745' : '#e74c3c'}`, 
            borderRadius: '10px', 
            marginTop: '20px',
            color: success ? '#155724' : '#721c24',
            fontWeight: '500',
        })
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}> Coupon Management System</h1>
                <p style={{ margin: '10px 0 0 0', opacity: 0.9, fontSize: '16px' }}>
                    Admin tools for creating, testing, and verifying coupon codes
                </p>
                {/* <p style={{ margin: '10px 0 0 0', opacity: 0.8, fontSize: '14px' }}>
                    Creator ID: <strong>{adminUid || 'NOT LOGGED IN'}</strong>
                </p> */}
            </div>

            {!adminUid && (
                <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#ffe6e6', 
                    border: '2px solid #e74c3c',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    color: '#c0392b',
                    fontWeight: 'bold',
                    textAlign: 'center',
                }}>
                    ⚠️ You must be logged in as an Admin to access this feature.
                </div>
            )}

            {/* --- 1. Coupon Creation Section --- */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}> Create New Coupon Code</h2>
                {adminUid ? (
                    <form onSubmit={handleCreateSubmit}>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Code (Leave blank to auto-generate):</label>
                                <input type="text" name="code" value={creationData.code} onChange={handleCreateChange} style={styles.input} placeholder="AUTO-GENERATE" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Valid Until (Date):</label>
                                <input type="date" name="validUntil" value={creationData.validUntil} onChange={handleCreateChange} style={styles.input} required />
                            </div>
                        </div>

                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Discount Type:</label>
                                <select name="type" value={creationData.type} onChange={handleCreateChange} style={styles.input}>
                                    <option value="PERCENTAGE">Percentage (%)</option>
                                    <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
                                    <option value="FREE_SHIPPING">Free Shipping</option>
                                    <option value="CASHBACK">Cashback</option>
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Discount Value:</label>
                                <input type="number" name="value" value={creationData.value} onChange={handleCreateChange} style={styles.input} required min="0" />
                            </div>
                        </div>

                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Max Total Uses:</label>
                                <input type="number" name="maxUses" value={creationData.maxUses} onChange={handleCreateChange} style={styles.input} required min="1" />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Target Audience:</label>
                                <select name="applicableTo" value={creationData.applicableTo} onChange={handleCreateChange} style={styles.input}>
                                    <option value="ALL">All Users</option>
                                    <option value="NEW_USERS">New Users</option>
                                    <option value="CHURN_RISK">Churn Risk Users (ML Target)</option>
                                    <option value="CATEGORY">Category Restriction</option>
                                </select>
                            </div>
                        </div>
                        
                        {creationData.applicableTo === 'CATEGORY' && (
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Category Restriction (Comma separated):</label>
                                <input 
                                    type="text" 
                                    name="categoryRestriction" 
                                    value={creationData.categoryRestriction} 
                                    onChange={handleCreateChange} 
                                    style={styles.input}
                                    placeholder="e.g., Apparel, Electronics, Books" 
                                />
                            </div>
                        )}
                        
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '25px' }}>
                            <button type="submit" disabled={createLoading} style={styles.button(createLoading, 'linear-gradient(135deg, #28a745 0%, #20c997 100%)')}>
                                {createLoading ? '⏳ Creating...' : 'Generate & Save Coupon'}
                            </button>
                        </div>

                        {createStatus && (
                            <div style={styles.statusBox(createStatus.success)}>
                                <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                                    {createStatus.success ? '✅ ' : '❌ '}{createStatus.message}
                                </p>
                                {createStatus.success && (
                                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                                        New Code: <span style={{ padding: '5px 10px', backgroundColor: '#fff', borderRadius: '6px', color: '#667eea' }}>{creationData.code}</span>
                                    </p>
                                )}
                            </div>
                        )}
                    </form>
                ) : null}
            </div>

            {/* --- 2. Coupon Validation Test Section --- */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}> Test Validation Logic</h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>Verify discount calculation and usage checks work before pushing live.</p>
                <form onSubmit={handleValidateSubmit}>
                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Coupon Code:</label>
                            <input type="text" name="code" value={testData.code} onChange={handleTestChange} style={styles.input} required placeholder="Enter code to test" />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>User ID (To check usage history):</label>
                            <input type="text" name="userId" value={testData.userId} onChange={handleTestChange} style={styles.input} required />
                        </div>
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Cart Total ($):</label>
                        <input type="number" name="cartTotal" value={testData.cartTotal} onChange={handleTestChange} style={styles.input} required min="0" />
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '25px' }}>
                        <button type="submit" disabled={testLoading} style={styles.button(testLoading)}>
                            {testLoading ? '⏳ Validating...' : ' Validate Code'}
                        </button>
                    </div>

                    {testStatus && (
                        <div style={styles.statusBox(testStatus.success)}>
                            {testStatus.success ? (
                                <>
                                    <p style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold' }}>✅ COUPON VALID!</p>
                                    <p style={{ margin: '8px 0', fontSize: '15px' }}>{testStatus.data.message}</p>
                                    <div style={{ marginTop: '15px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '8px' }}>
                                        <p style={{ margin: '5px 0' }}>💰 <strong>Discount Applied:</strong> ${testStatus.data.discount.toFixed(2)}</p>
                                        <p style={{ margin: '5px 0' }}>🛒 <strong>New Cart Total:</strong> ${testStatus.data.newTotal.toFixed(2)}</p>
                                        {testStatus.data.couponType === 'CASHBACK' && (
                                            <p style={{ margin: '5px 0', fontWeight: 'bold', color: '#28a745' }}>
                                                🎁 <strong>Cashback Earned:</strong> ${testStatus.data.cashbackValue.toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>❌ INVALID COUPON: {testStatus.message}</p>
                            )}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default CouponManager;
