
import React from 'react';
// NOTE: We are NOT importing the prediction logic here, as this is purely for display/explanation.

// --- STATIC DATA FOR DISPLAY ---

// 1. Simulated Risk Distribution Data (For Pie Chart visualization)
const RISK_DISTRIBUTION = [
    { tier: 'High Risk (>65%)', count: 500, color: '#e74c3c' },
    { tier: 'Medium Risk (30-65%)', count: 2500, color: '#f39c12' },
    { tier: 'Low Risk (<30%)', count: 7000, color: '#2ecc71' },
];

// 2. Data for the Action Guide Table
const ACTION_GUIDE = [
    { 
        tier: 'High Risk', 
        range: '$\geq 65\%$', 
        intervention: '**Immediate Intervention.** Assign a retention specialist. Intervention must target the user\'s Top Risk Factor (e.g., offer free support if Complain is High).'
    },
    { 
        tier: 'Medium Risk', 
        range: '$30\% - 64.99\%$', 
        intervention: '**Monitor & Automate.** Use automated marketing (e.g., small discount) to re-engage, focusing on products matching their `PreferedOrderCat`.'
    },
    { 
        tier: 'Low Risk', 
        range: '$< 30\%$', 
        intervention: '**Maintain.** Do nothing intrusive. Continue standard email marketing and track for future risk spikes.'
    },
];

// 3. Data for the Data Imbalance/Feature Focus
const FEATURE_FOCUS = {
    imbalanceRatio: "9:1 (Non-Churn:Churn)",
    imbalanceExplanation: "Churn is a **rare event**. The XGBoost model is intentionally tuned (via parameters like `scale_pos_weight`) to handle this imbalance by heavily weighting the rare Churn class. This prioritizes **Recall** to avoid missing true churners.",
    dataFocus: [
        { 
            name: "Recency/Tenure", 
            impact: "Most predictive. Low `Tenure` (new users) and high `DaySinceLastOrder` (disengaged users) signal major risk."
        },
        { 
            name: "Spending Hike", 
            impact: "The `OrderAmountHikeFromlastYear` feature's integer percentage value captures spending deceleration, which is a key leading indicator of dissatisfaction."
        },
    ]
};

// --- HELPER COMPONENTS (Simulating Charts) ---

// Component 1: User Base Risk Distribution Pie Chart (Enhanced)
const RiskPieChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.count, 0);
    const pieSegments = data.map(item => ({ 
        ...item, 
        percentage: (item.count / total) * 100 
    }));
    
    const conicGradientStops = [];
    let currentStop = 0;
    pieSegments.forEach(segment => {
        const nextStop = currentStop + segment.percentage;
        conicGradientStops.push(`${segment.color} ${currentStop}% ${nextStop}%`);
        currentStop = nextStop;
    });

    return (
        <div style={styles.chartContainer}>
            <h4 style={styles.chartTitle}>📊 User Base Risk Distribution</h4>
            <p style={styles.chartSubtitle}>Total Users: <strong>{total.toLocaleString()}</strong></p>
            
            <div style={styles.pieChartWrapper}>
                <div style={{...styles.piePlaceholder, background: `conic-gradient(${conicGradientStops.join(', ')})`}}>
                    <div style={styles.pieCenter}>
                        <div style={styles.pieCenterText}>{total.toLocaleString()}</div>
                        <div style={styles.pieCenterLabel}>Total Users</div>
                    </div>
                </div>
            </div>

            <div style={styles.pieLegend}>
                {pieSegments.map((item) => (
                    <div key={item.tier} style={styles.legendItem}>
                        <span style={{...styles.legendDot, backgroundColor: item.color}}></span>
                        <div style={styles.legendContent}>
                            <span style={{...styles.legendTier, color: item.color}}>{item.tier}</span>
                            <span style={styles.legendStats}>
                                {item.count.toLocaleString()} users ({Math.round(item.percentage)}%)
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


/**
 * ------------------------------------------------------------------
 * CORE COMPONENT: ChurnRiskDashboard
 * ------------------------------------------------------------------
 */
const ChurnRiskDashboard = () => { 
    
    return (
        <div style={styles.pageContainer}>
            <h1 style={styles.mainTitle}>🎯 Customer Churn Risk Dashboard</h1>
            <p style={styles.mainSubtitle}>
                This dashboard provides a **Global Overview** of the customer base, detailing the distribution of risk and the model's data interpretation guidelines.
            </p>

            {/* --------------------------- 1. USER BASE RISK DISTRIBUTION (CHART) --------------------------- */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>1. User Base Risk and Action Queue</h2>
                <div style={styles.chartWrapper}>
                    <RiskPieChart data={RISK_DISTRIBUTION} />

                    {/* Action Queue Sidebar (Enhanced) */}
                    <div style={styles.actionQueueBox}>
                        <h4 style={styles.actionQueueTitle}>🚨 Priority Action Queue</h4>
                        <div style={styles.priorityCard}>
                            <div style={styles.priorityHeader}>
                                <span style={styles.priorityIcon}>🔴</span>
                                <div>
                                    <div style={styles.priorityTier}>High Risk Users</div>
                                    <div style={styles.priorityCount}>{RISK_DISTRIBUTION[0].count.toLocaleString()} customers</div>
                                </div>
                            </div>
                            <p style={styles.priorityDescription}>
                                Immediate intervention required. These customers have a churn probability ≥65% and need personalized retention strategies.
                            </p>
                        </div>
                        <div style={styles.priorityCard}>
                            <div style={styles.priorityHeader}>
                                <span style={styles.priorityIcon}>🟡</span>
                                <div>
                                    <div style={styles.priorityTier}>Medium Risk Users</div>
                                    <div style={styles.priorityCount}>{RISK_DISTRIBUTION[1].count.toLocaleString()} customers</div>
                                </div>
                            </div>
                            <p style={styles.priorityDescription}>
                                Proactive engagement recommended. Automated marketing campaigns can help re-engage these customers.
                            </p>
                        </div>
                        <div style={styles.priorityCard}>
                            <div style={styles.priorityHeader}>
                                <span style={styles.priorityIcon}>🟢</span>
                                <div>
                                    <div style={styles.priorityTier}>Low Risk Users</div>
                                    <div style={styles.priorityCount}>{RISK_DISTRIBUTION[2].count.toLocaleString()} customers</div>
                                </div>
                            </div>
                            <p style={styles.priorityDescription}>
                                Maintain standard service. Continue monitoring for any risk spikes in the future.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* --------------------------- 2. ACTION GUIDE TABLE --------------------------- */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>2. Actionable Risk Tier Guide</h2>
                <p style={styles.sectionDescription}>
                    The raw probability is converted into these tiers to provide clear, actionable business responses.
                </p>
                <div style={styles.gridTable}>
                    <div style={styles.gridHeader}>Risk Tier</div>
                    <div style={styles.gridHeader}>Probability Range</div>
                    <div style={styles.gridHeader}>Recommended Intervention (What to Do)</div>

                    {ACTION_GUIDE.map((item, index) => (
                        <React.Fragment key={index}>
                            <div style={{ ...styles.gridCell, ...styles[`${item.tier.split(' ')[0].toLowerCase()}RiskColor`] }}>{item.tier}</div>
                            <div style={styles.gridCell}>{item.range}</div>
                            <div style={styles.gridCell} dangerouslySetInnerHTML={{ __html: item.intervention }} />
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* --------------------------- 3. DATA & FEATURE FOCUS EXPLANATION --------------------------- */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>3. Data Imbalance and Core Feature Focus</h2>
                
                <div style={styles.dataFocusWrapper}>
                    <div style={styles.dataBox}>
                        <h3 style={styles.sectionSubtitle}>Model Reliability and Data Imbalance</h3>
                        <p style={styles.imbalanceText}>
                            **Data Imbalance ($90\%$ Non-Churn vs. $10\%$ Churn):** The XGBoost model is specifically tuned to overcome this challenge. By weighting the minority (Churn) class more heavily, we achieve a high **Recall ($88.4\%$)**, ensuring we minimize missed churners, which is critical for retention.
                        </p>
                        <div style={styles.imbalanceChartContainer}>
                            <div style={{...styles.imbalanceBar, width: '90%', backgroundColor: '#2ecc71'}}>Non-Churners (90%)</div>
                            <div style={{...styles.imbalanceBar, width: '10%', backgroundColor: '#e74c3c'}}>Churners (10%)</div>
                        </div>
                        <div style={styles.imbalanceExplanation}>
                            <p><strong>Why This Matters:</strong></p>
                            <ul style={styles.explanationList}>
                                <li>Churn is a rare event - only 10% of customers churn</li>
                                <li>Standard models would predict "No Churn" for everyone (90% accuracy but useless)</li>
                                <li>We use Random Oversampling to balance training data</li>
                                <li>High Recall ensures we catch most churners (minimize False Negatives)</li>
                                <li>This is more important than Precision for business retention goals</li>
                            </ul>
                        </div>
                    </div>

                    <div style={styles.dataBox}>
                        <h3 style={styles.sectionSubtitle}>Key Predictive Data Focus</h3>
                        <ul style={styles.list}>
                            {FEATURE_FOCUS.dataFocus.map((feature, index) => (
                                <li key={index} style={{ marginBottom: '10px' }}>
                                    <strong>{feature.name}:</strong> {feature.impact}
                                </li>
                            ))}
                        </ul>
                        <div style={styles.featureInsights}>
                            <p><strong>Key Insights from Feature Analysis:</strong></p>
                            <ul style={styles.explanationList}>
                                <li><strong>Tenure (34.5% importance):</strong> New customers (low tenure) are at highest risk</li>
                                <li><strong>DaySinceLastOrder (14.8%):</strong> Customers who haven't ordered recently are likely to churn</li>
                                <li><strong>CashbackAmount (15.4%):</strong> Lower cashback correlates with higher churn risk</li>
                                <li><strong>Complain_1 (11%):</strong> Customers who complained are significantly more likely to churn</li>
                                <li><strong>SatisfactionScore (10.5%):</strong> Lower satisfaction scores predict churn</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* --------------------------- 4. BUSINESS IMPACT & INTERPRETATION --------------------------- */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>4. Business Impact & Model Interpretation</h2>
                
                <div style={styles.businessGrid}>
                    <div style={styles.businessCard}>
                        <h3 style={styles.businessTitle}>💡 How to Read Predictions</h3>
                        <div style={styles.businessContent}>
                            <p><strong>Churn Probability:</strong> A percentage (0-100%) indicating likelihood of churn</p>
                            <p><strong>Risk Tiers:</strong></p>
                            <ul style={styles.businessList}>
                                <li><strong style={{color: '#c0392b'}}>High Risk (≥65%):</strong> Immediate action required</li>
                                <li><strong style={{color: '#f39c12'}}>Medium Risk (30-65%):</strong> Proactive engagement needed</li>
                                <li><strong style={{color: '#2ecc71'}}>Low Risk (&lt;30%):</strong> Standard monitoring</li>
                            </ul>
                            <p><strong>Action Priority:</strong> Focus resources on High Risk customers first</p>
                        </div>
                    </div>

                    <div style={styles.businessCard}>
                        <h3 style={styles.businessTitle}>📊 Model Confidence & Limitations</h3>
                        <div style={styles.businessContent}>
                            <p><strong>Model Strengths:</strong></p>
                            <ul style={styles.businessList}>
                                <li>High Recall (88.4%) - catches most churners</li>
                                <li>Good ROC AUC (96.5%) - excellent discrimination</li>
                                <li>Handles imbalanced data effectively</li>
                                <li>Interpretable feature importance</li>
                            </ul>
                            <p><strong>Limitations:</strong></p>
                            <ul style={styles.businessList}>
                                <li>Precision (74.1%) - some false positives</li>
                                <li>Based on historical patterns - may miss new trends</li>
                                <li>Requires regular retraining with new data</li>
                            </ul>
                        </div>
                    </div>

                    <div style={styles.businessCard}>
                        <h3 style={styles.businessTitle}>🎯 Recommended Actions by Risk Tier</h3>
                        <div style={styles.businessContent}>
                            <div style={styles.actionCard}>
                                <strong style={{color: '#c0392b'}}>High Risk Customers:</strong>
                                <ul style={styles.businessList}>
                                    <li>Personalized retention specialist contact</li>
                                    <li>Targeted offers based on top risk factors</li>
                                    <li>Immediate follow-up within 24 hours</li>
                                    <li>Address specific complaints or issues</li>
                                </ul>
                            </div>
                            <div style={styles.actionCard}>
                                <strong style={{color: '#f39c12'}}>Medium Risk Customers:</strong>
                                <ul style={styles.businessList}>
                                    <li>Automated re-engagement campaigns</li>
                                    <li>Product recommendations based on preferences</li>
                                    <li>Moderate discount offers</li>
                                    <li>Monthly check-ins</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --------------------------- 5. DATA PREPROCESSING EXPLANATION --------------------------- */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>5. Data Preprocessing Pipeline</h2>
                <p style={styles.sectionDescription}>
                    Understanding how raw data was transformed before model training is crucial for explaining model behavior.
                </p>
                
                <div style={styles.pipelineContainer}>
                    <div style={styles.pipelineStep}>
                        <div style={styles.pipelineNumber}>1</div>
                        <div style={styles.pipelineContent}>
                            <h4 style={styles.pipelineTitle}>Data Cleaning</h4>
                            <ul style={styles.pipelineList}>
                                <li>Removed CustomerID (identifier, not predictive)</li>
                                <li>Standardized categorical values (Mobile → Mobile Phone, CC → Credit Card)</li>
                                <li>Converted data types (CityTier, Complain to object for proper encoding)</li>
                            </ul>
                        </div>
                    </div>

                    <div style={styles.pipelineStep}>
                        <div style={styles.pipelineNumber}>2</div>
                        <div style={styles.pipelineContent}>
                            <h4 style={styles.pipelineTitle}>Missing Value Imputation</h4>
                            <ul style={styles.pipelineList}>
                                <li>Used KNN Imputer (k=5 neighbors) for numeric columns</li>
                                <li>Imputed: DaySinceLastOrder, OrderAmountHikeFromlastYear, Tenure, OrderCount, CouponUsed, HourSpendOnApp, WarehouseToHome</li>
                                <li>KNN preserves relationships between features better than mean/median</li>
                            </ul>
                        </div>
                    </div>

                    <div style={styles.pipelineStep}>
                        <div style={styles.pipelineNumber}>3</div>
                        <div style={styles.pipelineContent}>
                            <h4 style={styles.pipelineTitle}>Feature Engineering</h4>
                            <ul style={styles.pipelineList}>
                                <li>Created Complain_Str from Complain (0="No Complain", 1="Complain")</li>
                                <li>Renamed Complain_Raw to Complain_1 for model compatibility</li>
                                <li>All numeric features kept as-is (no scaling needed for tree-based models)</li>
                            </ul>
                        </div>
                    </div>

                    <div style={styles.pipelineStep}>
                        <div style={styles.pipelineNumber}>4</div>
                        <div style={styles.pipelineContent}>
                            <h4 style={styles.pipelineTitle}>One-Hot Encoding</h4>
                            <ul style={styles.pipelineList}>
                                <li>Encoded categorical variables: PreferredLoginDevice, CityTier, PreferredPaymentMode, Gender, PreferedOrderCat, MaritalStatus, Complain_Str</li>
                                <li>Used drop_first=False to keep all categories</li>
                                <li>Result: 27 total features (10 numeric + 17 categorical dummies)</li>
                            </ul>
                        </div>
                    </div>

                    <div style={styles.pipelineStep}>
                        <div style={styles.pipelineNumber}>5</div>
                        <div style={styles.pipelineContent}>
                            <h4 style={styles.pipelineTitle}>Train-Test Split & Balancing</h4>
                            <ul style={styles.pipelineList}>
                                <li>Stratified split: 80% train (4,504 samples), 20% test (1,126 samples)</li>
                                <li>Random Oversampling applied ONLY to training set</li>
                                <li>Test set kept with original distribution for realistic evaluation</li>
                                <li>Final training set: 7,492 samples (balanced 50-50)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ height: '20px' }}></div>
        </div>
    );
};

// --- STYLES (Enhanced with modern design) ---
const styles = {
    // --- Container Styles ---
    pageContainer: { 
        padding: '30px', 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 
        lineHeight: '1.6', 
        color: '#333', 
        backgroundColor: '#f8f9fa', 
        minHeight: '100vh', 
        maxWidth: '1400px', 
        margin: '0 auto' 
    },
    mainTitle: { 
        fontSize: '2.2rem', 
        color: '#2c3e50', 
        borderBottom: '3px solid #3498db', 
        paddingBottom: '12px', 
        marginBottom: '10px',
        fontWeight: '700',
    },
    mainSubtitle: { 
        fontSize: '1.1rem', 
        color: '#7f8c8d', 
        marginBottom: '30px',
        lineHeight: '1.8',
    },
    section: { 
        marginBottom: '40px', 
        padding: '25px', 
        border: '1px solid #e0e0e0', 
        borderRadius: '12px', 
        backgroundColor: '#ffffff', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    sectionTitle: { 
        fontSize: '1.6rem', 
        color: '#34495e', 
        marginBottom: '20px',
        fontWeight: '600',
    },
    sectionSubtitle: { 
        fontSize: '1.3rem', 
        color: '#34495e', 
        marginBottom: '15px', 
        borderBottom: '2px solid #ecf0f1', 
        paddingBottom: '10px',
        fontWeight: '600',
    },
    sectionDescription: { 
        color: '#666', 
        marginBottom: '20px',
        fontSize: '0.95rem',
        lineHeight: '1.7',
    },
    // --- Chart/Grid Layouts ---
    chartWrapper: { 
        display: 'flex', 
        gap: '25px', 
        marginTop: '20px', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between' 
    },
    chartContainer: { 
        flexBasis: '48%', 
        minWidth: '350px', 
        padding: '20px', 
        background: '#ffffff', 
        borderRadius: '10px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    chartTitle: {
        fontSize: '1.3rem',
        color: '#2c3e50',
        marginBottom: '10px',
        fontWeight: '600',
    },
    chartSubtitle: {
        fontSize: '0.95rem',
        color: '#7f8c8d',
        marginBottom: '15px',
    },
    actionQueueBox: { 
        flexBasis: '48%', 
        minWidth: '350px', 
        padding: '20px', 
        background: '#ffffff', 
        borderRadius: '10px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    dataFocusWrapper: { 
        display: 'flex', 
        gap: '25px', 
        flexWrap: 'wrap', 
        marginTop: '20px' 
    },
    dataBox: { 
        flex: 1, 
        minWidth: '300px', 
        padding: '20px', 
        background: '#ffffff', 
        borderRadius: '10px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },

    // --- Pie Chart Specific Styles (Enhanced) ---
    pieChartWrapper: { display: 'flex', justifyContent: 'center', margin: '20px 0' },
    piePlaceholder: { 
        height: '200px', 
        width: '200px', 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        border: '4px solid #ffffff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        position: 'relative',
    },
    pieCenter: {
        position: 'absolute',
        textAlign: 'center',
        zIndex: 10,
    },
    pieCenterText: {
        fontSize: '1.8rem',
        fontWeight: '800',
        color: '#2c3e50',
    },
    pieCenterLabel: {
        fontSize: '0.85rem',
        color: '#7f8c8d',
        fontWeight: '500',
    },
    pieLegend: { 
        fontSize: '0.9rem', 
        marginTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    legendItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        transition: 'background-color 0.2s',
    },
    legendDot: {
        display: 'inline-block',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        flexShrink: 0,
    },
    legendContent: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
    },
    legendTier: {
        fontWeight: '600',
        fontSize: '0.95rem',
        marginBottom: '2px',
    },
    legendStats: {
        fontSize: '0.8rem',
        color: '#7f8c8d',
    },
    // --- Action Queue Styles ---
    actionQueueTitle: {
        fontSize: '1.2rem',
        color: '#2c3e50',
        marginBottom: '20px',
        fontWeight: '600',
        borderBottom: '2px solid #ecf0f1',
        paddingBottom: '10px',
    },
    priorityCard: {
        backgroundColor: '#ffffff',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '15px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    priorityHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '10px',
    },
    priorityIcon: {
        fontSize: '1.5rem',
    },
    priorityTier: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '#2c3e50',
    },
    priorityCount: {
        fontSize: '0.85rem',
        color: '#7f8c8d',
        marginTop: '2px',
    },
    priorityDescription: {
        fontSize: '0.9rem',
        color: '#555',
        lineHeight: '1.6',
        margin: '0',
    },
    // --- Imbalance Bar Chart Specific Styles ---
    imbalanceChartContainer: { padding: '10px 0', borderTop: '1px solid #eee', },
    imbalanceBar: { height: '25px', color: 'white', fontWeight: 'bold', textAlign: 'center', lineHeight: '25px', borderRadius: '3px', margin: '3px 0', fontSize: '0.9rem', },
    imbalanceText: { color: '#7f8c8d', fontSize: '0.95rem', },
    // --- Table Styles (Enhanced) ---
    gridTable: { 
        display: 'grid', 
        gridTemplateColumns: '140px 160px auto', 
        border: '1px solid #e0e0e0', 
        borderRadius: '8px', 
        overflow: 'hidden', 
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    gridHeader: { 
        padding: '15px', 
        backgroundColor: '#34495e', 
        color: 'white', 
        fontWeight: '600', 
        textAlign: 'center', 
        borderRight: '1px solid #2c3e50', 
        fontSize: '0.95rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    gridCell: { 
        padding: '15px', 
        borderBottom: '1px solid #f0f0f0', 
        borderRight: '1px solid #f0f0f0', 
        backgroundColor: '#ffffff', 
        fontSize: '0.9rem',
        lineHeight: '1.6',
    },
    highRiskColor: { 
        color: '#c0392b', 
        backgroundColor: '#fef7f7', 
        fontWeight: '600',
        borderLeft: '4px solid #c0392b',
    },
    mediumRiskColor: { 
        color: '#f39c12', 
        backgroundColor: '#fffbe6', 
        fontWeight: '600',
        borderLeft: '4px solid #f39c12',
    },
    lowRiskColor: { 
        color: '#2ecc71', 
        backgroundColor: '#f7fff7', 
        fontWeight: '600',
        borderLeft: '4px solid #2ecc71',
    },
    // --- List Styles ---
    list: { listStyleType: 'disc', paddingLeft: '20px', fontSize: '0.95rem', lineHeight: '1.8' },
    highRiskList: { listStyleType: 'none', paddingLeft: '10px', margin: '10px 0 0 0' },
    highRiskItem: { color: '#c0392b', fontSize: '0.9rem', margin: '5px 0' },
    explanationList: { 
        listStyleType: 'disc', 
        paddingLeft: '20px', 
        fontSize: '0.9rem', 
        lineHeight: '1.8',
        marginTop: '10px',
    },
    imbalanceExplanation: {
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
    },
    featureInsights: {
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
    },
    // --- Business Impact Styles ---
    businessGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px',
        marginTop: '20px',
    },
    businessCard: {
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    businessTitle: {
        fontSize: '1.2rem',
        color: '#2c3e50',
        marginBottom: '15px',
        fontWeight: '600',
        borderBottom: '2px solid #ecf0f1',
        paddingBottom: '10px',
    },
    businessContent: {
        fontSize: '0.9rem',
        color: '#555',
        lineHeight: '1.8',
    },
    businessList: {
        listStyleType: 'disc',
        paddingLeft: '20px',
        marginTop: '10px',
        lineHeight: '1.8',
    },
    actionCard: {
        marginTop: '15px',
        padding: '12px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
    },
    // --- Pipeline Styles ---
    pipelineContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginTop: '20px',
    },
    pipelineStep: {
        display: 'flex',
        gap: '20px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        border: '1px solid #e9ecef',
        alignItems: 'flex-start',
    },
    pipelineNumber: {
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        backgroundColor: '#3498db',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        fontWeight: '700',
        flexShrink: 0,
    },
    pipelineContent: {
        flex: 1,
    },
    pipelineTitle: {
        fontSize: '1.1rem',
        color: '#2c3e50',
        marginBottom: '10px',
        fontWeight: '600',
    },
    pipelineList: {
        listStyleType: 'disc',
        paddingLeft: '20px',
        fontSize: '0.9rem',
        color: '#555',
        lineHeight: '1.8',
    },
};

export default ChurnRiskDashboard;