
import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FiMail, FiLock, FiUserPlus, FiArrowRight } from 'react-icons/fi';
import { auth } from '../../Services/Firebase';
import { createUserWithEmailAndPassword, getIdToken, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useDispatch } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';
import { clearCart as clearGuestCart } from '@Redux/reducers/guestCartSlice';
import { clearShipping as clearGuestShipping } from '@Redux/reducers/guestShippingSlice';
import { clearOrder as clearGuestOrder } from '@Redux/reducers/guestOrderSlice';
import { clearUser } from "@Redux/reducers/userSlice";
import { clearOrderId } from "@Redux/reducers/orderIdSlice";
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';


const SignUp = () => {

  const { t } = useTranslation();
  

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const clearAll = () => {
    dispatch(clearUser());
    dispatch(clearGuestCart());
    dispatch(clearGuestShipping());
    dispatch(clearGuestOrder());
    dispatch(clearOrderId());
  };

  const handleEmailPasswordSignUp = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    try {
      setLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      const idToken = await user.getIdToken();
      const userData = {
        name,
        email: user.email,
        uid: user.uid,
      };
      const res = await axios.post("/user/signUp", { ...userData, token: idToken });
      toast.success("Account created! Welcome aboard 🎉");
      clearAll();
      navigate('/', { replace: true });
      window.location.reload();
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        toast.error("Email is already in use.");
      } else {
        toast.error("Registration failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      const userData = {
        name: user.displayName || "",
        email: user.email || "",
        uid: user.uid,
      };
      const res = await axios.post("/user/signUp", { ...userData, token: idToken });
      toast.success("Signed up with Google successfully!");
      clearAll();
      navigate('/', { replace: true });
      window.location.reload();
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        toast.error("Email already in use.");
      } else {
        toast.error("Google sign-up failed: " + error.message);
      }
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-container">
        <div className="signin-card">
          <h2>{t('signUp.title')}</h2>

          <form onSubmit={handleEmailPasswordSignUp}>
            <div className="form-group">
              <label>
                <FiUserPlus className="input-icon" />
                <input
                  type="text"
                  placeholder={t('signUp.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                <FiMail className="input-icon" />
                <input
                  type="email"
                  placeholder={t('signUp.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                <FiLock className="input-icon" />
                <input
                  type="password"
                  placeholder={t('signUp.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
            </div>

            <button type="submit" className="signin-button" disabled={loading}>
              {loading ? t('signUp.creating') : t('auth.signUp')}    <FiArrowRight />
            </button>
          </form>

          <div className="divider"><span> {t('signUp.or')} </span></div>

          <button onClick={handleGoogleSignUp} className="google-button">
            <FcGoogle /> {t('signUp.google')}
          </button>
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
      `}</style>
    </div>
  );
};

export default SignUp;
