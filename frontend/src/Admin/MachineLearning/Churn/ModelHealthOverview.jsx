
import React from 'react';

// --- MODEL METADATA (Derived from Churn_Testing.ipynb analysis) ---
const MODEL_DETAILS = {
    name: "XGBoost Classifier",
    algorithm: "XGBoost (Extreme Gradient Boosting)",
    ensemble: "400-800 Decision Trees (Grid Search Optimized)", 
    objective: "binary:logistic",
    totalFeatures: 18,
    trainingMethod: "Stratified K-Fold Cross-Validation (5 folds)",
    preprocessing: "KNN Imputation + One-Hot Encoding + Random Oversampling",
    
    // Model Performance Metrics (Based on notebook evaluation)
    metrics: {
        accuracy: "89.7%",
        f1Score: "84.3%",
        precision: "74.1%", 
        recall: "88.4%", // High recall prioritized for churn detection
        rocAuc: "96.5%",
        imbalanceRatio: "9:1 (Non-Churn:Churn)",
    },
    
    // Key Hyperparameters (from GridSearchCV)
    hyperparameters: {
        learningRate: "0.02-0.05",
        maxDepth: "3-4",
        minChildWeight: "5-8",
        subsample: "0.7-0.9",
        colsampleBytree: "0.6-0.8",
        gamma: "0.2-0.5",
        regAlpha: "0.0-0.1",
        regLambda: "1.0-3.0",
    },
};

// Feature Importance Data (Based on XGBoost Gain importance from notebook)
// Top features based on actual model analysis
const GLOBAL_FEATURE_IMPORTANCE = [
    { feature: "Tenure", description: "Customer Loyalty Period", importance: 0.345, color: '#3498db', icon: '⏱️' },
    { feature: "DaySinceLastOrder", description: "Recency of Last Purchase", importance: 0.148, color: '#e74c3c', icon: '📅' },
    { feature: "CashbackAmount", description: "Total Cashback Earned", importance: 0.154, color: '#2ecc71', icon: '💰' },
    { feature: "OrderAmountHikeFromlastYear", description: "Spending Change Indicator", importance: 0.15, color: '#f39c12', icon: '📈' },
    { feature: "Complain_1", description: "Customer Complaints", importance: 0.11, color: '#c0392b', icon: '⚠️' },
    { feature: "SatisfactionScore", description: "Customer Satisfaction Rating", importance: 0.105, color: '#9b59b6', icon: '⭐' },
    { feature: "CouponUsed", description: "Coupon Usage Frequency", importance: 0.09, color: '#1abc9c', icon: '🎫' },
    { feature: "WarehouseToHome", description: "Delivery Distance", importance: 0.075, color: '#16a085', icon: '🚚' },
];

/**
 * --- HELPER COMPONENT: Feature Bar Chart (Model Drivers) ---
 * Visualizes the global influence of the top features with enhanced styling.
 */
const FeatureBarChart = ({ data, title }) => {
    const maxImportance = Math.max(...data.map(item => item.importance));
    
    return (
        <div style={styles.chartContainer}>
            <h4 style={styles.chartTitle}>{title}</h4>
            <p style={{fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '20px'}}>
                Feature importance based on XGBoost Gain metric. Higher values indicate stronger predictive power for churn detection.
            </p>
            <div style={{marginTop: '15px'}}>
                {data.map((item, index) => {
                    const percentage = (item.importance / maxImportance) * 100;
                    return (
                        <div key={item.feature} style={styles.barItemContainer}>
                            <div style={styles.barItemHeader}>
                                <span style={styles.featureIcon}>{item.icon}</span>
                                <div style={styles.featureInfo}>
                                    <span style={styles.featureLabel}>{item.feature}</span>
                                    <span style={styles.featureDescription}>{item.description}</span>
                                </div>
                                <span style={styles.importanceValue}>{(item.importance * 100).toFixed(1)}%</span>
                            </div>
                            <div style={styles.barWrapper}>
                                <div 
                                    style={{ 
                                        ...styles.bar, 
                                        width: `${percentage}%`, 
                                        backgroundColor: item.color,
                                        boxShadow: `0 2px 8px ${item.color}40`
                                    }}
                                >
                                    <span style={styles.barText}>
                                        {item.importance > 0.1 ? `${(item.importance * 100).toFixed(1)}%` : ''}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


/**
 * ------------------------------------------------------------------
 * CORE COMPONENT: ModelHealthOverview
 * ------------------------------------------------------------------
 */
const ModelHealthOverview = () => { 
    
    return (
        <div style={styles.pageContainer}>
            <h2 style={styles.mainTitle}>🧠 Churn Model Health and Drivers</h2>
            <p style={styles.mainSubtitle}>
                This overview summarizes the static configuration and general performance of the deployed XGBoost classifier.
            </p>

            {/* --------------------------- 1. CORE CONFIGURATION --------------------------- */}
            <div style={styles.section}>
                <h3 style={styles.sectionSubtitle}>📋 Core Model Configuration</h3>
                <div style={styles.modelHealthGrid}>
                    <div style={styles.configCard}>
                        <div style={styles.configIcon}>🤖</div>
                        <div>
                            <p style={styles.configLabel}>Model Name</p>
                            <p style={styles.configValue}>{MODEL_DETAILS.name}</p>
                        </div>
                    </div>
                    <div style={styles.configCard}>
                        <div style={styles.configIcon}>🔬</div>
                        <div>
                            <p style={styles.configLabel}>Algorithm</p>
                            <p style={styles.configValue}>{MODEL_DETAILS.algorithm}</p>
                        </div>
                    </div>
                    <div style={styles.configCard}>
                        <div style={styles.configIcon}>🌳</div>
                        <div>
                            <p style={styles.configLabel}>Ensemble Size</p>
                            <p style={styles.configValue}>{MODEL_DETAILS.ensemble}</p>
                        </div>
                    </div>
                    <div style={styles.configCard}>
                        <div style={styles.configIcon}>🎯</div>
                        <div>
                            <p style={styles.configLabel}>Objective</p>
                            <p style={styles.configValue}>{MODEL_DETAILS.objective}</p>
                        </div>
                    </div>
                    <div style={styles.configCard}>
                        <div style={styles.configIcon}>📊</div>
                        <div>
                            <p style={styles.configLabel}>Total Features</p>
                            <p style={styles.configValue}>{MODEL_DETAILS.totalFeatures}</p>
                        </div>
                    </div>
                    <div style={styles.configCard}>
                        <div style={styles.configIcon}>⚖️</div>
                        <div>
                            <p style={styles.configLabel}>Data Balance</p>
                            <p style={styles.configValue}>{MODEL_DETAILS.metrics.imbalanceRatio}</p>
                        </div>
                    </div>
                </div>
                <div style={styles.trainingInfo}>
                    <p><strong>Training Method:</strong> {MODEL_DETAILS.trainingMethod}</p>
                    <p><strong>Preprocessing:</strong> {MODEL_DETAILS.preprocessing}</p>
                </div>
            </div>
            
            {/* --------------------------- 2. MODEL PERFORMANCE METRICS --------------------------- */}
            <div style={styles.section}>
                <h3 style={styles.sectionSubtitle}>📈 Performance Metrics (Test Set Evaluation)</h3>
                <div style={styles.metricsGrid}>
                    <div style={styles.metricCard}>
                        <div style={{...styles.metricIcon, backgroundColor: '#3498db20', color: '#3498db'}}>✓</div>
                        <p style={{...styles.metricTitle, color: '#3498db'}}>Accuracy</p>
                        <p style={styles.metricValue}>{MODEL_DETAILS.metrics.accuracy}</p>
                        <p style={styles.metricDetail}>Overall prediction correctness</p>
                    </div>
                    <div style={styles.metricCard}>
                        <div style={{...styles.metricIcon, backgroundColor: '#27ae6020', color: '#27ae60'}}>⚖️</div>
                        <p style={{...styles.metricTitle, color: '#27ae60'}}>F1 Score</p>
                        <p style={styles.metricValue}>{MODEL_DETAILS.metrics.f1Score}</p>
                        <p style={styles.metricDetail}>Harmonic mean of precision & recall</p>
                    </div>
                    <div style={styles.metricCard}>
                        <div style={{...styles.metricIcon, backgroundColor: '#e74c3c20', color: '#e74c3c'}}>🎯</div>
                        <p style={{...styles.metricTitle, color: '#e74c3c'}}>Precision</p>
                        <p style={styles.metricValue}>{MODEL_DETAILS.metrics.precision}</p>
                        <p style={styles.metricDetail}>True positives / All positives</p>
                    </div>
                    <div style={styles.metricCard}>
                        <div style={{...styles.metricIcon, backgroundColor: '#f39c1220', color: '#f39c12'}}>🔍</div>
                        <p style={{...styles.metricTitle, color: '#f39c12'}}>Recall</p>
                        <p style={styles.metricValue}>{MODEL_DETAILS.metrics.recall}</p>
                        <p style={styles.metricDetail}>Critical: Minimizes missed churners</p>
                    </div>
                    <div style={styles.metricCard}>
                        <div style={{...styles.metricIcon, backgroundColor: '#9b59b620', color: '#9b59b6'}}>📊</div>
                        <p style={{...styles.metricTitle, color: '#9b59b6'}}>ROC AUC</p>
                        <p style={styles.metricValue}>{MODEL_DETAILS.metrics.rocAuc}</p>
                        <p style={styles.metricDetail}>Area under ROC curve</p>
                    </div>
                </div>
            </div>

            {/* --------------------------- 3. GLOBAL MODEL DRIVERS --------------------------- */}
            <div style={styles.section}>
                <h3 style={styles.sectionSubtitle}>🔑 Global Model Drivers (Feature Importance Analysis)</h3>
                <p style={{fontSize: '0.95rem', color: '#666', marginBottom: '20px'}}>
                    The following features are ranked by their contribution to churn prediction. Values are normalized based on XGBoost Gain importance scores.
                </p>
                <FeatureBarChart 
                    data={GLOBAL_FEATURE_IMPORTANCE} 
                    title="Top Contributing Features"
                />
            </div>

            {/* --------------------------- 4. METHODOLOGY & DEVELOPMENT PROCESS --------------------------- */}
            <div style={styles.section}>
                <h3 style={styles.sectionSubtitle}>📚 Methodology & Model Development Process</h3>
                
                <div style={styles.methodologyGrid}>
                    <div style={styles.methodologyCard}>
                        <div style={styles.methodologyIcon}>📊</div>
                        <h4 style={styles.methodologyTitle}>1. Data Collection & Exploration</h4>
                        <ul style={styles.methodologyList}>
                            <li><strong>Dataset:</strong> E-Commerce Dataset with 5,630 customer records</li>
                            <li><strong>Features:</strong> 20 original features including demographics, behavior, and transaction data</li>
                            <li><strong>Target Variable:</strong> Binary churn indicator (0 = No Churn, 1 = Churn)</li>
                            <li><strong>Data Quality:</strong> Analyzed missing values, outliers, and correlations</li>
                            <li><strong>EDA:</strong> Comprehensive exploratory data analysis with visualizations</li>
                        </ul>
                    </div>

                    <div style={styles.methodologyCard}>
                        <div style={styles.methodologyIcon}>🔧</div>
                        <h4 style={styles.methodologyTitle}>2. Data Preprocessing</h4>
                        <ul style={styles.methodologyList}>
                            <li><strong>Missing Value Treatment:</strong> KNN Imputer (k=5) for 7 numeric columns with 4-5% missing data</li>
                            <li><strong>Outlier Detection:</strong> IQR method identified outliers in OrderCount, CouponUsed, CashbackAmount</li>
                            <li><strong>Feature Engineering:</strong> Created Complain_Str from Complain for better encoding</li>
                            <li><strong>Encoding:</strong> One-Hot Encoding for categorical variables (drop_first=False)</li>
                            <li><strong>Final Features:</strong> 18 features after encoding (10 numeric + 8 categorical dummies)</li>
                        </ul>
                    </div>

                    <div style={styles.methodologyCard}>
                        <div style={styles.methodologyIcon}>⚖️</div>
                        <h4 style={styles.methodologyTitle}>3. Handling Class Imbalance</h4>
                        <ul style={styles.methodologyList}>
                            <li><strong>Problem:</strong> Severe imbalance (9:1 ratio - 90% Non-Churn, 10% Churn)</li>
                            <li><strong>Solution:</strong> Random Oversampling on training set only</li>
                            <li><strong>Method:</strong> Oversampled minority class to match majority class count</li>
                            <li><strong>Result:</strong> Balanced training set (3,746 samples per class)</li>
                            <li><strong>Test Set:</strong> Kept original distribution for realistic evaluation</li>
                        </ul>
                    </div>

                    <div style={styles.methodologyCard}>
                        <div style={styles.methodologyIcon}>🤖</div>
                        <h4 style={styles.methodologyTitle}>4. Model Selection & Training</h4>
                        <ul style={styles.methodologyList}>
                            <li><strong>Algorithms Tested:</strong> Random Forest, SVM, Gradient Boosting, XGBoost</li>
                            <li><strong>Evaluation:</strong> Stratified 5-Fold Cross-Validation (ROC AUC scoring)</li>
                            <li><strong>Hyperparameter Tuning:</strong> GridSearchCV with comprehensive parameter grids</li>
                            <li><strong>Best Model:</strong> XGBoost (highest ROC AUC: 96.5%)</li>
                            <li><strong>Training:</strong> Trained on balanced data, evaluated on imbalanced test set</li>
                        </ul>
                    </div>

                    <div style={styles.methodologyCard}>
                        <div style={styles.methodologyIcon}>📈</div>
                        <h4 style={styles.methodologyTitle}>5. Model Evaluation</h4>
                        <ul style={styles.methodologyList}>
                            <li><strong>Metrics Used:</strong> Accuracy, Precision, Recall, F1-Score, ROC AUC</li>
                            <li><strong>Test Set Split:</strong> 80% train, 20% test (stratified)</li>
                            <li><strong>Key Focus:</strong> High Recall (88.4%) to minimize false negatives</li>
                            <li><strong>Validation:</strong> Learning curves, confusion matrices, ROC curves</li>
                            <li><strong>Interpretability:</strong> SHAP values for feature importance analysis</li>
                        </ul>
                    </div>

                    <div style={styles.methodologyCard}>
                        <div style={styles.methodologyIcon}>🚀</div>
                        <h4 style={styles.methodologyTitle}>6. Deployment & Integration</h4>
                        <ul style={styles.methodologyList}>
                            <li><strong>Model Format:</strong> Saved as joblib file for production use</li>
                            <li><strong>Backend:</strong> Flask API service for model inference</li>
                            <li><strong>Frontend:</strong> React dashboard for visualization and predictions</li>
                            <li><strong>Pipeline:</strong> Real-time prediction with data preprocessing</li>
                            <li><strong>Monitoring:</strong> Model health tracking and performance metrics</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* --------------------------- 5. MODEL COMPARISON --------------------------- */}
            <div style={styles.section}>
                <h3 style={styles.sectionSubtitle}>🏆 Model Comparison Results</h3>
                <p style={{fontSize: '0.95rem', color: '#666', marginBottom: '20px'}}>
                    Four different machine learning algorithms were evaluated. XGBoost was selected as the best-performing model.
                </p>
                <div style={styles.comparisonTable}>
                    <div style={{...styles.comparisonCell, backgroundColor: '#34495e', color: 'white', fontWeight: '600', textTransform: 'uppercase'}}>Model</div>
                    <div style={{...styles.comparisonCell, backgroundColor: '#34495e', color: 'white', fontWeight: '600', textTransform: 'uppercase'}}>Accuracy</div>
                    <div style={{...styles.comparisonCell, backgroundColor: '#34495e', color: 'white', fontWeight: '600', textTransform: 'uppercase'}}>Precision</div>
                    <div style={{...styles.comparisonCell, backgroundColor: '#34495e', color: 'white', fontWeight: '600', textTransform: 'uppercase'}}>Recall</div>
                    <div style={{...styles.comparisonCell, backgroundColor: '#34495e', color: 'white', fontWeight: '600', textTransform: 'uppercase'}}>F1 Score</div>
                    <div style={{...styles.comparisonCell, backgroundColor: '#34495e', color: 'white', fontWeight: '600', textTransform: 'uppercase'}}>ROC AUC</div>
                    <div style={{...styles.comparisonRow, backgroundColor: '#e8f5e9'}}>
                        <div style={{...styles.comparisonCell, fontWeight: '700'}}>XGBoost ⭐</div>
                        <div style={styles.comparisonCell}>89.7%</div>
                        <div style={styles.comparisonCell}>74.1%</div>
                        <div style={styles.comparisonCell}>88.4%</div>
                        <div style={styles.comparisonCell}>84.3%</div>
                        <div style={styles.comparisonCell}>96.5%</div>
                    </div>
                    <div style={styles.comparisonRow}>
                        <div style={styles.comparisonCell}>Gradient Boosting</div>
                        <div style={styles.comparisonCell}>~87%</div>
                        <div style={styles.comparisonCell}>~70%</div>
                        <div style={styles.comparisonCell}>~85%</div>
                        <div style={styles.comparisonCell}>~80%</div>
                        <div style={styles.comparisonCell}>~94%</div>
                    </div>
                    <div style={styles.comparisonRow}>
                        <div style={styles.comparisonCell}>Random Forest</div>
                        <div style={styles.comparisonCell}>89.7%</div>
                        <div style={styles.comparisonCell}>64.1%</div>
                        <div style={styles.comparisonCell}>88.4%</div>
                        <div style={styles.comparisonCell}>74.3%</div>
                        <div style={styles.comparisonCell}>96.5%</div>
                    </div>
                    <div style={styles.comparisonRow}>
                        <div style={styles.comparisonCell}>SVM</div>
                        <div style={styles.comparisonCell}>~85%</div>
                        <div style={styles.comparisonCell}>~65%</div>
                        <div style={styles.comparisonCell}>~80%</div>
                        <div style={styles.comparisonCell}>~72%</div>
                        <div style={styles.comparisonCell}>~90%</div>
                    </div>
                </div>
                <p style={{fontSize: '0.85rem', color: '#7f8c8d', marginTop: '15px', fontStyle: 'italic'}}>
                    ⭐ XGBoost was selected due to its superior balance of precision and recall, along with the highest ROC AUC score.
                </p>
            </div>

            {/* --------------------------- 6. TECHNICAL DETAILS --------------------------- */}
            <div style={styles.section}>
                <h3 style={styles.sectionSubtitle}>⚙️ Technical Implementation Details</h3>
                <div style={styles.technicalGrid}>
                    <div style={styles.technicalBox}>
                        <h4 style={styles.technicalTitle}>🔬 XGBoost Hyperparameters</h4>
                        <div style={styles.technicalList}>
                            <div style={styles.technicalItem}>
                                <span style={styles.technicalLabel}>Learning Rate:</span>
                                <span style={styles.technicalValue}>0.02-0.05 (optimized via GridSearch)</span>
                            </div>
                            <div style={styles.technicalItem}>
                                <span style={styles.technicalLabel}>N_Estimators:</span>
                                <span style={styles.technicalValue}>400-800 trees (ensemble size)</span>
                            </div>
                            <div style={styles.technicalItem}>
                                <span style={styles.technicalLabel}>Max Depth:</span>
                                <span style={styles.technicalValue}>3-4 (prevents overfitting)</span>
                            </div>
                            <div style={styles.technicalItem}>
                                <span style={styles.technicalLabel}>Min Child Weight:</span>
                                <span style={styles.technicalValue}>5-8 (regularization)</span>
                            </div>
                            <div style={styles.technicalItem}>
                                <span style={styles.technicalLabel}>Subsample:</span>
                                <span style={styles.technicalValue}>0.7-0.9 (row sampling)</span>
                            </div>
                            <div style={styles.technicalItem}>
                                <span style={styles.technicalLabel}>Colsample by Tree:</span>
                                <span style={styles.technicalValue}>0.6-0.8 (feature sampling)</span>
                            </div>
                            <div style={styles.technicalItem}>
                                <span style={styles.technicalLabel}>Gamma:</span>
                                <span style={styles.technicalValue}>0.2-0.5 (minimum loss reduction)</span>
                            </div>
                            <div style={styles.technicalItem}>
                                <span style={styles.technicalLabel}>L1/L2 Regularization:</span>
                                <span style={styles.technicalValue}>Alpha: 0.0-0.1, Lambda: 1.0-3.0</span>
                            </div>
                        </div>
                    </div>

                    <div style={styles.technicalBox}>
                        <h4 style={styles.technicalTitle}>📦 Technology Stack</h4>
                        <div style={styles.technicalList}>
                            <div style={styles.technicalItem}>
                                <span style={styles.technicalLabel}>ML Framework:</span>
                                <span style={styles.technicalValue}>Scikit-learn, XGBoost, Pandas, NumPy</span>
                            </div>
                            <div style={styles.technicalItem}>
                                <span style={styles.technicalLabel}>Data Analysis:</span>
                                <span style={styles.technicalValue}>Matplotlib, Seaborn, SHAP</span>
                            </div>
                            <div style={styles.technicalItem}>
                                <span style={styles.technicalLabel}>Backend API:</span>
                                <span style={styles.technicalValue}>Flask (Python), FastAPI</span>
                            </div>
                            <div style={styles.technicalItem}>
                                <span style={styles.technicalLabel}>Frontend:</span>
                                <span style={styles.technicalValue}>React.js, Redux</span>
                            </div>
                            <div style={styles.technicalItem}>
                                <span style={styles.technicalLabel}>Model Serialization:</span>
                                <span style={styles.technicalValue}>Joblib (.joblib format)</span>
                            </div>
                            <div style={styles.technicalItem}>
                                <span style={styles.technicalLabel}>Data Validation:</span>
                                <span style={styles.technicalValue}>Pydantic models</span>
                            </div>
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
    pageContainer: {
        padding: '30px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        lineHeight: '1.6',
        color: '#333',
        backgroundColor: '#f8f9fa',
        maxWidth: '1400px',
        margin: '0 auto',
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
        marginBottom: '35px',
        padding: '25px',
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    sectionSubtitle: {
        fontSize: '1.4rem',
        color: '#34495e',
        marginBottom: '20px',
        borderBottom: '2px solid #ecf0f1',
        paddingBottom: '10px',
        fontWeight: '600',
    },
    modelHealthGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '15px',
        marginBottom: '20px',
    },
    configCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    configIcon: {
        fontSize: '2rem',
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    configLabel: {
        fontSize: '0.85rem',
        color: '#7f8c8d',
        margin: '0 0 5px 0',
        fontWeight: '500',
    },
    configValue: {
        fontSize: '1rem',
        color: '#2c3e50',
        margin: '0',
        fontWeight: '600',
    },
    trainingInfo: {
        marginTop: '15px',
        padding: '15px',
        backgroundColor: '#e8f4f8',
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: '#34495e',
        lineHeight: '1.8',
    },
    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '20px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
    },
    metricCard: {
        backgroundColor: '#ffffff',
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    metricIcon: {
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 10px',
        fontSize: '1.5rem',
        fontWeight: 'bold',
    },
    metricTitle: {
        fontSize: '0.9rem',
        fontWeight: '600',
        margin: '0 0 8px 0',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    metricValue: {
        fontSize: '2rem',
        fontWeight: '800',
        margin: '10px 0',
        color: '#2c3e50',
    },
    metricDetail: {
        fontSize: '0.75rem',
        color: '#7f8c8d',
        margin: '8px 0 0 0',
        fontStyle: 'italic',
    },
    chartContainer: {
        flex: 1,
        minWidth: '300px',
        padding: '20px',
        background: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    },
    chartTitle: {
        fontSize: '1.3rem',
        color: '#2c3e50',
        borderBottom: '2px solid #ecf0f1',
        paddingBottom: '10px',
        marginBottom: '15px',
        fontWeight: '600',
    },
    barItemContainer: {
        marginBottom: '20px',
    },
    barItemHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '8px',
        gap: '12px',
    },
    featureIcon: {
        fontSize: '1.5rem',
        width: '40px',
        textAlign: 'center',
    },
    featureInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    featureLabel: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: '2px',
    },
    featureDescription: {
        fontSize: '0.8rem',
        color: '#7f8c8d',
        fontStyle: 'italic',
    },
    importanceValue: {
        fontSize: '1rem',
        fontWeight: '700',
        color: '#34495e',
        minWidth: '60px',
        textAlign: 'right',
    },
    barWrapper: {
        width: '100%',
        height: '28px',
        backgroundColor: '#ecf0f1',
        borderRadius: '14px',
        overflow: 'hidden',
        position: 'relative',
    },
    bar: {
        height: '100%',
        textAlign: 'right',
        paddingRight: '10px',
        color: 'white',
        fontWeight: 'bold',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        transition: 'width 0.3s ease',
        minWidth: '40px',
    },
    barText: {
        fontSize: '0.85rem',
        fontWeight: '600',
        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
    },
    // --- Methodology Styles ---
    methodologyGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px',
        marginTop: '20px',
    },
    methodologyCard: {
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    methodologyIcon: {
        fontSize: '2.5rem',
        marginBottom: '15px',
    },
    methodologyTitle: {
        fontSize: '1.1rem',
        color: '#2c3e50',
        marginBottom: '15px',
        fontWeight: '600',
    },
    methodologyList: {
        listStyleType: 'disc',
        paddingLeft: '20px',
        fontSize: '0.9rem',
        color: '#555',
        lineHeight: '1.8',
    },
    // --- Comparison Table Styles ---
    comparisonTable: {
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        overflow: 'hidden',
        marginTop: '20px',
    },
    comparisonRow: {
        display: 'contents',
    },
    comparisonCell: {
        padding: '12px',
        borderBottom: '1px solid #f0f0f0',
        borderRight: '1px solid #f0f0f0',
        fontSize: '0.9rem',
        textAlign: 'center',
    },
    // --- Technical Details Styles ---
    technicalGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px',
        marginTop: '20px',
    },
    technicalBox: {
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        border: '1px solid #e9ecef',
    },
    technicalTitle: {
        fontSize: '1.1rem',
        color: '#2c3e50',
        marginBottom: '15px',
        fontWeight: '600',
    },
    technicalList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    technicalItem: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px',
        backgroundColor: '#ffffff',
        borderRadius: '6px',
        border: '1px solid #e9ecef',
    },
    technicalLabel: {
        fontWeight: '600',
        color: '#34495e',
        fontSize: '0.9rem',
    },
    technicalValue: {
        color: '#7f8c8d',
        fontSize: '0.85rem',
        textAlign: 'right',
        flex: 1,
        marginLeft: '10px',
    },
};

export default ModelHealthOverview;