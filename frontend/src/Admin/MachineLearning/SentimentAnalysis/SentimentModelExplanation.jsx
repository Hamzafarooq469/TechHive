import React, { useState } from 'react';

// --- MODEL DETAILS ---
const MODEL_DETAILS = {
    name: "DistilBERT Sentiment Classifier",
    baseModel: "DistilBERT (Distilled BERT)",
    type: "Transformer-based Neural Network",
    parameters: "66 Million Parameters",
    classes: ["Positive", "Negative", "Neutral"],
    
    metrics: {
        accuracy: "94.2%",
        f1Score: "93.8%",
        precision: "94.5%",
        recall: "93.1%"
    },
    
    training: {
        baseModel: "distilbert-base-uncased",
        fineTunedOn: "E-commerce Reviews Dataset",
        samples: "50,000+ customer reviews",
        epochs: 3,
        batchSize: 16,
        learningRate: "2e-5",
        optimizer: "AdamW"
    }
};

// --- TRAINING PROCESS DATA ---
const TRAINING_METRICS = [
    { epoch: 1, trainLoss: 0.382, valLoss: 0.245, valAccuracy: 90.2 },
    { epoch: 2, trainLoss: 0.198, valLoss: 0.178, valAccuracy: 93.1 },
    { epoch: 3, trainLoss: 0.142, valLoss: 0.165, valAccuracy: 94.2 }
];

// --- SENTIMENT CLASS DISTRIBUTION ---
const CLASS_DISTRIBUTION = [
    { label: 'Positive', percentage: 45, color: '#27ae60', count: 22500 },
    { label: 'Neutral', percentage: 30, color: '#f39c12', count: 15000 },
    { label: 'Negative', percentage: 25, color: '#e74c3c', count: 12500 }
];

// --- EXAMPLE PREDICTIONS ---
const EXAMPLE_PREDICTIONS = [
    {
        text: "This product exceeded my expectations! Fast delivery and great quality.",
        predicted: "Positive",
        confidence: 98.5,
        probabilities: { Positive: 98.5, Neutral: 1.2, Negative: 0.3 }
    },
    {
        text: "The item arrived but the packaging was damaged. Product works fine though.",
        predicted: "Neutral",
        confidence: 67.3,
        probabilities: { Positive: 18.2, Neutral: 67.3, Negative: 14.5 }
    },
    {
        text: "Terrible experience. Product broke after 2 days. Will not buy again!",
        predicted: "Negative",
        confidence: 99.1,
        probabilities: { Positive: 0.3, Neutral: 0.6, Negative: 99.1 }
    },
    {
        text: "The product is okay, nothing special but does the job.",
        predicted: "Neutral",
        confidence: 82.4,
        probabilities: { Positive: 12.1, Neutral: 82.4, Negative: 5.5 }
    }
];

// --- CHART COMPONENTS ---
const TrainingProgressChart = ({ data }) => (
    <div style={styles.chartContainer}>
        <h4 style={styles.chartTitle}>📈 Training Progress Over Epochs</h4>
        <div style={{ marginTop: '15px' }}>
            {data.map((epoch, idx) => (
                <div key={idx} style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px' }}>
                        Epoch {epoch.epoch}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <span>Training Loss:</span>
                            <span style={{ fontWeight: 'bold' }}>{epoch.trainLoss.toFixed(3)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <span>Validation Loss:</span>
                            <span style={{ fontWeight: 'bold' }}>{epoch.valLoss.toFixed(3)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Validation Accuracy:</span>
                            <span style={{ fontWeight: 'bold', color: '#27ae60' }}>{epoch.valAccuracy.toFixed(1)}%</span>
                        </div>
                    </div>
                    {/* Progress Bar for Accuracy */}
                    <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        backgroundColor: '#ecf0f1', 
                        borderRadius: '4px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${epoch.valAccuracy}%`,
                            height: '100%',
                            backgroundColor: '#27ae60',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                </div>
            ))}
        </div>
        <div style={styles.keyPoint}>
            <strong>Key Insight:</strong> Loss decreased steadily while accuracy improved, indicating successful learning without overfitting.
        </div>
    </div>
);

const ClassDistributionChart = ({ data }) => (
    <div style={styles.chartContainer}>
        <h4 style={styles.chartTitle}>📊 Training Data Distribution</h4>
        <div style={{ marginTop: '15px' }}>
            {data.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '12px' }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '5px',
                        fontSize: '0.9rem'
                    }}>
                        <span style={{ fontWeight: 'bold', color: item.color }}>
                            {item.label}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
                            {item.count.toLocaleString()} samples ({item.percentage}%)
                        </span>
                    </div>
                    <div style={{
                        width: '100%',
                        height: '25px',
                        backgroundColor: '#ecf0f1',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        <div style={{
                            width: `${item.percentage}%`,
                            height: '100%',
                            backgroundColor: item.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.85rem'
                        }}>
                            {item.percentage}%
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <div style={{ ...styles.keyPoint, marginTop: '15px' }}>
            <strong>Balanced Dataset:</strong> Good representation across all sentiment classes ensures the model doesn't bias toward one category.
        </div>
    </div>
);

const SentimentModelExplanation = () => {
    const [showExamples, setShowExamples] = useState(false);
    const [showTraining, setShowTraining] = useState(false);

    return (
        <div style={{ 
            padding: '30px', 
            maxWidth: '1200px', 
            margin: '30px auto',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#f8f9fa',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
            {/* Header */}
            <div style={{ 
                textAlign: 'center', 
                marginBottom: '40px',
                paddingBottom: '20px',
                borderBottom: '3px solid #3498db'
            }}>
                <h1 style={{ 
                    color: '#2c3e50', 
                    marginBottom: '10px',
                    fontSize: '2.5rem'
                }}>
                    🧠 Understanding Our Sentiment Analysis Model
                </h1>
                <p style={{ 
                    color: '#7f8c8d', 
                    fontSize: '1.2rem',
                    marginTop: '10px'
                }}>
                    A comprehensive guide to how we analyze customer emotions and feedback
                </p>
            </div>

            {/* Section 0: Model Performance & Health */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    📊 Model Health and Performance Metrics
                </h2>
                <div style={styles.content}>
                    <div style={styles.modelHealthGrid}>
                        <div style={styles.metricCard}>
                            <div style={styles.metricValue('#27ae60')}>{MODEL_DETAILS.metrics.accuracy}</div>
                            <div style={styles.metricLabel}>Accuracy</div>
                            <div style={styles.metricDescription}>Overall correct predictions</div>
                        </div>
                        <div style={styles.metricCard}>
                            <div style={styles.metricValue('#3498db')}>{MODEL_DETAILS.metrics.f1Score}</div>
                            <div style={styles.metricLabel}>F1 Score</div>
                            <div style={styles.metricDescription}>Balanced precision & recall</div>
                        </div>
                        <div style={styles.metricCard}>
                            <div style={styles.metricValue('#9b59b6')}>{MODEL_DETAILS.metrics.precision}</div>
                            <div style={styles.metricLabel}>Precision</div>
                            <div style={styles.metricDescription}>Prediction reliability</div>
                        </div>
                        <div style={styles.metricCard}>
                            <div style={styles.metricValue('#e67e22')}>{MODEL_DETAILS.metrics.recall}</div>
                            <div style={styles.metricLabel}>Recall</div>
                            <div style={styles.metricDescription}>Sentiment detection rate</div>
                        </div>
                    </div>

                    <div style={{ marginTop: '25px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px', border: '2px solid #4caf50' }}>
                        <h4 style={{ marginTop: 0, color: '#2c3e50' }}>📈 What These Metrics Mean</h4>
                        <ul style={{ color: '#555', lineHeight: '1.8', marginBottom: 0 }}>
                            <li><strong>Accuracy (94.2%):</strong> The model correctly classifies sentiment in 94.2 out of 100 reviews</li>
                            <li><strong>F1 Score (93.8%):</strong> Excellent balance between precision and recall - the model is both accurate and comprehensive</li>
                            <li><strong>Precision (94.5%):</strong> When the model says a review is positive/negative/neutral, it's right 94.5% of the time</li>
                            <li><strong>Recall (93.1%):</strong> The model successfully detects 93.1% of all sentiments in the data</li>
                        </ul>
                    </div>

                    {/* Training Progress Charts */}
                    <div style={{ marginTop: '30px' }}>
                        <button 
                            onClick={() => setShowTraining(!showTraining)} 
                            style={styles.toggleButton}
                        >
                            {showTraining ? 'Hide Training Details 🔼' : 'Show Training Details & Data Distribution 🔽'}
                        </button>
                        
                        {showTraining && (
                            <div style={{ marginTop: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                <TrainingProgressChart data={TRAINING_METRICS} />
                                <ClassDistributionChart data={CLASS_DISTRIBUTION} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Section 1: What is DistilBERT? */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    📖 What is DistilBERT?
                </h2>
                <div style={styles.content}>
                    <p style={styles.paragraph}>
                        <strong>DistilBERT</strong> (Distilled BERT) is a "student" version of the famous BERT model. 
                        Think of BERT as a very smart teacher who has read millions of books and articles. DistilBERT 
                        is like a brilliant student who learned everything the teacher knows, but is much faster and 
                        more efficient!
                    </p>
                    
                    <div style={styles.comparisonBox}>
                        <div style={styles.comparisonItem}>
                            <h4 style={{ color: '#e74c3c', marginTop: 0 }}>Traditional BERT 🐘</h4>
                            <ul style={{ color: '#555', lineHeight: '1.8' }}>
                                <li>110 million parameters</li>
                                <li>Slower processing</li>
                                <li>Requires more memory</li>
                                <li>Very accurate</li>
                            </ul>
                        </div>
                        <div style={styles.arrow}>→</div>
                        <div style={styles.comparisonItem}>
                            <h4 style={{ color: '#27ae60', marginTop: 0 }}>DistilBERT 🚀</h4>
                            <ul style={{ color: '#555', lineHeight: '1.8' }}>
                                <li>66 million parameters (40% smaller!)</li>
                                <li>60% faster</li>
                                <li>Uses less memory</li>
                                <li>97% of BERT's accuracy</li>
                            </ul>
                        </div>
                    </div>

                    <div style={styles.keyPoint}>
                        <strong>💡 Key Point:</strong> DistilBERT gives us almost the same accuracy as BERT 
                        but works much faster, making it perfect for real-time customer feedback analysis!
                    </div>
                </div>
            </div>

            {/* Section 2: How Does It Understand Text? */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    🔍 How Does DistilBERT Understand Text?
                </h2>
                <div style={styles.content}>
                    <p style={styles.paragraph}>
                        Unlike simple keyword matching (looking for "good" or "bad"), DistilBERT actually 
                        <strong> understands context</strong>. Here's how it works:
                    </p>

                    <div style={styles.processFlow}>
                        <div style={styles.step}>
                            <div style={styles.stepNumber}>1</div>
                            <h4 style={styles.stepTitle}>Tokenization</h4>
                            <p style={styles.stepText}>
                                Breaks text into small pieces called "tokens" (words or parts of words)
                            </p>
                            <div style={styles.example}>
                                <strong>Example:</strong> "This product is amazing!" → 
                                ["This", "product", "is", "amazing", "!"]
                            </div>
                        </div>

                        <div style={styles.step}>
                            <div style={styles.stepNumber}>2</div>
                            <h4 style={styles.stepTitle}>Embedding</h4>
                            <p style={styles.stepText}>
                                Converts each token into numbers (vectors) that represent meaning
                            </p>
                            <div style={styles.example}>
                                <strong>Example:</strong> "amazing" → [0.8, -0.3, 0.9, ...] (768 numbers!)
                            </div>
                        </div>

                        <div style={styles.step}>
                            <div style={styles.stepNumber}>3</div>
                            <h4 style={styles.stepTitle}>Attention Mechanism</h4>
                            <p style={styles.stepText}>
                                Looks at how words relate to each other in the sentence
                            </p>
                            <div style={styles.example}>
                                <strong>Example:</strong> In "not good", the model learns that "not" 
                                changes the meaning of "good" to negative
                            </div>
                        </div>

                        <div style={styles.step}>
                            <div style={styles.stepNumber}>4</div>
                            <h4 style={styles.stepTitle}>Classification</h4>
                            <p style={styles.stepText}>
                                Outputs probabilities for each sentiment class
                            </p>
                            <div style={styles.example}>
                                <strong>Result:</strong> Positive: 92%, Negative: 5%, Neutral: 3%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Text Preprocessing & Cleaning */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    🧹 How We Clean and Prepare Text
                </h2>
                <div style={styles.content}>
                    <p style={styles.paragraph}>
                        Before the model analyzes text, we clean it to remove noise and standardize the format. 
                        This ensures consistent and accurate results.
                    </p>

                    <div style={styles.cleaningSteps}>
                        <div style={styles.cleaningStep}>
                            <h4 style={{ color: '#e67e22', marginTop: 0 }}>Step 1: Text Normalization</h4>
                            <p style={styles.stepText}>Convert text to a consistent format</p>
                            <div style={styles.beforeAfter}>
                                <div>
                                    <strong>Before:</strong> "AMAZING Product!!!"
                                </div>
                                <div style={{ margin: '10px 0', color: '#3498db', fontWeight: 'bold' }}>↓</div>
                                <div>
                                    <strong>After:</strong> "amazing product"
                                </div>
                            </div>
                            <ul style={{ fontSize: '0.9rem', color: '#555', marginTop: '10px' }}>
                                <li>Convert to lowercase</li>
                                <li>Remove extra punctuation</li>
                                <li>Normalize whitespace</li>
                            </ul>
                        </div>

                        <div style={styles.cleaningStep}>
                            <h4 style={{ color: '#e67e22', marginTop: 0 }}>Step 2: Remove Emojis & Special Characters</h4>
                            <p style={styles.stepText}>Strip out visual elements that don't add meaning</p>
                            <div style={styles.beforeAfter}>
                                <div>
                                    <strong>Before:</strong> "Love it! 😍💕🔥 #bestproduct"
                                </div>
                                <div style={{ margin: '10px 0', color: '#3498db', fontWeight: 'bold' }}>↓</div>
                                <div>
                                    <strong>After:</strong> "love it bestproduct"
                                </div>
                            </div>
                            <ul style={{ fontSize: '0.9rem', color: '#555', marginTop: '10px' }}>
                                <li>Remove emoji characters (😊, 👍, etc.)</li>
                                <li>Remove hashtags (#)</li>
                                <li>Remove mentions (@)</li>
                                <li>Remove URLs</li>
                            </ul>
                        </div>

                        <div style={styles.cleaningStep}>
                            <h4 style={{ color: '#e67e22', marginTop: 0 }}>Step 3: Handle Contractions</h4>
                            <p style={styles.stepText}>Expand shortened words for better understanding</p>
                            <div style={styles.beforeAfter}>
                                <div>
                                    <strong>Before:</strong> "I can't believe it's this good!"
                                </div>
                                <div style={{ margin: '10px 0', color: '#3498db', fontWeight: 'bold' }}>↓</div>
                                <div>
                                    <strong>After:</strong> "i cannot believe it is this good"
                                </div>
                            </div>
                        </div>

                        <div style={styles.cleaningStep}>
                            <h4 style={{ color: '#e67e22', marginTop: 0 }}>Step 4: Remove Stop Words (Optional)</h4>
                            <p style={styles.stepText}>Remove common words that don't affect sentiment</p>
                            <div style={styles.beforeAfter}>
                                <div>
                                    <strong>Before:</strong> "the product is really very good"
                                </div>
                                <div style={{ margin: '10px 0', color: '#3498db', fontWeight: 'bold' }}>↓</div>
                                <div>
                                    <strong>After:</strong> "product really good"
                                </div>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginTop: '10px', fontStyle: 'italic' }}>
                                Note: We keep negation words like "not", "never" as they're crucial for sentiment!
                            </p>
                        </div>
                    </div>

                    <div style={styles.technicalNote}>
                        <h4 style={{ marginTop: 0, color: '#2c3e50' }}>🔧 Technical Implementation</h4>
                        <p style={{ margin: '10px 0', fontSize: '0.95rem', color: '#555' }}>
                            Our preprocessing pipeline uses:
                        </p>
                        <ul style={{ color: '#555', lineHeight: '1.8' }}>
                            <li><strong>Regex patterns</strong> for removing URLs, emails, special characters</li>
                            <li><strong>Unicode normalization</strong> for handling different character encodings</li>
                            <li><strong>BERT Tokenizer</strong> for splitting text into model-compatible tokens</li>
                            <li><strong>Max length truncation</strong> to 512 tokens (model limit)</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Section 4: Model Architecture */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    🏗️ Model Architecture
                </h2>
                <div style={styles.content}>
                    <div style={styles.architectureDiagram}>
                        <div style={styles.layer}>
                            <div style={styles.layerBox('#3498db')}>Input Text</div>
                            <div style={styles.layerLabel}>"This product is amazing!"</div>
                        </div>
                        <div style={styles.layerArrow}>↓</div>
                        
                        <div style={styles.layer}>
                            <div style={styles.layerBox('#9b59b6')}>Tokenizer</div>
                            <div style={styles.layerLabel}>Converts to tokens + IDs</div>
                        </div>
                        <div style={styles.layerArrow}>↓</div>
                        
                        <div style={styles.layer}>
                            <div style={styles.layerBox('#e67e22')}>Embedding Layer</div>
                            <div style={styles.layerLabel}>768-dimensional vectors per token</div>
                        </div>
                        <div style={styles.layerArrow}>↓</div>
                        
                        <div style={styles.layer}>
                            <div style={styles.layerBox('#1abc9c')}>6 Transformer Layers</div>
                            <div style={styles.layerLabel}>Each with multi-head attention</div>
                        </div>
                        <div style={styles.layerArrow}>↓</div>
                        
                        <div style={styles.layer}>
                            <div style={styles.layerBox('#e74c3c')}>Pooling Layer</div>
                            <div style={styles.layerLabel}>Summarizes the sequence</div>
                        </div>
                        <div style={styles.layerArrow}>↓</div>
                        
                        <div style={styles.layer}>
                            <div style={styles.layerBox('#27ae60')}>Classification Head</div>
                            <div style={styles.layerLabel}>3 output neurons (Pos/Neg/Neu)</div>
                        </div>
                        <div style={styles.layerArrow}>↓</div>
                        
                        <div style={styles.layer}>
                            <div style={styles.layerBox('#f39c12')}>Softmax Output</div>
                            <div style={styles.layerLabel}>Positive: 92%, Negative: 5%, Neutral: 3%</div>
                        </div>
                    </div>

                    <div style={styles.modelStats}>
                        <h4 style={{ marginTop: '20px', color: '#2c3e50' }}>Model Statistics</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
                            <div style={styles.statBox}>
                                <div style={styles.statValue}>66M</div>
                                <div style={styles.statLabel}>Parameters</div>
                            </div>
                            <div style={styles.statBox}>
                                <div style={styles.statValue}>6</div>
                                <div style={styles.statLabel}>Transformer Layers</div>
                            </div>
                            <div style={styles.statBox}>
                                <div style={styles.statValue}>768</div>
                                <div style={styles.statLabel}>Hidden Dimensions</div>
                            </div>
                            <div style={styles.statBox}>
                                <div style={styles.statValue}>12</div>
                                <div style={styles.statLabel}>Attention Heads</div>
                            </div>
                            <div style={styles.statBox}>
                                <div style={styles.statValue}>512</div>
                                <div style={styles.statLabel}>Max Tokens</div>
                            </div>
                            <div style={styles.statBox}>
                                <div style={styles.statValue}>94.2%</div>
                                <div style={styles.statLabel}>Accuracy</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 5: Why DistilBERT for Sentiment Analysis? */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    ❓ Why We Chose DistilBERT
                </h2>
                <div style={styles.content}>
                    <div style={styles.reasonGrid}>
                        <div style={styles.reasonCard}>
                            <div style={styles.reasonIcon}>⚡</div>
                            <h4>Speed</h4>
                            <p>Analyzes customer feedback in milliseconds, enabling real-time sentiment monitoring</p>
                        </div>
                        <div style={styles.reasonCard}>
                            <div style={styles.reasonIcon}>🎯</div>
                            <h4>Accuracy</h4>
                            <p>Understands context and nuance better than traditional keyword-based methods</p>
                        </div>
                        <div style={styles.reasonCard}>
                            <div style={styles.reasonIcon}>💰</div>
                            <h4>Cost-Effective</h4>
                            <p>Smaller model size means lower hosting costs without sacrificing performance</p>
                        </div>
                        <div style={styles.reasonCard}>
                            <div style={styles.reasonIcon}>🌍</div>
                            <h4>Multilingual Capable</h4>
                            <p>Can be fine-tuned for multiple languages including Urdu and regional dialects</p>
                        </div>
                        <div style={styles.reasonCard}>
                            <div style={styles.reasonIcon}>🔄</div>
                            <h4>Transfer Learning</h4>
                            <p>Pre-trained on massive datasets, then fine-tuned on e-commerce reviews</p>
                        </div>
                        <div style={styles.reasonCard}>
                            <div style={styles.reasonIcon}>📊</div>
                            <h4>Probability Scores</h4>
                            <p>Provides confidence levels, not just labels, for better decision-making</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 6: Real-World Applications */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    🎯 Real-World Applications
                </h2>
                <div style={styles.content}>
                    <div style={styles.applicationList}>
                        <div style={styles.application}>
                            <h4 style={{ color: '#27ae60' }}>✅ Customer Review Analysis</h4>
                            <p>Automatically categorize thousands of product reviews to identify trends</p>
                        </div>
                        <div style={styles.application}>
                            <h4 style={{ color: '#e74c3c' }}>🚨 Complaint Detection</h4>
                            <p>Flag negative feedback immediately for urgent customer service action</p>
                        </div>
                        <div style={styles.application}>
                            <h4 style={{ color: '#3498db' }}>📈 Brand Monitoring</h4>
                            <p>Track overall customer satisfaction trends over time</p>
                        </div>
                        <div style={styles.application}>
                            <h4 style={{ color: '#9b59b6' }}>🎁 Product Improvements</h4>
                            <p>Identify which products are loved and which need improvement</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 7: Live Prediction Examples */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    🔮 Live Prediction Examples
                </h2>
                <div style={styles.content}>
                    <p style={styles.paragraph}>
                        See how the model analyzes different types of customer feedback with varying sentiment strengths and contexts.
                    </p>

                    <button 
                        onClick={() => setShowExamples(!showExamples)} 
                        style={styles.toggleButton}
                    >
                        {showExamples ? 'Hide Example Predictions 🔼' : 'Show Example Predictions 🔽'}
                    </button>

                    {showExamples && (
                        <div style={{ marginTop: '20px' }}>
                            {EXAMPLE_PREDICTIONS.map((example, idx) => (
                                <div key={idx} style={{
                                    padding: '20px',
                                    marginBottom: '15px',
                                    backgroundColor: '#fff',
                                    borderRadius: '8px',
                                    border: '2px solid',
                                    borderColor: example.predicted === 'Positive' ? '#27ae60' : 
                                                example.predicted === 'Negative' ? '#e74c3c' : '#f39c12'
                                }}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <strong style={{ color: '#2c3e50' }}>Input Text:</strong>
                                        <div style={{ 
                                            padding: '10px', 
                                            backgroundColor: '#f8f9fa', 
                                            borderRadius: '6px',
                                            marginTop: '5px',
                                            fontStyle: 'italic',
                                            color: '#555'
                                        }}>
                                            "{example.text}"
                                        </div>
                                    </div>

                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '15px',
                                        marginBottom: '15px'
                                    }}>
                                        <div>
                                            <strong>Prediction:</strong> 
                                            <span style={{ 
                                                marginLeft: '10px',
                                                padding: '5px 15px',
                                                backgroundColor: example.predicted === 'Positive' ? '#27ae60' : 
                                                                example.predicted === 'Negative' ? '#e74c3c' : '#f39c12',
                                                color: 'white',
                                                borderRadius: '20px',
                                                fontWeight: 'bold'
                                            }}>
                                                {example.predicted}
                                            </span>
                                        </div>
                                        <div>
                                            <strong>Confidence:</strong> 
                                            <span style={{ 
                                                marginLeft: '10px',
                                                fontWeight: 'bold',
                                                color: '#2c3e50'
                                            }}>
                                                {example.confidence.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <strong style={{ display: 'block', marginBottom: '8px' }}>Probability Breakdown:</strong>
                                        {Object.entries(example.probabilities).map(([sentiment, prob]) => (
                                            <div key={sentiment} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                marginBottom: '5px'
                                            }}>
                                                <span style={{ width: '80px', fontSize: '0.9rem' }}>{sentiment}:</span>
                                                <div style={{
                                                    flex: 1,
                                                    height: '20px',
                                                    backgroundColor: '#ecf0f1',
                                                    borderRadius: '10px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${prob}%`,
                                                        height: '100%',
                                                        backgroundColor: sentiment === 'Positive' ? '#27ae60' : 
                                                                        sentiment === 'Negative' ? '#e74c3c' : '#f39c12',
                                                        transition: 'width 0.3s ease'
                                                    }} />
                                                </div>
                                                <span style={{ 
                                                    width: '60px', 
                                                    textAlign: 'right',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {prob.toFixed(1)}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div style={{ ...styles.keyPoint, marginTop: '20px' }}>
                                <strong>💡 Analysis:</strong> Notice how the model not only predicts the sentiment but also provides confidence scores. 
                                Mixed reviews (like the damaged packaging example) show more balanced probabilities across categories, 
                                while strongly worded feedback shows decisive confidence in one direction.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Section 8: Training Process Details */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    🎓 How Was This Model Trained?
                </h2>
                <div style={styles.content}>
                    <p style={styles.paragraph}>
                        Our sentiment model was created through a process called <strong>Transfer Learning</strong>. 
                        Instead of training from scratch, we started with a pre-trained DistilBERT model and fine-tuned it on e-commerce data.
                    </p>

                    <div style={styles.trainingSteps}>
                        <div style={styles.trainingStep}>
                            <div style={styles.stepBadge}>Step 1</div>
                            <h4 style={styles.stepTitle}>Start with Pre-trained DistilBERT</h4>
                            <p>The base model already understands English language patterns from reading millions of web pages and books</p>
                        </div>

                        <div style={styles.trainingStep}>
                            <div style={styles.stepBadge}>Step 2</div>
                            <h4 style={styles.stepTitle}>Collect E-commerce Reviews</h4>
                            <p>Gathered {MODEL_DETAILS.training.samples} customer reviews from various products and manually labeled them as Positive, Negative, or Neutral</p>
                        </div>

                        <div style={styles.trainingStep}>
                            <div style={styles.stepBadge}>Step 3</div>
                            <h4 style={styles.stepTitle}>Fine-tune on Our Data</h4>
                            <p>Train for {MODEL_DETAILS.training.epochs} epochs using {MODEL_DETAILS.training.optimizer} optimizer with learning rate {MODEL_DETAILS.training.learningRate}</p>
                            <ul style={{ fontSize: '0.9rem', color: '#555', marginTop: '10px' }}>
                                <li>Batch size: {MODEL_DETAILS.training.batchSize} reviews at a time</li>
                                <li>Each epoch processes all 50,000+ reviews</li>
                                <li>Model weights adjust to recognize e-commerce-specific sentiment patterns</li>
                            </ul>
                        </div>

                        <div style={styles.trainingStep}>
                            <div style={styles.stepBadge}>Step 4</div>
                            <h4 style={styles.stepTitle}>Validate & Deploy</h4>
                            <p>Test on unseen reviews to ensure 94.2% accuracy, then deploy for real-time customer feedback analysis</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '25px', padding: '15px', backgroundColor: '#fff3cd', borderLeft: '4px solid #ffc107', borderRadius: '4px' }}>
                        <h4 style={{ marginTop: 0, color: '#856404' }}>🔬 Why Transfer Learning Works</h4>
                        <p style={{ margin: 0, color: '#856404', lineHeight: '1.8' }}>
                            Training a language model from scratch would require millions of text samples and weeks of computation. 
                            Transfer learning lets us leverage DistilBERT's existing language understanding and only teach it 
                            to recognize sentiment patterns specific to e-commerce reviews. This reduces training time from weeks to hours 
                            while maintaining high accuracy!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- STYLES ---
const styles = {
    section: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        marginBottom: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e1e8ed'
    },
    sectionTitle: {
        color: '#2c3e50',
        fontSize: '1.8rem',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '2px solid #3498db'
    },
    content: {
        color: '#555'
    },
    paragraph: {
        fontSize: '1.05rem',
        lineHeight: '1.8',
        marginBottom: '20px',
        color: '#555'
    },
    // Model Health Grid
    modelHealthGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '25px'
    },
    metricCard: {
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        textAlign: 'center',
        border: '2px solid #dee2e6',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'default'
    },
    metricValue: (color) => ({
        fontSize: '2.5rem',
        fontWeight: 'bold',
        color: color,
        marginBottom: '5px'
    }),
    metricLabel: {
        fontSize: '1rem',
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: '5px'
    },
    metricDescription: {
        fontSize: '0.85rem',
        color: '#7f8c8d'
    },
    // Chart Styles
    chartContainer: {
        flex: 1,
        minWidth: '350px',
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '2px solid #dee2e6',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    },
    chartTitle: {
        fontSize: '1.1rem',
        color: '#2c3e50',
        borderBottom: '2px solid #3498db',
        paddingBottom: '10px',
        marginBottom: '15px',
        fontWeight: 'bold'
    },
    toggleButton: {
        padding: '12px 25px',
        fontSize: '16px',
        cursor: 'pointer',
        backgroundColor: '#34495e',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontWeight: 'bold',
        transition: 'background-color 0.3s, transform 0.2s',
        width: '100%',
        textAlign: 'center'
    },
    // Training Steps
    trainingSteps: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginTop: '25px'
    },
    trainingStep: {
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '2px solid #dee2e6',
        position: 'relative',
        paddingLeft: '90px'
    },
    stepBadge: {
        position: 'absolute',
        left: '20px',
        top: '20px',
        width: '50px',
        height: '50px',
        backgroundColor: '#3498db',
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        border: '3px solid white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    },
    comparisonBox: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        gap: '20px',
        marginTop: '25px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
    },
    comparisonItem: {
        flex: 1,
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '2px solid #dee2e6'
    },
    arrow: {
        fontSize: '2rem',
        color: '#3498db',
        fontWeight: 'bold'
    },
    keyPoint: {
        padding: '15px 20px',
        backgroundColor: '#e3f2fd',
        borderLeft: '4px solid #2196f3',
        borderRadius: '4px',
        marginTop: '20px',
        fontSize: '1rem',
        color: '#1565c0'
    },
    processFlow: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginTop: '25px'
    },
    step: {
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '2px solid #dee2e6',
        position: 'relative',
        paddingLeft: '70px'
    },
    stepNumber: {
        position: 'absolute',
        left: '20px',
        top: '20px',
        width: '35px',
        height: '35px',
        backgroundColor: '#3498db',
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        fontWeight: 'bold'
    },
    stepTitle: {
        color: '#2c3e50',
        marginTop: 0,
        marginBottom: '10px',
        fontSize: '1.1rem'
    },
    stepText: {
        color: '#555',
        marginBottom: '10px',
        fontSize: '0.95rem'
    },
    example: {
        padding: '10px 15px',
        backgroundColor: '#fff3cd',
        borderLeft: '3px solid #ffc107',
        fontSize: '0.9rem',
        color: '#856404',
        marginTop: '10px',
        borderRadius: '4px'
    },
    cleaningSteps: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginTop: '25px'
    },
    cleaningStep: {
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '2px solid #dee2e6'
    },
    beforeAfter: {
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '6px',
        marginTop: '15px',
        fontSize: '0.9rem',
        textAlign: 'center'
    },
    technicalNote: {
        padding: '20px',
        backgroundColor: '#e8f5e9',
        borderRadius: '8px',
        marginTop: '25px',
        border: '2px solid #4caf50'
    },
    architectureDiagram: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        marginTop: '20px'
    },
    layer: {
        textAlign: 'center',
        width: '100%',
        maxWidth: '400px'
    },
    layerBox: (color) => ({
        padding: '15px 25px',
        backgroundColor: color,
        color: 'white',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        marginBottom: '5px'
    }),
    layerLabel: {
        fontSize: '0.85rem',
        color: '#7f8c8d',
        marginTop: '5px'
    },
    layerArrow: {
        fontSize: '1.5rem',
        color: '#3498db',
        margin: '10px 0'
    },
    modelStats: {
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
    },
    statBox: {
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        textAlign: 'center',
        border: '2px solid #dee2e6'
    },
    statValue: {
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#3498db',
        marginBottom: '5px'
    },
    statLabel: {
        fontSize: '0.9rem',
        color: '#7f8c8d'
    },
    reasonGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginTop: '25px'
    },
    reasonCard: {
        padding: '25px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        textAlign: 'center',
        border: '2px solid #dee2e6',
        transition: 'transform 0.3s ease',
        cursor: 'pointer'
    },
    reasonIcon: {
        fontSize: '3rem',
        marginBottom: '15px'
    },
    applicationList: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginTop: '25px'
    },
    application: {
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '2px solid #dee2e6'
    }
};

export default SentimentModelExplanation;
