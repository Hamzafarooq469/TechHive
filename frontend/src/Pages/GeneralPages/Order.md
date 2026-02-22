
import React, { useState } from 'react'
import GetShipping from './GetShipping'
import Cart from './Cart'
import { useSelector } from 'react-redux'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { addToOrder } from '@Redux/reducers/guestOrderSlice'
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router'
import { setOrderId } from '@Redux/reducers/orderIdSlice'
import { useTranslation } from 'react-i18next';


const Order = () => {

  const { t } = useTranslation();

  const navigate = useNavigate("")
  const dispatch = useDispatch()

  const [selectedShippingId, setSelectedShippingId] = useState(null)

  const loggedInUser = useSelector((state) => state.user.currentUser?.user)
  const uid = loggedInUser?.uid

    const guestShipping = useSelector((state) => state.guestShipping?.shipping)
    // console.log('Guest shipping:', guestShipping)


      const guestCart = useSelector((state) => state.guestCart.cart);
      // console.log("Guest User Cart:", guestCart);

const handleOrder = async () => {
  try {
    if (loggedInUser) {
      // Logged-in user flow
      const cartResponse = await axios.get(`/cart/getCart?uid=${uid}`)
      const cartItemsRaw = cartResponse.data.items
      console.log(cartItemsRaw)

      if (!cartItemsRaw || cartItemsRaw.length === 0) {
        return alert("Cart is empty!")
      }

      if (!selectedShippingId) {
        return alert("Please select a shipping address!")
      }

      const orderData = {
        userId: uid,
        cartId: cartResponse.data._id,
        shippingId: selectedShippingId,
      }

      console.log("Order Data (logged-in):", orderData)

      const res = await axios.post("/order/createOrder", orderData)
      dispatch(setOrderId(res.data.order._id));
      navigate('/orderSummary');
      console.log("Order created successfully:", res.data)
      toast.success("Order placed successfully!")
    } else {
      // Guest user flow

      if (!guestCart || guestCart.length === 0) {
        return alert("Cart is empty!")
      }

      if (!selectedShippingId) {
        return alert("Please select a shipping address!")
      }

      const guestOrderData = {
        userId: uuidv4(), // you can use any dummy ID or keep track of session ID
        cartItems: guestCart,
        shipping: guestShipping,
      }
      console.log(guestOrderData)
      const res = await axios.post("/order/createOrder/guest", guestOrderData);
      // console.log("Order Data (guest):", guestOrderData)

      dispatch(addToOrder(guestOrderData))
      dispatch(setOrderId(res.data.order._id));
      toast.success("Order placed successfully (guest)!")
      navigate("/orderSummary");
    }
  } catch (error) {
    console.error("Order creation failed:", error.message)
    alert("Something went wrong. Please try again.")
  }
}


  return (
    <>
      <h1>Order Page</h1>
      <Cart />
      <GetShipping onSelectShipping={setSelectedShippingId} /> 
      {selectedShippingId && (
        <div className="order-button-container">
          <button onClick={handleOrder} className="order-now-button">
            <span className="button-text">{t('order.orderNow')}</span>
            <span className="button-icon">→</span>
          </button>
        </div>
      )}

      <style jsx>{`
        .order-button-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 30px;
          margin-bottom: 30px;
          padding: 0 20px;
        }

        .order-now-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 16px 32px;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 200px;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .order-now-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .order-now-button:hover::before {
          left: 100%;
        }

        .order-now-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
          background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
        }

        .order-now-button:active {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
        }

        .button-text {
          font-size: 1.1rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .button-icon {
          font-size: 1.2rem;
          transition: transform 0.3s ease;
        }

        .order-now-button:hover .button-icon {
          transform: translateX(4px);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .order-button-container {
            margin-top: 25px;
            margin-bottom: 25px;
            padding: 0 15px;
          }

          .order-now-button {
            padding: 14px 28px;
            font-size: 1rem;
            min-width: 180px;
          }

          .button-text {
            font-size: 1rem;
          }

          .button-icon {
            font-size: 1.1rem;
          }
        }

        @media (max-width: 480px) {
          .order-button-container {
            margin-top: 20px;
            margin-bottom: 20px;
            padding: 0 10px;
          }

          .order-now-button {
            padding: 12px 24px;
            font-size: 0.95rem;
            min-width: 160px;
            gap: 8px;
          }

          .button-text {
            font-size: 0.95rem;
          }

          .button-icon {
            font-size: 1rem;
          }
        }

        @media (max-width: 360px) {
          .order-now-button {
            padding: 10px 20px;
            font-size: 0.9rem;
            min-width: 140px;
          }

          .button-text {
            font-size: 0.9rem;
          }

          .button-icon {
            font-size: 0.9rem;
          }
        }

        /* Focus states for accessibility */
        .order-now-button:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3), 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        /* Loading state (optional) */
        .order-now-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .order-now-button:disabled:hover {
          transform: none;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }
      `}</style>
    </>
  )
}

export default Order
