import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { auth } from '../../Services/Firebase';
import { toast } from "react-hot-toast"
import { useRef } from 'react';

const CreateProduct = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [file, setFile] = useState(null); // image file
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const currentUser = useSelector((state) => state.user.currentUser);

  const resetForm = () => {
    setName(""); 
    setDescription(""); 
    setCategory(""); 
    setPrice(""); 
    setStock(""); 
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  }

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!currentUser) {
      console.log("No current user found in Redux state");
      setIsLoading(false);
      return;
    }

    if (!file) {
      toast.error("Please select an image.");
      setIsLoading(false);
      return;
    }

    try {
      const idToken = await auth.currentUser.getIdToken();
      if (!idToken) {
        console.log("No ID token found");
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('price', price);
      formData.append('stock', stock);
      formData.append('image', file); // image file

      const result = await axios.post("/product/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${idToken}`
        }
      });

      console.log("Product created:", result.data);
      const productName = result.data?.product?.name || "Product";  
      toast.success(`${productName} created successfully`);
      if (result.data.cache) {
        toast.success(result.data.cache); // "Cache invalidated"
      }
      resetForm();

    } catch (error) {
      console.log("Error creating a product", error.response?.data || error.message);
      toast.error("Failed to create product. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-product-container">
      <h1 className="create-product-header">➕ Create New Product</h1>
      
      <form onSubmit={handleCreateProduct} className="create-product-form">
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
            required
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
            required
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
              required
              className={`form-input ${category ? 'filled' : ''}`}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Price (PKR) <span className="required">*</span>
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
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
              required
              className={`form-input ${stock >= 0 ? 'filled' : ''}`}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Product Image <span className="required">*</span>
            </label>
            <div className="file-input-container">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
                ref={fileInputRef}
                required
                className={`form-file-input ${file ? 'filled' : ''}`}
              />
              {file && (
                <div className="file-preview">
                  📷
                </div>
              )}
            </div>
            <p className="helper-text">
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
              Creating Product...
            </>
          ) : (
            <>
              🚀 Create Product
            </>
          )}
        </button>
      </form>

      <style jsx>{`
        .create-product-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: white;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .create-product-header {
          font-size: 2.5rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 30px;
          text-align: center;
          padding-bottom: 15px;
          border-bottom: 3px solid #3498db;
          display: inline-block;
          width: 100%;
        }

        .create-product-form {
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
          border-color: #3498db;
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
          background-color: #3498db;
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
          background-color: #2980b9;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(52, 152, 219, 0.3);
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
          .create-product-container {
            margin: 10px;
            padding: 15px;
            border-radius: 10px;
          }
          
          .create-product-header {
            font-size: 2rem;
            margin-bottom: 25px;
            padding-bottom: 12px;
          }
          
          .create-product-form {
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
          .create-product-container {
            margin: 5px;
            padding: 10px;
            border-radius: 8px;
          }
          
          .create-product-header {
            font-size: 1.8rem;
            margin-bottom: 20px;
            padding-bottom: 10px;
          }
          
          .create-product-form {
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

export default CreateProduct;
