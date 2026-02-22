

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaShoppingCart, FaChevronDown, FaChevronUp, FaTrash } from 'react-icons/fa';
import { FiShoppingCart } from 'react-icons/fi';
import {
  addToCart,
  clearCart,
  removeItemFromCart,
} from '@Redux/reducers/guestCartSlice';
import { useTranslation } from 'react-i18next';


const Cart = () => {

  const { t } = useTranslation();

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const loggedInUser = useSelector((state) => state.user.currentUser?.user);
  const uid = loggedInUser?.uid;

  const guestCart = useSelector((state) => state.guestCart.cart);
  const [cart, setCart] = useState(null);

  const handleCart = async () => {
    try {
      if (loggedInUser) {
        const res = await axios.get(`/cart/getCart?uid=${uid}`);
        setCart(res.data);
      } else {
        const guestFormatted = guestCart.map((item) => ({
          _id: item.productId,
          quantity: item.quantity,
          product: {
            name: item.productName,
            description: item.productDescription,
            price: item.productPrice,
            stock: item.productStock,
            imageUrl: item.productimageUrl,
          },
        }));
        setCart({ items: guestFormatted });
      }
    } catch (error) {
      console.error('Error fetching cart:', error.message);
    }
  };

  useEffect(() => {
    handleCart();
  }, [loggedInUser, guestCart]);

  const getTotalPrice = () =>
    cart?.items?.reduce((total, item) => {
      return item.product ? total + item.product.price * item.quantity : total;
    }, 0) || 0;

  const getItemCount = () => 
    cart?.items?.reduce((count, item) => count + item.quantity, 0) || 0;

  const handleRemoveItem = async (id) => {
    try {
      if (loggedInUser) {
        await axios.post('/cart/removeItem', { id });
      } else {
        dispatch(removeItemFromCart(id));
      }
      toast.success(t('Cart.itemRemoved'));
      handleCart();
    } catch (error) {
      console.error('Error removing item:', error.message);
    }
  };

  const handleDecreaseQuantity = async (id) => {
    try {
      if (loggedInUser) {
        await axios.post('/cart/decreaseQuantity', { id });
        handleCart();
      } else {
        dispatch(addToCart({ productId: id, quantity: -1 }));
      }
      // toast.success('Quantity decreased');
    } catch (error) {
      console.error('Error decreasing quantity:', error.message);
    }
  };

  const handleIncreaseQuantity = async (id) => {
    try {
      if (loggedInUser) {
        await axios.post('/cart/increaseQuantity', { id });
        handleCart();
      } else {
        dispatch(addToCart({ productId: id, quantity: 1 }));
      }
      // toast.success('Quantity increased');
    } catch (error) {
      console.error('Error increasing quantity:', error.message);
    }
  };

  const handleClearCart = async () => {
    try {
      if (loggedInUser) {
        await axios.delete(`/cart/clearCart/${uid}`);
      } else {
        dispatch(clearCart());
      }
      toast.success(t('Cart.cartCleared'));
      setCart({ items: [] });
    } catch (error) {
      console.error('Error clearing cart:', error.message);
    }
  };

  const goToShipping = () => {
    if (!cart || cart.items.length === 0) {
      return toast.error(t('Cart.cartEmpty'));
    }
    navigate('/addShipping');
  };

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>{t('cart.title')}</h1>
        <div className="price-header">Price</div>
      </div>

      {cart?.items?.length > 0 ? (
        <div className="cart-content">
          <div className="items-section">
            {cart.items.map((item) => {
              const product = item.product;
              if (!product) return null;

              const isDecreaseDisabled = item.quantity === 1;
              const isIncreaseDisabled = item.quantity >= product.stock;

              return (
                <div key={item._id} className="cart-item">
                  <div className="item-image-container">
                    <img src={product.imageUrl}
                      alt={product.name}
                      className="item-image"
                    />
                  </div>
                  
                  <div className="item-details">
                    <div className="item-title">{product.name}</div>
                    <div className="item-stock">{t('cart.inStock')}</div>
                    <div className="item-actions">
                      <div className="quantity-selector">

                  <button onClick={() => handleDecreaseQuantity(item._id)} disabled={isDecreaseDisabled}

                          className={`quantity-btn ${isDecreaseDisabled ? 'disabled' : ''}`} > <FaChevronDown size={12} />  </button>
                          
                       
                        <span className="quantity-value">{item.quantity}</span>

                        <button onClick={() => handleIncreaseQuantity(item._id)} disabled={isIncreaseDisabled}
                          className={`quantity-btn ${isIncreaseDisabled ? 'disabled' : ''}`} > <FaChevronUp size={12} /> </button>
                        
                      </div>
                      <span className="divider">|</span>

                      <button onClick={() => handleRemoveItem(item._id)}  className="delete-btn" > <FaTrash /> {t('cart.delete')} </button>
                       
                      
                    </div>
                  </div>
                  
                  <div className="item-price">
                    <div className="price-amount">${product.price.toFixed(2)}</div>
                    <div className="price-subtotal">
                      ${(product.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="subtotal-section">
              <div className="subtotal-line">
                {t('cart.subtotal')} ({getItemCount()} {t('cart.items')}): 
                <span className="subtotal-amount">${getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="checkout-section">
            <div className="checkout-card">
              <div className="subtotal-line">
                 {t('cart.subtotal')}  ({getItemCount()} {t('cart.items')}): 
                <span className="subtotal-amount">${getTotalPrice().toFixed(2)}</span>
              </div>
              <button 
                onClick={goToShipping}
                className="checkout-btn"
              >
                {t('cart.checkout')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-cart">
          <FiShoppingCart size={60} className="cart-icon" />
          <h2>{t('cart.emptyCart')}</h2>
          <button 
            onClick={() => navigate('/')}
            className="shop-btn"
          >
            {t('cart.shopDeals')} 
          </button>
        </div>
      )}

      <style jsx>{`
        .cart-container {
          max-width: 1200px;
          margin: 20px auto;
          padding: 0 20px;
          font-family: 'Amazon Ember', Arial, sans-serif;
        }
        
        .cart-header {
          display: flex;
          justify-content: space-between;
          padding-bottom: 10px;
          border-bottom: 1px solid #ddd;
          margin-bottom: 20px;
        }
        
        .cart-header h1 {
          font-size: 28px;
          font-weight: 400;
          color: #0F1111;
        }
        
        .price-header {
          font-size: 14px;
          color: #565959;
        }
        
        .cart-content {
          display: flex;
          gap: 20px;
        }
        
        .items-section {
          flex: 1;
        }
        
        .checkout-section {
          width: 300px;
        }
        
        .cart-item {
          display: flex;
          padding: 20px 0;
          border-bottom: 1px solid #ddd;
          gap: 20px;
        }
        
        .item-image-container {
          width: 180px;
          height: 180px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: white;
          padding: 10px;
        }
        
        .item-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        
        .item-details {
          flex: 1;
        }
        
        .item-title {
          font-size: 18px;
          color: #0066c0;
          margin-bottom: 5px;
          font-weight: 400;
        }
        
        .item-stock {
          color: #007600;
          font-size: 12px;
          margin-bottom: 10px;
        }
        
        .item-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 15px;
        }
        
        .quantity-selector {
          display: flex;
          align-items: center;
          border: 1px solid #ddd;
          border-radius: 7px;
          overflow: hidden;
        }
        
        .quantity-btn {
          background: #f0f2f2;
          border: none;
          padding: 5px 10px;
          cursor: pointer;
          color: #555;
        }
        
        .quantity-btn.disabled {
          color: #ccc;
          cursor: not-allowed;
        }
        
        .quantity-btn:hover:not(.disabled) {
          background: #e3e6e6;
        }
        
        .quantity-value {
          padding: 0 10px;
          font-size: 14px;
          min-width: 20px;
          text-align: center;
          border-left: 1px solid #ddd;
          border-right: 1px solid #ddd;
        }
        
        .divider {
          color: #ddd;
        }

        
        
        .delete-btn {
          background: none;
          border: none;
          color: #0066c0;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .delete-btn:hover {
          text-decoration: underline;
          color: #c45500;
        }
        
        .item-price {
          width: 120px;
          text-align: right;
        }
        
        .price-amount {
          font-size: 18px;
          font-weight: 500;
        }
        
        .price-subtotal {
          font-size: 12px;
          color: #565959;
          margin-top: 5px;
        }
        
        .subtotal-section {
          text-align: right;
          padding: 20px 0;
          border-bottom: 1px solid #ddd;
        }
        
        .subtotal-line {
          font-size: 18px;
        }
        
        .subtotal-amount {
          font-weight: 700;
          margin-left: 5px;
        }
        
        .checkout-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .checkout-btn {
          background: #FFD814;
          border: 1px solid #FCD200;
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          font-size: 13px;
          margin-top: 15px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .checkout-btn:hover {
          background: #F7CA00;
        }
        
        .empty-cart {
          text-align: center;
          padding: 40px 0;
        }
        
        .cart-icon {
          // color: #ddd;
          margin-bottom: 20px;
        }
        
        .empty-cart h2 {
          font-size: 24px;
          font-weight: 400;
          margin-bottom: 15px;
          color: #0F1111;
        }
        
        .shop-btn {
          background: #FFA41C;
          border: 1px solid #FF8F00;
          padding: 8px 20px;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
        }
        
        .shop-btn:hover {
          background: #FA8900;
        }
        
        @media (max-width: 768px) {
          .cart-content {
            flex-direction: column;
          }
          
          .checkout-section {
            width: 100%;
          }
          
          .cart-item {
            flex-direction: column;
            gap: 15px;
          }
          
          .item-image-container {
            width: 100%;
            height: auto;
          }
          
          .item-price {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
};

export default Cart;