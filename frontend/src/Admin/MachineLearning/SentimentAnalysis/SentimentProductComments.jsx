import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const SENTIMENT_API_ENDPOINT = '/prediction/sentiment';
const PRODUCTS_API_ENDPOINT = '/product/getAllProducts';
const COMMENTS_API_ENDPOINT = '/comment/product';

const SentimentProductComments = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [analyzingComments, setAnalyzingComments] = useState(false);
    const [commentResults, setCommentResults] = useState([]);
    const [error, setError] = useState(null);

    // Search products
    const searchProducts = useCallback(async () => {
        if (!searchQuery.trim()) {
            setProducts([]);
            return;
        }

        setSearchLoading(true);
        try {
            const response = await axios.get(PRODUCTS_API_ENDPOINT, {
                params: { search: searchQuery, limit: 20 }
            });
            setProducts(response.data.products || []);
        } catch (err) {
            console.error('Error searching products:', err);
        } finally {
            setSearchLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim()) {
                searchProducts();
            } else {
                setProducts([]);
            }
        }, 300); // Debounce search

        return () => clearTimeout(timer);
    }, [searchQuery, searchProducts]);

    // Fetch comments for selected product
    const fetchProductComments = async (productId) => {
        setCommentsLoading(true);
        setComments([]);
        setCommentResults([]);
        setError(null);
        try {
            const response = await axios.get(`${COMMENTS_API_ENDPOINT}/${productId}`, {
                params: { limit: 100 } // Get up to 100 comments
            });
            const fetchedComments = response.data.comments || [];
            // Filter comments that have actual text (not just ratings)
            const commentsWithText = fetchedComments.filter(c => c.comment && c.comment.trim());
            setComments(commentsWithText);
        } catch (err) {
            console.error('Error fetching comments:', err);
            setError('Failed to fetch comments for this product');
        } finally {
            setCommentsLoading(false);
        }
    };

    // Select a product
    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        fetchProductComments(product._id);
    };

    // Analyze all comments for selected product
    const analyzeAllComments = async () => {
        if (!comments.length) {
            setError('No comments available to analyze');
            return;
        }

        setAnalyzingComments(true);
        setCommentResults([]);
        setError(null);

        try {
            const results = [];
            let positiveCount = 0;
            let negativeCount = 0;
            let neutralCount = 0;
            let totalConfidence = 0;

            // Analyze each comment (with delay to avoid overwhelming the API)
            for (let i = 0; i < comments.length; i++) {
                const comment = comments[i];
                try {
                    const response = await axios.post(SENTIMENT_API_ENDPOINT, {
                        text: comment.comment
                    });

                    const sentimentData = response.data;
                    results.push({
                        comment: comment,
                        sentiment: sentimentData.sentiment,
                        confidence: sentimentData.confidence,
                        probabilities: sentimentData.probabilities
                    });

                    // Count sentiments
                    if (sentimentData.sentiment === 'Positive') positiveCount++;
                    else if (sentimentData.sentiment === 'Negative') negativeCount++;
                    else neutralCount++;

                    totalConfidence += sentimentData.confidence;

                    // Small delay to avoid rate limiting
                    if (i < comments.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                } catch (err) {
                    console.error(`Error analyzing comment ${i}:`, err);
                    results.push({
                        comment: comment,
                        sentiment: 'Error',
                        confidence: 0,
                        error: true
                    });
                }
            }

            const averageConfidence = totalConfidence / results.length;
            setCommentResults({
                individual: results,
                summary: {
                    total: comments.length,
                    positive: positiveCount,
                    negative: negativeCount,
                    neutral: neutralCount,
                    averageConfidence: averageConfidence
                }
            });
        } catch (err) {
            setError('Failed to analyze comments');
            console.error('Error analyzing comments:', err);
        } finally {
            setAnalyzingComments(false);
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
            maxWidth: '1200px', 
            margin: '0 auto',
            fontFamily: 'Arial, sans-serif'
        }}>
            <h1 style={{ 
                marginBottom: '10px',
                color: '#2c3e50'
            }}>
                 Sentiment Analysis - Product Comments
            </h1>
            <p style={{ 
                color: '#555', 
                marginBottom: '30px',
                fontSize: '16px'
            }}>
                Search for a product and analyze the sentiment of all its customer comments.
            </p>

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

            {/* Product Search */}
            <div style={{
                marginBottom: '30px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
            }}>
                <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontWeight: 'bold',
                    color: '#2c3e50'
                }}>
                    Search for a Product:
                </label>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type product name to search..."
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '16px',
                        border: '2px solid #ddd',
                        borderRadius: '6px',
                        boxSizing: 'border-box'
                    }}
                />
                
                {/* Product List */}
                {searchLoading && (
                    <div style={{ padding: '10px', color: '#666' }}>Searching...</div>
                )}
                
                {products.length > 0 && (
                    <div style={{
                        marginTop: '15px',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        backgroundColor: 'white'
                    }}>
                        {products.map(product => (
                            <div
                                key={product._id}
                                onClick={() => handleSelectProduct(product)}
                                style={{
                                    padding: '15px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #eee',
                                    backgroundColor: selectedProduct?._id === product._id ? '#e3f2fd' : 'white',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedProduct?._id !== product._id) {
                                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedProduct?._id !== product._id) {
                                        e.currentTarget.style.backgroundColor = 'white';
                                    }
                                }}
                            >
                                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                                    {product.name}
                                </div>
                                <div style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
                                    ${product.price} • {product.category}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected Product Info */}
            {selectedProduct && (
                <div style={{
                    marginBottom: '30px',
                    padding: '20px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '8px',
                    border: '2px solid #3498db'
                }}>
                    <h3 style={{ marginTop: '0', color: '#2c3e50' }}>
                        Selected Product: {selectedProduct.name}
                    </h3>
                    <p style={{ color: '#666', marginBottom: '10px' }}>
                        Price: ${selectedProduct.price} • Category: {selectedProduct.category}
                    </p>
                    
                    {commentsLoading && (
                        <div style={{ color: '#666' }}>Loading comments...</div>
                    )}
                    
                    {!commentsLoading && comments.length > 0 && (
                        <div>
                            <p style={{ marginBottom: '15px', fontWeight: 'bold' }}>
                                Found {comments.length} comment{comments.length !== 1 ? 's' : ''} with text
                            </p>
                            <button
                                onClick={analyzeAllComments}
                                disabled={analyzingComments}
                                style={{
                                    padding: '12px 30px',
                                    fontSize: '16px',
                                    cursor: analyzingComments ? 'not-allowed' : 'pointer',
                                    backgroundColor: analyzingComments ? '#bdc3c7' : '#27ae60',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {analyzingComments ? `Analyzing... (${commentResults.individual?.length || 0}/${comments.length})` : 'Analyze All Comments'}
                            </button>
                        </div>
                    )}
                    
                    {!commentsLoading && comments.length === 0 && (
                        <p style={{ color: '#666' }}>No comments with text found for this product.</p>
                    )}
                </div>
            )}

            {/* Comment Analysis Results */}
            {commentResults.summary && (
                <div style={{
                    marginBottom: '30px',
                    padding: '25px',
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ marginTop: '0', color: '#2c3e50' }}>
                        Sentiment Summary
                    </h2>
                    
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '20px',
                        marginBottom: '30px'
                    }}>
                        <div style={{
                            padding: '20px',
                            backgroundColor: '#e8f5e9',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>😊</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#27ae60' }}>
                                {commentResults.summary.positive}
                            </div>
                            <div style={{ color: '#666' }}>Positive</div>
                        </div>
                        
                        <div style={{
                            padding: '20px',
                            backgroundColor: '#fff3e0',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>😐</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f39c12' }}>
                                {commentResults.summary.neutral}
                            </div>
                            <div style={{ color: '#666' }}>Neutral</div>
                        </div>
                        
                        <div style={{
                            padding: '20px',
                            backgroundColor: '#ffebee',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>😞</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e74c3c' }}>
                                {commentResults.summary.negative}
                            </div>
                            <div style={{ color: '#666' }}>Negative</div>
                        </div>
                        
                        <div style={{
                            padding: '20px',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#34495e' }}>
                                {(commentResults.summary.averageConfidence * 100).toFixed(1)}%
                            </div>
                            <div style={{ color: '#666' }}>Avg Confidence</div>
                        </div>
                    </div>

                    {/* Individual Comment Results */}
                    <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>
                        Individual Comment Analysis:
                    </h3>
                    <div style={{
                        maxHeight: '500px',
                        overflowY: 'auto',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        padding: '10px'
                    }}>
                        {commentResults.individual.map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '15px',
                                    marginBottom: '10px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '6px',
                                    borderLeft: `4px solid ${getSentimentColor(item.sentiment)}`
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'start',
                                    marginBottom: '10px'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            marginBottom: '5px'
                                        }}>
                                            <span style={{ fontSize: '1.2rem' }}>
                                                {getSentimentEmoji(item.sentiment)}
                                            </span>
                                            <span style={{
                                                fontWeight: 'bold',
                                                color: getSentimentColor(item.sentiment)
                                            }}>
                                                {item.sentiment}
                                            </span>
                                            {!item.error && (
                                                <span style={{ color: '#666', fontSize: '14px' }}>
                                                    ({(item.confidence * 100).toFixed(1)}% confidence)
                                                </span>
                                            )}
                                        </div>
                                        <div style={{
                                            color: '#333',
                                            marginTop: '10px',
                                            fontStyle: 'italic'
                                        }}>
                                            "{item.comment.comment}"
                                        </div>
                                        {item.comment.rating && (
                                            <div style={{
                                                color: '#666',
                                                fontSize: '14px',
                                                marginTop: '5px'
                                            }}>
                                                Rating: {item.comment.rating}/5 ⭐
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
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
                <h3 style={{ marginTop: '0', color: '#2c3e50' }}>About Product Comment Analysis</h3>
                <p style={{ marginBottom: '10px', color: '#555', lineHeight: '1.6' }}>
                    This tool analyzes customer comments for products using our <strong>DistilBERT</strong> sentiment analysis model.
                    It provides both aggregate statistics and individual comment analysis to help you understand customer sentiment.
                </p>
                <ul style={{ color: '#555', lineHeight: '1.8', marginBottom: '0' }}>
                    <li>Search for any product in your store</li>
                    <li>View all comments with text content</li>
                    <li>Analyze sentiment for all comments at once</li>
                    <li>See summary statistics and individual results</li>
                </ul>
            </div>
        </div>
    );
};

export default SentimentProductComments;

