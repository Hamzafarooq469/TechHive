import React, { useState, useEffect } from 'react';
import GetShipping from './GetShipping';
import { useSelector } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { addToCart, removeItemFromCart } from '@Redux/reducers/guestCartSlice'; 
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router';
import { setOrderId } from '@Redux/reducers/orderIdSlice';
import { useTranslation } from 'react-i18next';
import { FaChevronDown, FaChevronUp, FaTrash } from 'react-icons/fa';


const VALIDATE_COUPON_ENDPOINT = '/coupon/validate';

const Order = () => {

    const { t } = useTranslation();
    const navigate = useNavigate("");
    const dispatch = useDispatch();

    const [selectedShippingId, setSelectedShippingId] = useState(null);
    
    // UI/Coupon States
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponLoading, setCouponLoading] = useState(false);
    
    // Data States
    const [cartItems, setCartItems] = useState([]);
    const [originalCartTotal, setOriginalCartTotal] = useState(0); 
    const [itemCount, setItemCount] = useState(0);
    const [pageLoading, setPageLoading] = useState(true);

    const loggedInUser = useSelector((state) => state.user.currentUser?.user);
    const uid = loggedInUser?.uid;
    const guestShipping = useSelector((state) => state.guestShipping?.shipping);
    const guestCart = useSelector((state) => state.guestCart.cart);



    const fetchCartData = async () => {
        let items = [];
        let total = 0;
        let count = 0;

        if (loggedInUser) {
            try {
                const res = await axios.get(`/cart/getCart?uid=${uid}`);
                items = res.data.items;
                total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
                count = items.reduce((sum, item) => sum + item.quantity, 0);
            } catch (error) {
                console.error("Failed to fetch logged-in cart total:", error);
            }
        } else {
            items = guestCart.map(item => ({
                _id: item.productId, 
                quantity: item.quantity,
                product: {
                    name: item.productName,
                    price: item.productPrice,
                    stock: item.productStock,
                    imageUrl: item.productimageUrl,
                },
            }));
            total = guestCart.reduce((sum, item) => sum + (item.productPrice * item.quantity), 0);
            count = guestCart.reduce((sum, item) => sum + item.quantity, 0);
        }
        
        setCartItems(items);
        setOriginalCartTotal(total);
        setItemCount(count);
        setPageLoading(false);
    };

    useEffect(() => {
        fetchCartData();
    }, [loggedInUser, uid, guestCart]); 

    const finalTotalAmount = appliedCoupon ? appliedCoupon.newTotal : originalCartTotal;



    const handleRemoveItem = async (id) => {
        try {
            if (loggedInUser) {
                await axios.post('/cart/removeItem', { id });
                fetchCartData(); // Manually refetch to update UI
            } else {
                dispatch(removeItemFromCart(id)); 
            }
            toast.success(t('Cart.itemRemoved'));
        } catch (error) {
            console.error('Error removing item:', error.message);
        }
    };
    
    const handleDecreaseQuantity = async (id) => {
        try {
            if (loggedInUser) {
                await axios.post('/cart/decreaseQuantity', { id });
                fetchCartData(); // Manually refetch to update UI
            } else {
                dispatch(addToCart({ productId: id, quantity: -1 })); 
            }
        } catch (error) {
            console.error('Error decreasing quantity:', error.message);
        }
    };

    const handleIncreaseQuantity = async (id) => {
        try {
            if (loggedInUser) {
                await axios.post('/cart/increaseQuantity', { id });
                fetchCartData(); // Manually refetch to update UI
            } else {
                dispatch(addToCart({ productId: id, quantity: 1 }));
            }
        } catch (error) {
            console.error('Error increasing quantity:', error.message);
        }
    };
    
    // ... (handleApplyCoupon and handleOrder functions remain the same) ...

    const handleApplyCoupon = async () => {
        if (!couponInput) { setAppliedCoupon(null); return; }
        setCouponLoading(true);
        setAppliedCoupon(null);
        
        if (originalCartTotal <= 0) {
            toast.error("Cart is empty or total is zero.");
            setCouponLoading(false);
            return;
        }

        try {
            const payload = { code: couponInput, userId: uid || uuidv4(), cartTotal: originalCartTotal };
            const res = await axios.post(VALIDATE_COUPON_ENDPOINT, payload);
            
            if (res.data.valid) {
                setAppliedCoupon({
                    code: couponInput,
                    discount: res.data.discount,
                    newTotal: res.data.newTotal,
                    type: res.data.couponType,
                    cashbackValue: res.data.cashbackValue || 0,
                    originalTotal: originalCartTotal 
                });
                toast.success("Coupon applied! Discount calculated.");
            } else {
                toast.error(res.data.message || "Coupon validation failed.");
                setAppliedCoupon(null);
            }

        } catch (error) {
            const msg = error.response?.data?.message || "Invalid or expired coupon.";
            toast.error(msg);
            setAppliedCoupon(null);
        } finally {
            setCouponLoading(false);
        }
    };


    const handleOrder = async () => {
        try {
            if (!selectedShippingId) { return alert("Please select a shipping address!"); }
            if (originalCartTotal <= 0) { return alert("Cart is empty!"); }

            let orderPayload;
            let endpoint;

            if (loggedInUser) {
                const cartResponse = await axios.get(`/cart/getCart?uid=${uid}`);
                orderPayload = {
                    userId: uid,
                    cartId: cartResponse.data._id,
                    shippingId: selectedShippingId,
                    couponCode: appliedCoupon?.code || null 
                };
                endpoint = "/order/createOrder";
            } else {
                const guestUid = uuidv4();
                orderPayload = {
                    userId: guestUid,
                    // For guest, item._id is the Product ID
                    cartItems: cartItems.map(item => ({ 
                        productId: item._id, 
                        quantity: item.quantity, 
                        price: item.product.price 
                    })),
                    shipping: guestShipping,
                    couponCode: appliedCoupon?.code || null 
                };
                endpoint = "/order/createOrder/guest";
            }
            
            const res = await axios.post(endpoint, orderPayload);
            dispatch(setOrderId(res.data.order._id));
            toast.success("Order placed successfully!");
            navigate("/orderSummary");

        } catch (error) {
            console.error("Order creation failed:", error.message);
            alert("Something went wrong. Please try again.");
        }
    };

    if (pageLoading) {
        return <div className="cart-container loading-state">Loading your order details...</div>;
    }
    
    if (cartItems.length === 0) {
        return <div className="cart-container empty-state">Your cart is empty!</div>;
    }


    return (
        <div className="cart-container">
            <h1>Order Review</h1>
            
            {/* TWO-COLUMN FLEX WRAPPER */}
            <div className="cart-content">
                
                {/* ------------------------------------------------------- */}
                {/* LEFT COLUMN: ITEM LIST */}
                {/* ------------------------------------------------------- */}
                <div className="items-section">
                    <div className="cart-header-list">
                        <h2>{t('cart.title')} ({itemCount} Items)</h2>
                        {/* <div className="price-header">Price</div> */}
                    </div>

                    <div className="items-list-wrapper">
                        {cartItems.map((item) => {
                            const isDecreaseDisabled = item.quantity === 1;
                            const isIncreaseDisabled = item.quantity >= item.product.stock;
                            
                            // The ID used for action depends on user state: Subdocument ID (logged in) or Product ID (guest)
                            const idForAction = item._id; 

                            return (
                            <div key={item.product._id} className="cart-item">
                                <div className="item-image-container">
                                    <img src={item.product.imageUrl} alt={item.product.name} className="item-image" />
                                </div>
                                
                                <div className="item-details">
                                    <div className="item-title">{item.product.name}</div>
                                    <div className="item-stock">{t('cart.inStock')}</div>
                                    <div className="item-actions">
                                        
                                        {/* ✅ QUANTITY SELECTOR UI */}
                                        <div className="quantity-selector">
                                            <button 
                                                onClick={() => handleDecreaseQuantity(idForAction)} 
                                                disabled={isDecreaseDisabled}
                                                className={`quantity-btn ${isDecreaseDisabled ? 'disabled' : ''}`}
                                            > 
                                                <FaChevronDown size={12} /> 
                                            </button>
                                            <span className="quantity-value">{item.quantity}</span>
                                            <button 
                                                onClick={() => handleIncreaseQuantity(idForAction)} 
                                                disabled={isIncreaseDisabled}
                                                className={`quantity-btn ${isIncreaseDisabled ? 'disabled' : ''}`}
                                            > 
                                                <FaChevronUp size={12} /> 
                                            </button>
                                        </div>

                                        <span className="divider">|</span>
                                        <button onClick={() => handleRemoveItem(idForAction)} className="delete-btn">
                                            <FaTrash size={12} /> {t('cart.delete')}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="item-price-col">
                                    <div className="price-amount">${item.product.price.toFixed(2)}</div>
                                    <div className="price-subtotal">
                                        Subtotal: ${(item.product.price * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        )})}
                    </div>
                </div>

                {/* ------------------------------------------------------- */}
                {/* RIGHT COLUMN: SUMMARY & ACTIONS */}
                {/* ------------------------------------------------------- */}
                <div className="checkout-section">
                    
                    {/* 1. Coupon Input */}
                    <div className="coupon-section">
                        <input 
                            type="text" 
                            placeholder="Enter Coupon Code" 
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            className="coupon-input"
                            disabled={couponLoading}
                        />
                        <button onClick={handleApplyCoupon} disabled={couponLoading || !couponInput} className="coupon-button">
                            {couponLoading ? 'Checking...' : 'Apply Coupon'}
                        </button>
                    </div>
                    
                    {/* 2. Final Total Summary Box */}
                    <div className="checkout-card total-summary-box">
                        
                        <div className="summary-line subtotal-line">
                            <span className="label subtotal-label">{t('cart.subtotal')} ({itemCount} {t('cart.items')}):</span>
                            {appliedCoupon ? (
                                <span className="value subtotal-amount original-strike">${originalCartTotal.toFixed(2)}</span>
                            ) : (
                                <span className="value subtotal-amount">${originalCartTotal.toFixed(2)}</span>
                            )}
                        </div>

                        {appliedCoupon && (
                            <>
                                <div className="summary-line discount-line">
                                    <span className="label coupon-label">Coupon ({appliedCoupon.code}):</span>
                                    <span className="value discount-value">-${appliedCoupon.discount.toFixed(2)}</span>
                                </div>
                                {appliedCoupon.type === 'CASHBACK' && (
                                    <div className="summary-line cashback-line">
                                        <span className="label">Cashback Earned:</span>
                                        <span className="value cashback-value">${appliedCoupon.cashbackValue.toFixed(2)}</span>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="summary-line final-amount">
                            <span className="label final-label">Total Amount Due:</span>
                            <span className="value final-amount-value">${finalTotalAmount.toFixed(2)}</span>
                        </div>
                        
                    </div>

                    {/* 3. Shipping Selection */}
                    <div className="shipping-selection-wrapper">
                        <GetShipping onSelectShipping={setSelectedShippingId} /> 
                    </div>
                    
                    {/* 4. Final Order Button */}
                    {selectedShippingId && (
                        <div className="order-button-container">
                            <button onClick={handleOrder} className="checkout-btn order-now-button">
                                <span className="button-text">{t('order.orderNow')}</span>
                                <span className="button-icon">→</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* --- CSS STYLES (CLONED FOR UNIFORMITY) --- */}
            <style jsx>{`
                .cart-container {
                    max-width: 1200px;
                    margin: 20px auto;
                    padding: 0 20px;
                    font-family: 'Amazon Ember', Arial, sans-serif;
                }
                h1 {
                    font-size: 28px;
                    font-weight: 400;
                    color: #0F1111;
                }
                
                /* TWO-COLUMN STRUCTURE */
                .cart-content {
                    display: flex;
                    gap: 20px;
                    align-items: flex-start;
                }
                .items-section {
                    flex: 1; 
                }
                .checkout-section {
                    width: 300px; 
                    position: sticky;
                    top: 20px;
                }
                
                /* ITEM HEADER */
                .cart-header-list { 
                    display: flex;
                    justify-content: space-between;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #ddd;
                    margin-bottom: 20px;
                }
                .cart-header-list h2 {
                    font-size: 24px;
                    font-weight: 400;
                    color: #0F1111;
                }
                .price-header {
                    font-size: 14px;
                    color: #565959;
                }
                
                /* ITEM DISPLAY */
                .cart-item {
                    display: flex;
                    padding: 20px 0;
                    border-bottom: 1px solid #ddd;
                    gap: 20px;
                    align-items: center;
                }
                
                /* IMAGE SIZE FIX (Final Visual Polish) */
                .item-image-container {
                    width: 180px; 
                    height: 180px; 
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 0; 
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
                    font-size: 16px;
                    color: #0066c0;
                    margin-bottom: 3px;
                    font-weight: 400;
                }
                .item-stock {
                    color: #007600;
                    font-size: 12px;
                    margin-bottom: 5px;
                }

                /* QUANTITY SELECTOR STYLES (Restored functionality look) */
                .item-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-top: 5px;
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
                .quantity-btn:hover:not(.disabled) {
                    background: #e3e6e6;
                }
                .quantity-btn.disabled {
                    color: #ccc;
                    cursor: not-allowed;
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
                .item-price-col {
                    width: 120px;
                    text-align: right;
                }
                .price-amount {
                    font-size: 16px;
                    font-weight: 500;
                }
                .price-subtotal {
                    font-size: 12px;
                    color: #565959;
                    margin-top: 5px;
                }
                
                /* SUMMARY CARD STYLES */
                .checkout-card {
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                
                /* Coupon Input Styles */
                .coupon-section {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                .coupon-input { flex-grow: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; text-transform: uppercase; }
                .coupon-button { background-color: #f0c14b; border: 1px solid #a88734; color: #111; padding: 10px 15px; border-radius: 4px; cursor: pointer; }

                /* Total Line Styles */
                .summary-line {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 1rem;
                }
                .subtotal-line, .discount-line {
                    font-size: 16px;
                }
                .original-strike { text-decoration: line-through; color: #999; font-weight: 400; }
                .discount-line { color: green; font-weight: bold; }
                .final-amount { padding-top: 10px; border-top: 2px solid #ccc; }
                .final-amount-value { font-size: 1.4rem; font-weight: bold; color: #B12704; }
                .coupon-label { font-style: italic; }
                .cashback-line { font-size: 0.9em; color: #007bff; }
                
                /* Order Button Styles */
                .order-button-container {
                    margin-top: 20px;
                }
                .checkout-btn.order-now-button {
                    background: #FFA41C;
                    border: 1px solid #FF8F00;
                    width: 100%;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 1.1rem;
                    cursor: pointer;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 8px;
                    color: white; 
                }
                .checkout-btn.order-now-button:hover {
                    background: #FA8900;
                }
                
                /* Responsive Fixes */
                @media (max-width: 768px) {
                    .cart-content {
                        flex-direction: column;
                    }
                    .checkout-section {
                        width: 100%;
                        position: static;
                        top: auto;
                    }
                    .item-image-container {
                        width: 100px; 
                        height: 100px;
                    }
                    .item-details {
                        min-width: 150px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Order;