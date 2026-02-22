import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const SUBMIT_ENDPOINT = '/complain/submit'; 
const FETCH_ENDPOINT = '/complain/'; // Will append userId

const Complain = () => {
    
    const loggedInUser = useSelector((state) => state.user.currentUser?.user);
    const uid = loggedInUser?.uid || loggedInUser?._id; 
    
    const [complaintCategory, setComplaintCategory] = useState(''); 
    const [complaintReason, setComplaintReason] = useState('');
    
    const [complaintStatus, setComplaintStatus] = useState(null); 
    const [history, setHistory] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [errors, setErrors] = useState({}); 

    useEffect(() => {
        if (uid) {
            fetchComplaints();
        }
    }, [uid]);

    const fetchComplaints = async () => {
        setHistoryLoading(true);
        try {
            console.log('/complain/')
            const response = await axios.get(`/complain/${uid}`);
            
            setHistory(response.data);
        } catch (error) {
            console.error("Error fetching complaint history:", error);
            if (error.response && error.response.status !== 404) {
                 setHistory([]);
            }
        } finally {
            setHistoryLoading(false);
        }
    };

    const validate = () => {
        const newErrors = {};
        
        if (!complaintCategory) {
            newErrors.category = 'Please select a category.';
        }
        if (!complaintReason.trim()) {
            newErrors.reason = 'Please describe your issue.';
        } else if (complaintReason.trim().length > 500) { 
            newErrors.reason = 'Reason cannot exceed 500 characters.';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setComplaintStatus(null); 
        
        if (!uid) {
            alert("Error: You must be logged in to submit a complaint.");
            return;
        }

        if (!validate()) {
            return; 
        }

        setLoading(true);
        try {
            const payload = {
                user: uid,
                reason: complaintReason,
                category: complaintCategory, 
            };

            const response = await axios.post("/complain/submit", payload);
            
            setComplaintStatus({ success: true, message: `Complaint ID ${response.data.complaintId} submitted as ${response.data.status}.` });
            setComplaintReason(''); // Clear form
            setComplaintCategory(''); // Clear category
            fetchComplaints(); // Refresh history
            
        } catch (error) {
            setComplaintStatus({ success: false, message: `Submission failed. Details: ${error.message}` });
            console.error("Submission error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to truncate MongoDB ID for display
    const truncateId = (id) => id.substring(0, 4) + '...' + id.substring(id.length - 4);

    const styles = {
        container: { 
            padding: '60px 40px', 
            maxWidth: '900px', 
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
        formSection: { 
            marginBottom: '30px', 
            padding: '30px', 
            border: '2px solid #dee2e6', 
            borderRadius: '12px', 
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
        label: {
            display: 'block',
            marginBottom: '8px',
            marginTop: '15px',
            fontWeight: '600',
            color: '#2c3e50',
            fontSize: '14px',
        },
        textarea: (isError) => ({ 
            width: '100%', 
            minHeight: '120px', 
            padding: '12px', 
            borderRadius: '8px', 
            border: isError ? '2px solid #e74c3c' : '2px solid #e0e0e0', 
            resize: 'vertical',
            fontSize: '14px',
            transition: 'all 0.3s ease',
            backgroundColor: '#fff',
        }),
        select: (isError) => ({ 
            width: '100%', 
            padding: '12px', 
            borderRadius: '8px', 
            border: isError ? '2px solid #e74c3c' : '2px solid #e0e0e0',
            fontSize: '14px',
            transition: 'all 0.3s ease',
            backgroundColor: '#fff',
        }),
        errorText: { 
            color: '#e74c3c', 
            fontSize: '0.85em', 
            marginTop: '5px',
            fontWeight: '500',
        },
        button: { 
            padding: '15px 50px', 
            background: loading ? '#95a5a6' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '10px', 
            cursor: loading ? 'not-allowed' : 'pointer', 
            transition: 'all 0.3s ease',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
        },
        historySection: { 
            padding: '30px', 
            border: '2px solid #dee2e6', 
            borderRadius: '12px', 
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        },
        historyItem: { 
            borderBottom: '1px solid #e9ecef', 
            padding: '20px 0', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            transition: 'background-color 0.2s ease',
        },
        statusBadge: (status) => ({
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '0.85em',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: {
                'Open': '#007bff',
                'In Progress': '#ffc107',
                'Resolved': '#28a745',
                'Closed': '#6c757d',
            }[status] || '#6c757d',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        }),
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}> Customer Complaint Center</h1>
                <p style={{ margin: '10px 0 0 0', opacity: 0.9, fontSize: '16px' }}>Report any issues regarding orders, products, or service quality</p>
            </div>

            {!uid && (
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
                    ⚠️ You must be logged in to submit a complaint.
                </div>
            )}

            {/* --- Complaint Submission Form --- */}
            <div style={styles.formSection}>
                <h2 style={styles.sectionTitle}>File a New Complaint</h2>
                {uid ? (
                    <form onSubmit={handleSubmit}>
                        
                        {/* 1. CATEGORY DROPDOWN (Feature Enhancement) */}
                        <div style={{marginBottom: '15px'}}>
                            <label style={styles.label}>Category (Required):</label>
                            <select
                                value={complaintCategory}
                                onChange={(e) => {setComplaintCategory(e.target.value); setErrors((prev) => ({...prev, category: undefined}));}}
                                required
                                style={styles.select(errors.category)}
                            >
                                <option value="" disabled>-- Select the area of your issue (e.g., Billing) --</option>
                                <option value="Shipping & Delivery">Shipping & Delivery</option>
                                <option value="Product Quality">Product Quality</option>
                                <option value="Billing & Pricing">Billing & Pricing</option>
                                <option value="Customer Service">Customer Service</option>
                                <option value="Technical Issue">Technical Issue (Website/App)</option>
                                <option value="Other">Other</option>
                            </select>
                            {errors.category && <p style={styles.errorText}>⚠️ {errors.category}</p>}
                        </div>
                        
                        {/* 2. REASON TEXTAREA (with Placeholder/Guidance) */}
                        <div style={{marginBottom: '15px'}}>
                            <label style={styles.label}>Reason for Complaint:</label>
                            <textarea
                                value={complaintReason}
                                onChange={(e) => {setComplaintReason(e.target.value); setErrors((prev) => ({...prev, reason: undefined}));}}
                                style={styles.textarea(errors.reason)}
                                required
                                disabled={loading}
                                maxLength={500} // Max Length enforced
                                placeholder={
                                            `Please detail your issue and include relevant IDs (Order #, Item ID, etc.):\n\n` +
                                            `• Order #1234 delivered late, item arrived damaged.\n` +
                                            `• CS agent Moiz Ahmed (ID 123) was rude or unhelpful.\n` +
                                            `• Requesting refund/replacement for defective product.\n` 
                                            // `• Website crashes when attempting checkout.\n` 
                                            // `• Invoice pricing does not match advertised price.`
                                        }
                            />
                            <small style={{ color: '#666', fontSize: '12px' }}>{500 - complaintReason.length} characters remaining</small>
                            {errors.reason && <p style={styles.errorText}>⚠️ {errors.reason}</p>}
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '25px' }}>
                            <button type="submit" style={styles.button} disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Complaint'}
                            </button>
                        </div>
                        
                        {complaintStatus && (
                            <div style={{
                                marginTop: '20px',
                                padding: '15px',
                                borderRadius: '8px',
                                border: `2px solid ${complaintStatus.success ? '#28a745' : '#e74c3c'}`,
                                background: complaintStatus.success 
                                    ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' 
                                    : 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                                color: complaintStatus.success ? '#155724' : '#721c24',
                                fontWeight: 'bold',
                                textAlign: 'center',
                            }}>
                                {complaintStatus.success ? '✅ ' : '❌ '}{complaintStatus.message}
                            </div>
                        )}
                    </form>
                ) : null}
            </div>

            {/* --- Complaint History --- */}
            <div style={styles.historySection}>
                <h2 style={styles.sectionTitle}> My Complaint History ({history.length})</h2>
                {historyLoading ? (
                    <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>⏳ Loading history...</p>
                ) : (
                    <div style={{marginTop: '15px'}}>
                        {history.length > 0 ? (
                            history.map((item) => (
                                <div key={item._id} style={styles.historyItem}>
                                    <div style={{flex: 3}}>
                                        <p style={{margin: '0 0 8px 0', fontWeight: 'bold', color: '#2c3e50', fontSize: '15px'}}>{item.reason.substring(0, 80)}...</p>
                                        <small style={{ color: '#666', fontSize: '13px' }}>🆔 {truncateId(item._id)} | 📁 {item.category} | 📅 {new Date(item.createdAt).toLocaleDateString()}</small>
                                    </div>
                                    <div style={{flex: 1, textAlign: 'right'}}>
                                        <span style={styles.statusBadge(item.status)}>{item.status}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ textAlign: 'center', color: '#666', padding: '30px', fontSize: '15px' }}>📭 You have no current or past complaints on file.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Complain;