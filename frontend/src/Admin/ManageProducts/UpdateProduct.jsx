import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router';
import toast from 'react-hot-toast';

const UpdateProduct = () => {
    const { id } = useParams();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState();
    const [stock, setStock] = useState();
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [currentImage, setCurrentImage] = useState('');

    // Fetch existing product data
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`/product/getProduct/${id}`);
                const product = response.data.product;
                
                setName(product.name || '');
                setDescription(product.description || '');
                setCategory(product.category || '');
                setPrice(product.price || 0);
                setStock(product.stock || 0);
                setCurrentImage(product.image || '');
                
                setIsLoadingData(false);
            } catch (error) {
                console.error('Error fetching product:', error);
                // toast.error('Failed to load product data');
                setIsLoadingData(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);
            formData.append("category", category);
            formData.append("price", price);
            formData.append("stock", stock);
            if (file) {
                formData.append("image", file);
            }

            const res = await axios.put(`/product/updateProduct/${id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            console.log("Product updated:", res.data);
            const productName = res.data?.product?.name || "Product";  
            toast.success(`${productName} updated successfully`);

        } catch (error) {
            console.error('Error updating product:', error);
            // toast.error('Failed to update product. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingData) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading product data...</p>
            </div>
        );
    }

    return (
        <div className="update-product-container">
            <h1 className="update-product-header">✏️ Update Product</h1>
            
            <form onSubmit={handleUpdateProduct} className="update-product-form">
                {/* Product Name */}
                <div className="form-group">
                    <label className="form-label">
                        Product Name <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter product name..."
                        // required
                        className={`form-input ${name ? 'filled' : ''}`}
                    />
                </div>

                {/* Description */}
                <div className="form-group">
                    <label className="form-label">
                        Description <span className="required">*</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter product description..."
                        // required
                        className={`form-textarea ${description ? 'filled' : ''}`}
                    />
                </div>

                {/* Category and Price Row */}
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">
                            Category <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g., Electronics, Laptops..."
                            // required
                            className={`form-input ${category ? 'filled' : ''}`}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Price (USD) <span className="required">*</span>
                        </label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            placeholder="0"
                            min="0"
                            // step="0.01"
                            // required
                            className={`form-input ${price > 0 ? 'filled' : ''}`}
                        />
                    </div>
                </div>

                {/* Stock and Image Row */}
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">
                            Stock Quantity <span className="required">*</span>
                        </label>
                        <input
                            type="number"
                            value={stock}
                            onChange={(e) => setStock(Number(e.target.value))}
                            placeholder="0"
                            min="0"
                            // required
                            className={`form-input ${stock >= 0 ? 'filled' : ''}`}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Product Image
                        </label>
                        <div className="file-input-container">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files[0])}
                                className={`form-file-input ${file ? 'filled' : ''}`}
                            />
                            {(file || currentImage) && (
                                <div className="file-preview">
                                    {file ? '📷' : '🖼️'}
                                </div>
                            )}
                        </div>
                        <p className="helper-text">
                            {currentImage ? 'Current image will be replaced. ' : ''}
                            Accepted formats: JPG, PNG, WEBP. Max size: 5MB
                        </p>
                    </div>
                </div>

                {/* Submit Button */}
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className={`submit-button ${isLoading ? 'loading' : ''}`}
                >
                    {isLoading ? (
                        <>
                            <div className="loading-spinner"></div>
                            Updating Product...
                        </>
                    ) : (
                        <>
                            ✏️ Update Product
                        </>
                    )}
                </button>
            </form>

            <style jsx>{`
                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 50vh;
                    gap: 20px;
                }

                .loading-container .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid rgba(52, 152, 219, 0.3);
                    border-top: 4px solid #3498db;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .loading-container p {
                    font-size: 1.1rem;
                    color: #6c757d;
                }

                .update-product-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: white;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(0, 0, 0, 0.05);
                }

                .update-product-header {
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: #2c3e50;
                    margin-bottom: 30px;
                    text-align: center;
                    padding-bottom: 15px;
                    border-bottom: 3px solid #e67e22;
                    display: inline-block;
                    width: 100%;
                }

                .update-product-form {
                    display: flex;
                    flex-direction: column;
                    gap: 25px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .form-label {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 5px;
                }

                .form-input, .form-textarea, .form-file-input {
                    padding: 15px 20px;
                    border: 2px solid #e9ecef;
                    border-radius: 10px;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    background-color: #f8f9fa;
                    outline: none;
                }

                .form-input.filled, .form-textarea.filled, .form-file-input.filled {
                    border-color: #e67e22;
                }

                .form-textarea {
                    min-height: 120px;
                    resize: vertical;
                    font-family: inherit;
                }

                .form-file-input {
                    cursor: pointer;
                }

                .file-input-container {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .file-preview {
                    width: 80px;
                    height: 80px;
                    border-radius: 10px;
                    object-fit: cover;
                    border: 2px solid #e9ecef;
                    background-color: #f8f9fa;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    color: #6c757d;
                }

                .submit-button {
                    padding: 15px 30px;
                    background-color: #e67e22;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    margin-top: 20px;
                }

                .submit-button:hover:not(.loading) {
                    background-color: #d35400;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(230, 126, 34, 0.3);
                }

                .submit-button.loading {
                    background-color: #bdc3c7;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .required {
                    color: #e74c3c;
                    margin-left: 5px;
                }

                .helper-text {
                    font-size: 0.9rem;
                    color: #6c757d;
                    margin-top: 5px;
                }

                .loading-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .update-product-container {
                        margin: 10px;
                        padding: 15px;
                        border-radius: 10px;
                    }
                    
                    .update-product-header {
                        font-size: 2rem;
                        margin-bottom: 25px;
                        padding-bottom: 12px;
                    }
                    
                    .update-product-form {
                        gap: 20px;
                    }
                    
                    .form-row {
                        grid-template-columns: 1fr;
                        gap: 15px;
                    }
                    
                    .form-input, .form-textarea, .form-file-input {
                        padding: 12px 15px;
                        font-size: 0.95rem;
                        border-radius: 8px;
                    }
                    
                    .form-textarea {
                        min-height: 100px;
                    }
                    
                    .submit-button {
                        padding: 12px 25px;
                        font-size: 1rem;
                        border-radius: 8px;
                        margin-top: 15px;
                    }
                    
                    .file-input-container {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 10px;
                    }
                    
                    .file-preview {
                        width: 60px;
                        height: 60px;
                        font-size: 1.5rem;
                        border-radius: 8px;
                    }
                }

                @media (max-width: 480px) {
                    .update-product-container {
                        margin: 5px;
                        padding: 10px;
                        border-radius: 8px;
                    }
                    
                    .update-product-header {
                        font-size: 1.8rem;
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                    }
                    
                    .update-product-form {
                        gap: 15px;
                    }
                    
                    .form-group {
                        gap: 6px;
                    }
                    
                    .form-label {
                        font-size: 0.95rem;
                    }
                    
                    .form-input, .form-textarea, .form-file-input {
                        padding: 10px 12px;
                        font-size: 0.9rem;
                        border-radius: 6px;
                    }
                    
                    .form-textarea {
                        min-height: 80px;
                    }
                    
                    .submit-button {
                        padding: 10px 20px;
                        font-size: 0.95rem;
                        border-radius: 6px;
                        margin-top: 10px;
                    }
                    
                    .loading-spinner {
                        width: 16px;
                        height: 16px;
                    }
                    
                    .file-preview {
                        width: 50px;
                        height: 50px;
                        font-size: 1.2rem;
                        border-radius: 6px;
                    }
                    
                    .helper-text {
                        font-size: 0.8rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default UpdateProduct;