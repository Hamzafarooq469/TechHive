
import React, { useState } from 'react';
import axios from 'axios';
import SentimentModelExplanation from './SentimentModelExplanation';

const SENTIMENT_API_ENDPOINT = '/prediction/sentiment';

const SentimentManualText = () => {
    const [text, setText] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const analyzeSentiment = async () => {
        if (!text.trim()) {
            setError('Please enter some text to analyze');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await axios.post(SENTIMENT_API_ENDPOINT, {
                text: text.trim()
            });

            setResult(response.data);
        } catch (err) {
            console.error('Sentiment analysis error:', err);
            setError(
                err.response?.data?.message || 
                err.response?.data?.details ||
                'Failed to analyze sentiment. Please ensure the Python ML service is running.'
            );
        } finally {
            setLoading(false);
        }
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'Positive':
                return '#27ae60'; // Green
            case 'Negative':
                return '#e74c3c'; // Red
            case 'Neutral':
                return '#f39c12'; // Orange
            default:
                return '#34495e'; // Dark gray
        }
    };

    const getSentimentEmoji = (sentiment) => {
        switch (sentiment) {
            case 'Positive':
                return '😊';
            case 'Negative':
                return '😞';
            case 'Neutral':
                return '😐';
            default:
                return '🤔';
        }
    };

    return (
        <div style={{ 
            padding: '20px', 
            maxWidth: '900px', 
            margin: '0 auto',
            fontFamily: 'Arial, sans-serif'
        }}>
            <h1 style={{ 
                marginBottom: '10px',
                color: '#2c3e50'
            }}>
                💬 Sentiment Analysis - Manual Text
            </h1>
            <p style={{ 
                color: '#555', 
                marginBottom: '30px',
                fontSize: '16px'
            }}>
                Analyze the sentiment of any text using our DistilBERT-based sentiment analysis model.
                The model can classify text as Positive, Negative, or Neutral.
            </p>

            {/* Input Section */}
            <div style={{ 
                marginBottom: '30px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <label style={{ 
                    display: 'block',
                    marginBottom: '10px',
                    fontWeight: 'bold',
                    color: '#2c3e50'
                }}>
                    Enter Text to Analyze:
                </label>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type or paste text here to analyze sentiment..."
                    style={{
                        width: '100%',
                        minHeight: '150px',
                        padding: '12px',
                        fontSize: '16px',
                        border: '2px solid #ddd',
                        borderRadius: '6px',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                    }}
                    disabled={loading}
                />
                <button
                    onClick={analyzeSentiment}
                    disabled={loading || !text.trim()}
                    style={{
                        marginTop: '15px',
                        padding: '12px 30px',
                        fontSize: '16px',
                        cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
                        backgroundColor: loading || !text.trim() ? '#bdc3c7' : '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        transition: 'background-color 0.3s'
                    }}
                >
                    {loading ? 'Analyzing...' : 'Analyze Sentiment'}
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div style={{
                    padding: '15px',
                    marginBottom: '20px',
                    backgroundColor: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '6px',
                    color: '#c33'
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Results Display */}
            {result && (
                <div style={{
                    padding: '25px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    backgroundColor: '#fff',
                    border: '2px solid',
                    borderColor: getSentimentColor(result.sentiment)
                }}>
                    <h2 style={{
                        marginTop: '0',
                        marginBottom: '20px',
                        color: '#2c3e50'
                    }}>
                        Analysis Results
                    </h2>

                    {/* Main Sentiment */}
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '30px',
                        padding: '20px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px'
                    }}>
                        <div style={{
                            fontSize: '3rem',
                            marginBottom: '10px'
                        }}>
                            {getSentimentEmoji(result.sentiment)}
                        </div>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: getSentimentColor(result.sentiment),
                            marginBottom: '10px'
                        }}>
                            {result.sentiment}
                        </div>
                        <div style={{
                            fontSize: '1.2rem',
                            color: '#7f8c8d'
                        }}>
                            Confidence: {(result.confidence * 100).toFixed(2)}%
                        </div>
                    </div>

                    {/* Probability Breakdown */}
                    {result.probabilities && (
                        <div>
                            <h3 style={{
                                marginBottom: '15px',
                                color: '#2c3e50'
                            }}>
                                Probability Breakdown:
                            </h3>
                            <div style={{
                                display: 'grid',
                                gap: '15px'
                            }}>
                                {Object.entries(result.probabilities).map(([sentiment, prob]) => (
                                    <div key={sentiment} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px',
                                        backgroundColor: sentiment === result.sentiment ? '#ecf0f1' : '#fff',
                                        borderRadius: '6px',
                                        border: sentiment === result.sentiment ? '2px solid' : '1px solid #ddd',
                                        borderColor: sentiment === result.sentiment ? getSentimentColor(sentiment) : '#ddd'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}>
                                            <span style={{ fontSize: '1.5rem' }}>
                                                {getSentimentEmoji(sentiment)}
                                            </span>
                                            <span style={{
                                                fontWeight: sentiment === result.sentiment ? 'bold' : 'normal',
                                                fontSize: '16px',
                                                color: sentiment === result.sentiment ? getSentimentColor(sentiment) : '#2c3e50'
                                            }}>
                                                {sentiment}
                                            </span>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '15px'
                                        }}>
                                            {/* Progress Bar */}
                                            <div style={{
                                                width: '200px',
                                                height: '20px',
                                                backgroundColor: '#ecf0f1',
                                                borderRadius: '10px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${prob * 100}%`,
                                                    height: '100%',
                                                    backgroundColor: getSentimentColor(sentiment),
                                                    transition: 'width 0.3s ease'
                                                }} />
                                            </div>
                                            <span style={{
                                                fontWeight: 'bold',
                                                fontSize: '16px',
                                                color: '#2c3e50',
                                                minWidth: '60px',
                                                textAlign: 'right'
                                            }}>
                                                {(prob * 100).toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Info Section */}
            <div style={{
                marginTop: '30px',
                padding: '20px',
                backgroundColor: '#e8f4f8',
                borderRadius: '8px',
                border: '1px solid #bee5eb'
            }}>
                <h3 style={{ marginTop: '0', color: '#2c3e50' }}>About This Model</h3>
                <p style={{ marginBottom: '10px', color: '#555', lineHeight: '1.6' }}>
                    This sentiment analysis model uses <strong>DistilBERT</strong>, a lightweight 
                    transformer model based on BERT. It's been fine-tuned to classify text into three categories:
                </p>
                <ul style={{ color: '#555', lineHeight: '1.8', marginBottom: '0' }}>
                    <li><strong>Positive:</strong> Text expressing positive emotions, satisfaction, or approval</li>
                    <li><strong>Negative:</strong> Text expressing negative emotions, dissatisfaction, or criticism</li>
                    <li><strong>Neutral:</strong> Text that is factual, balanced, or doesn't express strong sentiment</li>
                </ul>
            </div>

            {/* Comprehensive Model Explanation */}
            <SentimentModelExplanation />
        </div>
    );
};

export default SentimentManualText;

