import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const PROFILE_SAVE_ENDPOINT = '/profile/save';

const Survey = () => {
    const loggedInUser = useSelector((state) => state.user.currentUser?.user);
    const uid = loggedInUser?.uid || loggedInUser?._id;

    const [profileData, setProfileData] = useState({
        customerId: uid || '',
        gender: '',
        maritalStatus: '',
        age: 20,
        satisfactionScore: 4,
        monthlySpending: 300,
        discountImportance: '',
        preferredCategoriesSurvey: [],
        communicationPreference: '',
        educationLevel: '',              
        shoppingFrequency: '',          
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);

    useEffect(() => {
        if (uid && profileData.customerId !== uid) {
            setProfileData((prev) => ({ ...prev, customerId: uid }));
        }
    }, [uid]);

    const validate = () => {
        const newErrors = {};

        if (!profileData.gender) newErrors.gender = "Gender is required.";
        if (!profileData.maritalStatus) newErrors.maritalStatus = "Marital Status is required.";
        if (!profileData.discountImportance) newErrors.discountImportance = "Discount Importance is required.";
        if (!profileData.communicationPreference) newErrors.communicationPreference = "Communication Preference is required.";
        if (!profileData.educationLevel) newErrors.educationLevel = "Education field is required.";
        if (!profileData.shoppingFrequency) newErrors.shoppingFrequency = "Shopping Frequency is required.";

        if (profileData.age < 18) newErrors.age = "Age must be 18 or older.";
        if (profileData.monthlySpending < 0) newErrors.monthlySpending = "Spending cannot be negative.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === "preferredCategoriesSurvey") {
            let updated = profileData.preferredCategoriesSurvey;
            updated = checked
                ? [...updated, value]
                : updated.filter((item) => item !== value);

            setProfileData({ ...profileData, preferredCategoriesSurvey: updated });
        } else {
            setProfileData({
                ...profileData,
                [name]: type === "number" ? Number(value) : value,
            });
        }

        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmissionResult(null);

        if (!validate()) {
            window.scrollTo(0, 0);
            return;
        }

        if (!profileData.customerId || profileData.customerId.startsWith("GUEST")) {
            alert("You must be logged in to submit the survey.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('/customer/save', profileData);

            setSubmissionResult({
                success: true,
                profileId: response.data.profileId,
            });
        } catch (err) {
            setSubmissionResult({
                success: false,
                message: err.response?.data?.message || "Server error",
            });
        } finally {
            setLoading(false);
        }
    };

    const styles = {
        container: {
            padding: "60px 40px",
            maxWidth: "900px",
            margin: "40px auto",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
            borderRadius: "16px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
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
        fieldset: {
            border: "2px solid #dee2e6",
            borderRadius: "12px",
            padding: "30px",
            marginBottom: "25px",
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        },
        legend: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '16px',
        },
        label: { 
            display: "block", 
            marginBottom: "8px", 
            marginTop: "15px",
            fontWeight: "600",
            color: "#2c3e50",
            fontSize: "14px",
        },
        select: (isError) => ({
            width: "100%",
            padding: "12px",
            border: isError ? "2px solid #e74c3c" : "2px solid #e0e0e0",
            borderRadius: "8px",
            fontSize: "14px",
            transition: "all 0.3s ease",
            backgroundColor: "#fff",
        }),
        input: (isError) => ({
            width: "100%",
            padding: "12px",
            border: isError ? "2px solid #e74c3c" : "2px solid #e0e0e0",
            borderRadius: "8px",
            fontSize: "14px",
            transition: "all 0.3s ease",
            backgroundColor: "#fff",
        }),
        error: { 
            color: "#e74c3c", 
            fontSize: "0.85em",
            marginTop: "5px",
            fontWeight: "500",
        },
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}> Customer Profile Survey</h1>
                <p style={{ margin: '10px 0 0 0', opacity: 0.9, fontSize: '16px' }}>Help us serve you better by completing this survey</p>
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
                    ⚠️ You must be logged in to submit this survey.
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <fieldset style={styles.fieldset}>
                    <legend style={styles.legend}>User Details & Preferences</legend>

                    {/* AGE */}
                    <label style={styles.label}>Q1: Age (Required)</label>
                    <input
                        type="number"
                        name="age"
                        value={profileData.age}
                        onChange={handleChange}
                        style={styles.input(errors.age)}
                        min="18"
                    />
                    {errors.age && <p style={styles.error}>⚠️ {errors.age}</p>}

                    {/* GENDER */}
                    <label style={styles.label}>Q2: Gender (Required)</label>
                    <select
                        name="gender"
                        value={profileData.gender}
                        onChange={handleChange}
                        style={styles.select(errors.gender)}
                    >
                        <option value="">-- Select --</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                    {errors.gender && <p style={styles.error}>⚠️ {errors.gender}</p>}

                    {/* MARITAL STATUS */}
                    <label style={styles.label}>Q3: Marital Status (Required)</label>
                    <select
                        name="maritalStatus"
                        value={profileData.maritalStatus}
                        onChange={handleChange}
                        style={styles.select(errors.maritalStatus)}
                    >
                        <option value="">-- Select --</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                    </select>
                    {errors.maritalStatus && <p style={styles.error}>⚠️ {errors.maritalStatus}</p>}

                    {/* EDUCATION LEVEL */}
                    <label style={styles.label}>Q4: Education Level (Required)</label>
                    <select
                        name="educationLevel"
                        value={profileData.educationLevel}
                        onChange={handleChange}
                        style={styles.select(errors.educationLevel)}
                    >
                        <option value="">-- Select --</option>
                        <option value="High School">High School</option>
                        <option value="Bachelor">Bachelor</option>
                        <option value="Master">Master</option>
                        <option value="PhD">PhD</option>
                    </select>
                    {errors.educationLevel && (
                        <p style={styles.error}>⚠️ {errors.educationLevel}</p>
                    )}

                    {/* SATISFACTION */}
                    <label style={styles.label}>Q5: Satisfaction Score (1-5)</label>
                    <input
                        type="number"
                        name="satisfactionScore"
                        min="1"
                        max="5"
                        value={profileData.satisfactionScore}
                        onChange={handleChange}
                        style={styles.input()}
                    />

                    {/* SPENDING */}
                    <label style={styles.label}>Q6: Monthly Spending</label>
                    <input
                        type="number"
                        name="monthlySpending"
                        value={profileData.monthlySpending}
                        onChange={handleChange}
                        style={styles.input(errors.monthlySpending)}
                    />
                    {errors.monthlySpending && (
                        <p style={styles.error}>⚠️ {errors.monthlySpending}</p>
                    )}

                    {/* DISCOUNT IMPORTANCE */}
                    <label style={styles.label}>Q7: How Important Are Discounts? (Required)</label>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                        {["Low", "Medium", "High"].map((level) => (
                            <label key={level} style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                padding: '10px 20px',
                                border: profileData.discountImportance === level ? '2px solid #667eea' : '2px solid #e0e0e0',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: profileData.discountImportance === level ? '#f0f4ff' : 'white',
                                transition: 'all 0.3s ease',
                            }}>
                                <input
                                    type="radio"
                                    name="discountImportance"
                                    value={level}
                                    checked={profileData.discountImportance === level}
                                    onChange={handleChange}
                                    style={{ marginRight: '8px' }}
                                />
                                {level}
                            </label>
                        ))}
                    </div>
                    {errors.discountImportance && (
                        <p style={styles.error}>⚠️ {errors.discountImportance}</p>
                    )}

                    {/* COMMUNICATION PREFERENCE */}
                    <label style={styles.label}>Q8: Preferred Communication (Required)</label>
                    <select
                        name="communicationPreference"
                        value={profileData.communicationPreference}
                        onChange={handleChange}
                        style={styles.select(errors.communicationPreference)}
                    >
                        <option value="">-- Select --</option>
                        <option value="Email">Email</option>
                        <option value="SMS">SMS</option>
                        <option value="Whatsapp">Whatsapp</option>
                        <option value="App Push Notifications">App Notification</option>   
                    </select>
                    {errors.communicationPreference && (
                        <p style={styles.error}>⚠️ {errors.communicationPreference}</p>
                    )}

                    {/* SHOPPING FREQUENCY */}
                    <label style={styles.label}>Q9: How Often Do You Shop Online? (Required)</label>
                    <select
                        name="shoppingFrequency"
                        value={profileData.shoppingFrequency}
                        onChange={handleChange}
                        style={styles.select(errors.shoppingFrequency)}
                    >
                        <option value="">-- Select --</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Yearly">Yearly</option>
                    </select>
                    {errors.shoppingFrequency && (
                        <p style={styles.error}>⚠️ {errors.shoppingFrequency}</p>
                    )}

                    {/* CATEGORIES */}
                    <label style={styles.label}>Q10: Favorite Shopping Categories</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: '10px' }}>
                        {["Electronics", "Apparel", "Grocery", "Books", "Furniture", "Beauty"].map(
                            (cat) => (
                                <label key={cat} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '10px 18px',
                                    border: profileData.preferredCategoriesSurvey.includes(cat) ? '2px solid #667eea' : '2px solid #e0e0e0',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: profileData.preferredCategoriesSurvey.includes(cat) ? '#f0f4ff' : 'white',
                                    transition: 'all 0.3s ease',
                                }}>
                                    <input
                                        type="checkbox"
                                        name="preferredCategoriesSurvey"
                                        value={cat}
                                        checked={profileData.preferredCategoriesSurvey.includes(cat)}
                                        onChange={handleChange}
                                        style={{ marginRight: '8px' }}
                                    />
                                    {cat}
                                </label>
                            )
                        )}
                    </div>
                </fieldset>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: "15px 50px",
                            background: loading ? '#95a5a6' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: "white",
                            borderRadius: "10px",
                            border: "none",
                            fontSize: "16px",
                            fontWeight: "bold",
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
                            transition: "all 0.3s ease",
                        }}
                    >
                        {loading ? "⏳ Saving..." : "Submit Survey"}
                    </button>
                </div>
            </form>

            {submissionResult && (
                <div
                    style={{
                        marginTop: "30px",
                        padding: "25px",
                        borderRadius: "12px",
                        border: `2px solid ${
                            submissionResult.success ? "#28a745" : "#e74c3c"
                        }`,
                        background: submissionResult.success
                            ? "linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)"
                            : "linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)",
                        textAlign: 'center',
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                >
                    {submissionResult.success ? (
                        <>
                            <h3 style={{ color: '#155724', fontSize: '24px', margin: '0 0 10px 0' }}>🎉 Survey Saved Successfully!</h3>
                            <p style={{ color: '#155724', margin: 0 }}>Thank you for your valuable feedback!</p>
                        </>
                    ) : (
                        <>
                            <h3 style={{ color: '#721c24', fontSize: '24px', margin: '0 0 10px 0' }}>❌ Failed to Save</h3>
                            <p style={{ color: '#721c24', margin: 0 }}>{submissionResult.message}</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Survey;
