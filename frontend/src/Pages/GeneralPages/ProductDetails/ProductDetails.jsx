import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import ProductQnA from './ProductQnA';

const ProductDetails = ({ product, onAddToCart }) => {

  const { t } = useTranslation();
  const loggedInUser = useSelector((state) => state.user.currentUser?.user);
  const userId = loggedInUser?.uid || 'guest';
  const sessionId = `product-${product._id}-${Date.now()}`;

  return (
    <div className="product-page-wrapper">
      <div className="product-container">
        <div className="product-image-container">
          {product.imageUrl && (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="product-image"
            />
          )}
        </div>
        
        <div className="product-info">
          <h2 className="product-title">{product.name}</h2>
          
          <div className="price-container">
            <span className="price-label">{t('product.price')}:</span>
            <span className="product-price"> ${product.price} </span>
          </div>
          
          <div className="stock-status">
            {product.stock > 0 ? (
              <span className="in-stock"> {t('product.inStock')} </span>
            ) : (
              <span className="out-of-stock"> {t('product.unavailable')} </span>
            )}
          </div>
          
          <p className="product-description">{product.description}</p>
          
          <div className="product-meta">
            <div className="meta-item">
              <span className="meta-label"> {t('product.category')}: </span>
              <span className="meta-value"> {product.category} </span>
            </div>
          </div>
          
          <button
            onClick={() => onAddToCart(product)}
            className="add-to-cart-btn"
            disabled={product.stock <= 0}
          >
             {product.stock > 0 ? t('product.addToCart') : t('product.outOfStock')}
          </button>
        </div>
      </div>

      {/* AI Product Q&A Sidebar */}
      <div className="qna-section">
        <ProductQnA 
          product={product} 
          userId={userId}
          sessionId={sessionId}
        />
      </div>

      <style jsx>{`
        .product-page-wrapper {
          max-width: 1200px;
          margin: 20px auto;
          padding: 20px;
        }

        .product-container {
          display: flex;
          background: white;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 20px;
          padding: 20px;
        }
        
        .product-image-container {
          flex: 0 0 350px;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #fafafa;
          border: 1px solid #ddd;
          margin-right: 30px;
        }
        
        .product-image {
          max-width: 100%;
          max-height: 300px;
          object-fit: contain;
        }
        
        .product-info {
          flex: 1;
          padding: 10px;
        }
        
        .product-title {
          font-size: 24px;
          font-weight: 400;
          color: #0F1111;
          margin-bottom: 10px;
        }
        
        .price-container {
          margin: 15px 0;
        }
        
        .price-label {
          font-size: 14px;
          color: #565959;
        }
        
        .product-price {
          font-size: 28px;
          color: #B12704;
          font-weight: 500;
          margin-left: 8px;
        }
        
        .stock-status {
          margin: 10px 0;
        }
        
        .in-stock {
          color: #007600;
          font-size: 18px;
        }
        
        .out-of-stock {
          color: #B12704;
          font-size: 18px;
        }
        
        .product-description {
          font-size: 14px;
          line-height: 20px;
          color: #0F1111;
          margin: 15px 0;
        }
        
        .product-meta {
          margin: 20px 0;
          font-size: 14px;
        }
        
        .meta-item {
          display: flex;
          margin-bottom: 8px;
        }
        
        .meta-label {
          color: #565959;
          min-width: 100px;
        }
        
        .meta-value {
          color: #0F1111;
        }
        
        .add-to-cart-btn {
          background: #FFD814;
          border: 1px solid #FCD200;
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 14px;
          color: #0F1111;
          cursor: pointer;
          width: 200px;
          margin-top: 20px;
          transition: background 0.2s;
        }
        
        .add-to-cart-btn:hover {
          background: #F7CA00;
        }
        
        .add-to-cart-btn:disabled {
          background: #DDD;
          border-color: #BBB;
          cursor: not-allowed;
        }
        
        .qna-section {
          width: 100%;
        }
        
        @media (max-width: 768px) {
          .product-container {
            flex-direction: column;
          }
          
          .product-image-container {
            margin-right: 0;
            margin-bottom: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductDetails;