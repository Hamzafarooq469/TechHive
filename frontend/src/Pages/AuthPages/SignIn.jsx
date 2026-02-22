
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { auth } from '@Services/Firebase';
import {  getIdToken, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup  } from "firebase/auth"
import axios from 'axios'
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router'
import { setUser } from '@Redux/reducers/userSlice';
import { clearCart as clearGuestCart } from '@Redux/reducers/guestCartSlice'
import { clearShipping as clearGuestShipping } from '@Redux/reducers/guestShippingSlice'
import { clearOrder as clearGuestOrder } from '../../Redux/reducers/guestOrderSlice'
import { clearUser } from "../../Redux/reducers/userSlice"; 
import { clearOrderId  } from "@Redux/reducers/orderIdSlice";
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';


const SignIn = () => {

  const { t } = useTranslation();


  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate()

        const clearAll = () => {
        // dispatch(clearUser());
        dispatch(clearGuestCart());
        dispatch(clearGuestShipping());
        dispatch(clearGuestOrder())
        dispatch(clearOrderId());
    };

    const handleEmailPasswordSignIn = async (e) => {
        e.preventDefault()
        try {
            const result = await signInWithEmailAndPassword(auth, email, password)
            const user = result.user;
            console.log(user)
            const idToken = await user.getIdToken()
            const res = await axios.post("/user/signIn", { idToken })
            console.log("Sending:", res.data)
            dispatch(setUser(res.data));
            clearAll()
            const userName = res.data?.user?.name || "User";  
            toast.success(`${t('signIn.success')}, ${userName}!`);
            navigate("/", { replace: true })
            window.location.reload();
        } catch (error) {
            console.log(error.message);
            if(error.code == "auth/invalid-credential") {
                toast.error(t('signIn.invalid'))
            } else{
                toast.error(t('signIn.unsuccessful'), error.message)
            }
        }
    }

    const handleGoogleSignUp = async (e) => {
        try {
            const AuthProvider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, AuthProvider);
            const user = result.user;
            const idToken = await user.getIdToken()
            const res = await axios.post("/user/signIn", { idToken })
            console.log("Sending:", res.data)
            dispatch(setUser(res.data));
            dispatch(clearGuestCart())
            const userName = res.data?.user?.name || "User";  
            toast.success(`${t('signIn.success')}, ${userName}!`);
            navigate("/", { replace: true })
            window.location.reload();
        } catch (error) {
            console.log(error.message);
        }
    }

  return (
    <div className="signin-page">
      <div className="signin-container">
        <div className="signin-card">
          <h2>{t('signIn.title')}</h2>
          
          <form onSubmit={handleEmailPasswordSignIn}>
            <div className="form-group">
              <label>
                <FiMail className="input-icon" />
                <input 
                  type="email" 
                  placeholder={t('signIn.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </div>
            
            <div className="form-group">
              <label>
                <FiLock className="input-icon" />
                <input 
                  type="password" 
                  placeholder={t('signIn.passwordPlaceholder')} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            </div>
            
            <button type="submit" className="signin-button">
              {t('signIn.button')} <FiArrowRight />
            </button>
          </form>
          
          <div className="divider">
            <span>{t('signIn.or')}</span>
          </div>
          
          <button onClick={handleGoogleSignUp} className="google-button">
            <FcGoogle /> {t('signIn.google')}
          </button>
          
          <div className="footer-links">
            <Link to="/forgotPassword">{t('signIn.forgotPassword')}</Link>
            <span>{t('signIn.newUser')} <Link to="/signUp">{t('signIn.linkToSignUp')}</Link></span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .signin-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: calc(100vh - 80px);
          padding: 20px;
          background: #f8f9fa;
        }
        
        .signin-container {
          width: 100%;
          max-width: 400px;
        }
        
        .signin-card {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        h2 {
          color: #2c3e50;
          text-align: center;
          margin-bottom: 30px;
          font-size: 1.5rem;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        label {
          display: flex;
          align-items: center;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 0 15px;
          transition: border-color 0.3s;
        }
        
        label:focus-within {
          border-color: #667eea;
        }
        
        .input-icon {
          color: #667eea;
          margin-right: 10px;
        }
        
        input {
          width: 100%;
          padding: 12px 0;
          border: none;
          outline: none;
          font-size: 1rem;
        }
        
        .signin-button {
          width: 100%;
          padding: 12px;
          background: linear-gradient(to right, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.2s;
        }
        
        .signin-button:hover {
          transform: translateY(-2px);
        }
        
        .divider {
          display: flex;
          align-items: center;
          margin: 20px 0;
          color: #666;
        }
        
        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #ddd;
        }
        
        .divider span {
          padding: 0 10px;
        }
        
        .google-button {
          width: 100%;
          padding: 12px;
          background: white;
          color: #2c3e50;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          transition: all 0.2s;
        }
        
        .google-button:hover {
          border-color: #667eea;
          transform: translateY(-2px);
        }
        
        .footer-links {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-top: 45px;
          text-align: center;
          font-size: 0.9rem;
        }
        
        a {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
        }
        
        a:hover {
          text-decoration: underline;
        }
        
        @media (max-width: 40px) {
          .signin-card {
            padding: 30px 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default SignIn;