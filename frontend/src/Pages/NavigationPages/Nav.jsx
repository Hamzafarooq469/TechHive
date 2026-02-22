import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import SignOut from '../AuthPages/SignOut';
import { 
  FiShoppingCart, 
  FiUser, 
  FiHome, 
  FiPackage, 
  FiTruck, 
  FiChevronDown, 
  FiSettings, 
  FiLogOut,
  FiShoppingBag,
  FiMenu,
  FiX,
  FiMessageSquare
} from 'react-icons/fi';
import { useTranslation } from "react-i18next";

const Nav = () => {

const { t, i18n } = useTranslation();


  const loggedInUser = useSelector((state) => state.user.currentUser?.user);
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    
    document.addEventListener('scroll', handleScroll);
    return () => document.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  // Prevent body scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && 
          !event.target.closest('.mobile-menu-button')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goToCart = () => {
    navigate('/cart');
    setMobileMenuOpen(false);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeAllMenus = () => {
    setShowDropdown(false);
    setMobileMenuOpen(false);
  };

  return (
    <div className={`navbar-container ${scrolled ? 'scrolled' : ''}`}>
      {mobileMenuOpen && <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={closeAllMenus} />}
      
      <div className="navbar-content">
        {/* Logo */}
        <Link to="/" className="logo-link" onClick={closeAllMenus}>
          <h1 className="logo">
            <span className="logo-icon">🛒</span> 
            <span className="logo-text">TechHive Pakistan</span>
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-links">
          <Link to="/" className="nav-link" onClick={closeAllMenus}>
            <FiHome className="nav-icon" /> <span className="nav-text"> {t("navbar.home")} </span>
          </Link>
          {/* <Link to="/products" className="nav-link" onClick={closeAllMenus}>
            <FiPackage className="nav-icon" /> <span className="nav-text">Products</span>
          </Link> */}
          <Link to="/trackOrder" className="nav-link" onClick={closeAllMenus}>
            <FiTruck className="nav-icon" /> <span className="nav-text"> {t("navbar.trackOrder")} </span>
          </Link>          
          <Link to="/aiChat" className="nav-link" onClick={closeAllMenus}>
            <FiMessageSquare className="nav-icon" /> <span className="nav-text"> {t("Chat bot")} </span>
          </Link>
          

          {/* {loggedInUser && ( */}
            {/* // <Link to="/my-orders" className="nav-link" onClick={closeAllMenus}> */}
              {/* <FiShoppingBag className="nav-icon" /> <span className="nav-text">My Orders</span> */}
            {/* // </Link> */}
          {/* )} */}
        </div>

        {/* User Actions */}
        <div className="user-actions">
          <button onClick={goToCart} className="cart-button" aria-label="Shopping Cart">
            <FiShoppingCart className="cart-icon" />
            <span className="cart-text"> {t("navbar.cart")} </span>
          </button>

          <div className="language-switcher">
  <select 
    onChange={(e) => i18n.changeLanguage(e.target.value)} 
    value={i18n.language}
    aria-label="Select language"
  >
    <option value="en">EN</option>
    <option value="ur">اردو</option>
    <option value="zh">中文</option>
    <option value="es">ES</option>
  </select>
</div>
          
          {!loggedInUser ? (
            <div className="auth-buttons">
              <Link to="/signIn" className="auth-link">
                <FiUser className="auth-icon" /> <span className="auth-text"> {t("auth.signIn")} </span>
              </Link>
              <Link to="/signUp" className="auth-link signup">
                <span className="auth-text"> {t("auth.signUp")} </span>
              </Link>
            </div>
          ) : (
            <div className="user-menu-container" ref={dropdownRef}>
              <button className="user-menu-button" onClick={toggleDropdown} aria-label="User Menu">
                <div className="user-avatar">
                  {loggedInUser.name.charAt(0).toUpperCase()}
                </div>
                <FiChevronDown className={`dropdown-chevron ${showDropdown ? 'open' : ''}`} />
              </button>
              
              {showDropdown && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <div className="user-avatar large">
                      {loggedInUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <div className="user-name">{loggedInUser.name}</div>
                      <div className="user-email">{loggedInUser.email}</div>
                    </div>
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  {loggedInUser.role === 'admin' && (
                    <Link to="/admin" className="dropdown-item" onClick={closeAllMenus}>
                      <FiSettings className="dropdown-icon" /> {t('navbar.adminDashboard')}
                    </Link>
                  )}
                  
                  <Link to="/chat" className="dropdown-item" onClick={closeAllMenus}>
                    <FiShoppingBag className="dropdown-icon" /> {t('navbar.customerSupport')}
                  </Link>
                  
                  <div className="dropdown-divider"></div>
                  
                  <div className="dropdown-item sign-out-item">
                    <FiLogOut className="dropdown-icon" />
                    <SignOut className="sign-out-button" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-button" 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`} ref={mobileMenuRef}>
        <div className="mobile-menu-content">
          <Link to="/" className="mobile-nav-link" onClick={closeAllMenus}>
            <FiHome className="mobile-nav-icon" /> {t("navbar.home")}
          </Link>
          <Link to="/products" className="mobile-nav-link" onClick={closeAllMenus}>
            <FiPackage className="mobile-nav-icon" /> {t("navbar.products")}
          </Link>
          <Link to="/trackOrder" className="mobile-nav-link" onClick={closeAllMenus}>
            <FiTruck className="mobile-nav-icon" /> {t("navbar.trackOrder")}
          </Link>
          {loggedInUser && (
            <>
              <Link to="/my-orders" className="mobile-nav-link" onClick={closeAllMenus}>
                <FiShoppingBag className="mobile-nav-icon" /> My Orders
              </Link>
              <Link to="/chat" className="mobile-nav-link" onClick={closeAllMenus}>
                <FiShoppingBag className="mobile-nav-icon" /> {t('navbar.customerSupport')}
              </Link>
              {loggedInUser.role === 'admin' && (
                <Link to="/admin" className="mobile-nav-link" onClick={closeAllMenus}>
                  <FiSettings className="mobile-nav-icon" /> {t('navbar.adminDashboard')}
                </Link>
              )}
            </>
          )}
          
          <div className="mobile-auth-section">
            {!loggedInUser ? (
              <>
                <Link to="/signIn" className="mobile-auth-link" onClick={closeAllMenus}>
                  <FiUser className="mobile-auth-icon" /> {t("auth.signIn")}
                </Link>
                <Link to="/signUp" className="mobile-auth-link signup" onClick={closeAllMenus}>
                  {t("auth.signUp")}
                </Link>
              </>
            ) : (
              <div className="mobile-sign-out">
                <FiLogOut className="mobile-sign-out-icon" />
                <SignOut className="mobile-sign-out-button" />
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .navbar-container {
          background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
          color: white;
          padding: 15px 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255,255,255,0.1);
          transition: padding 0.3s ease, background 0.3s ease;
          width: 100%;
          box-sizing: border-box;
          will-change: auto;
        }

        .navbar-container.scrolled {
          padding: 10px 0;
          background: rgba(44, 62, 80, 0.98);
        }

        .navbar-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          position: relative;
          width: 100%;
          box-sizing: border-box;
        }

        .logo-link {
          text-decoration: none;
          color: white;
          z-index: 1001;
        }

        .logo {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          transition: none;
        }

        .logo:hover {
          opacity: 0.9;
        }

        .logo-icon {
          margin-right: 10px;
          font-size: 1.5rem;
        }

        .logo-text {
          display: inline;
          white-space: nowrap;
        }

        .nav-links {
          display: flex;
          gap: 25px;
        }

        .nav-link {
          color: rgba(255,255,255,0.8);
          text-decoration: none;
          font-weight: 500;
          display: flex;
          align-items: center;
          transition: color 0.2s ease, background 0.2s ease;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 1rem;
          min-height: 44px;
          min-width: 44px;
        }

        .nav-link:hover {
          color: white;
          background: rgba(255,255,255,0.1);
        }

        .nav-icon {
          margin-right: 8px;
          font-size: 1.1rem;
        }

        .nav-text {
          display: inline;
        }

        .user-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .cart-button {
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          padding: 8px 15px;
          border-radius: 50px;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: background 0.2s ease;
          font-weight: 500;
          font-size: 1rem;
          min-height: 44px;
          min-width: 44px;
          justify-content: center;
        }

        .cart-button:hover {
          background: rgba(255,255,255,0.2);
        }

        .cart-icon {
          margin-right: 8px;
          font-size: 1.1rem;
        }

        .cart-text {
          display: inline;
        }

        .auth-buttons {
          display: flex;
          gap: 15px;
        }

        .auth-link {
          color: white;
          text-decoration: none;
          font-weight: 500;
          padding: 8px 15px;
          border-radius: 50px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          font-size: 1rem;
          min-height: 44px;
          min-width: 44px;
          justify-content: center;
        }

        .auth-link:hover {
          background: rgba(255,255,255,0.1);
          transform: translateY(-2px);
        }

        .auth-link.signup {
          background: #ffc107;
          color: #2c3e50;
          font-weight: 600;
        }

        .auth-link.signup:hover {
          background: #ffd54f;
        }

        .auth-icon {
          margin-right: 8px;
          font-size: 1.1rem;
        }

        .auth-text {
          display: inline;
        }

        /* User Menu Styles */
        .user-menu-container {
          position: relative;
        }

        .user-menu-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 50px;
          transition: all 0.3s ease;
          min-height: 44px;
          min-width: 44px;
          justify-content: center;
        }

        .user-menu-button:hover {
          background: rgba(255,255,255,0.1);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6e8efb, #a777e3);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .user-avatar.large {
          width: 48px;
          height: 48px;
          font-size: 20px;
        }

        .dropdown-chevron {
          transition: transform 0.3s ease;
          font-size: 1.1rem;
        }

        .dropdown-chevron.open {
          transform: rotate(180deg);
        }

        .user-dropdown {
          position: absolute;
          right: 0;
          top: 100%;
          margin-top: 10px;
          width: 280px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          z-index: 100;
          overflow: hidden;
          animation: fadeIn 0.2s ease-out;
        }

        .user-info {
          display: flex;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
        }

        .user-details {
          margin-left: 15px;
          overflow: hidden;
        }

        .user-name {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 4px;
          font-size: 1rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }

        .user-email {
          font-size: 0.85rem;
          color: #7f8c8d;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }

        .dropdown-divider {
          height: 1px;
          background: rgba(0,0,0,0.1);
          margin: 8px 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          padding: 12px 20px;
          color: #34495e;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s ease;
          font-size: 0.95rem;
          min-height: 44px;
        }

        .dropdown-item:hover {
          background: #f8f9fa;
          color: #2c3e50;
          padding-left: 22px;
        }

        .dropdown-icon {
          margin-right: 12px;
          color: #7f8c8d;
          font-size: 1.1rem;
        }

        .sign-out-item {
          color: #e74c3c;
        }

        .sign-out-item:hover {
          color: #c0392b;
        }

        .sign-out-item :global(button) {
          background: none;
          border: none;
          color: inherit;
          font: inherit;
          padding: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          width: 100%;
          text-align: left;
          min-height: 44px;
        }

        /* Mobile Menu Styles */
        .mobile-menu-button {
          display: none;
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          z-index: 1001;
          padding: 12px;
          width: 48px;
          height: 48px;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          min-width: 44px;
          border-radius: 8px;
          transition: background-color 0.3s ease;
        }

        .mobile-menu-button:hover {
          background: rgba(255,255,255,0.1);
        }

        .mobile-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          z-index: 999;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          display: none;
          pointer-events: none;
        }

        .mobile-menu-overlay.open {
          opacity: 1;
          visibility: visible;
          display: block;
          pointer-events: auto;
        }

        .mobile-menu {
          position: fixed;
          top: 0;
          right: 0;
          width: 85%;
          max-width: 320px;
          height: 100vh;
          background: rgba(44, 62, 80, 0.98);
          z-index: 1000;
          transform: translateX(100%);
          transition: transform 0.3s ease;
          padding-top: 80px;
          overflow-y: auto;
          backdrop-filter: blur(10px);
          display: none;
          pointer-events: none;
        }

        .mobile-menu.open {
          transform: translateX(0);
          display: block;
          pointer-events: auto;
        }

        .mobile-menu-content {
          display: flex;
          flex-direction: column;
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .mobile-nav-link {
          color: white;
          text-decoration: none;
          padding: 15px 0;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          min-height: 44px;
          transition: all 0.3s ease;
        }

        .mobile-nav-link:hover {
          background: rgba(255,255,255,0.1);
          padding-left: 10px;
        }

        .mobile-nav-icon {
          margin-right: 15px;
          font-size: 1.2rem;
        }

        .mobile-auth-section {
          margin-top: 30px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .mobile-auth-link {
          color: white;
          text-decoration: none;
          padding: 12px 20px;
          border-radius: 6px;
          text-align: center;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          transition: all 0.3s ease;
        }

        .mobile-auth-link:hover {
          background: rgba(255,255,255,0.1);
        }

        .mobile-auth-link.signup {
          background: #ffc107;
          color: #2c3e50;
          font-weight: 600;
        }

        .mobile-auth-link.signup:hover {
          background: #ffd54f;
        }

        .mobile-auth-icon {
          margin-right: 10px;
        }

        .mobile-sign-out {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #e74c3c;
          padding: 12px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          min-height: 44px;
          transition: all 0.3s ease;
        }

        .mobile-sign-out:hover {
          background: rgba(231, 76, 60, 0.1);
        }

        .mobile-sign-out-icon {
          margin-right: 10px;
        }

        .mobile-sign-out :global(button) {
          background: none;
          border: none;
          color: inherit;
          font: inherit;
          padding: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          min-height: 44px;
        }

        /* Enhanced Media Queries */
        @media (min-width: 769px) {
          .mobile-menu-button,
          .mobile-menu,
          .mobile-menu-overlay {
            display: none !important;
          }
        }

        @media (max-width: 1200px) {
          .navbar-content {
            padding: 0 15px;
          }
        }

        @media (max-width: 1024px) {
          .nav-links {
            gap: 20px;
          }
          
          .logo-text {
            font-size: 1.6rem;
          }

          .nav-link {
            padding: 8px 10px;
            font-size: 0.95rem;
          }
        }

        @media (max-width: 900px) {
          .nav-links {
            gap: 15px;
          }
          
          .nav-link {
            padding: 8px 8px;
            font-size: 0.9rem;
          }
          
          .user-actions {
            gap: 15px;
          }

          .logo-text {
            font-size: 1.4rem;
          }
        }

        @media (max-width: 768px) {
          .nav-links,
          .user-actions .auth-buttons {
            display: none;
          }

          .mobile-menu-button {
            display: flex;
          }

          .mobile-menu {
            display: block;
            width: 100%;
            max-width: 100%;
            left: 0;
            right: 0;
            transform: translateX(-100%);
          }

          .mobile-menu.open {
            transform: translateX(0);
          }

          .mobile-menu-overlay {
            display: block;
          }

          .logo-text {
            display: none;
          }

          .cart-text {
            display: none;
          }

          .cart-button {
            padding: 8px;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            justify-content: center;
          }

          .cart-icon {
            margin-right: 0;
          }

          .user-dropdown {
            position: fixed;
            top: 70px;
            right: 20px;
            left: 20px;
            width: auto;
            max-width: calc(100% - 40px);
          }

          .navbar-content {
            padding: 0 10px;
          }
        }

        @media (max-width: 600px) {
          .mobile-menu {
            width: 100%;
            max-width: 100%;
            left: 0;
            right: 0;
          }

          .mobile-menu-content {
            padding: 15px;
          }

          .mobile-nav-link {
            font-size: 1rem;
            padding: 12px 0;
          }

          .mobile-nav-icon {
            font-size: 1.1rem;
            margin-right: 12px;
          }

          .logo-icon {
            font-size: 1.3rem;
          }

          .user-dropdown {
            right: 10px;
            left: 10px;
            max-width: calc(100% - 20px);
          }
        }

        @media (max-width: 480px) {
          .navbar-content {
            padding: 0 10px;
          }
          
          .mobile-menu {
            padding-top: 70px;
            width: 100%;
            max-width: 100%;
          }
          
          .mobile-nav-link {
            font-size: 0.95rem;
            padding: 10px 0;
          }
          
          .mobile-nav-icon {
            font-size: 1rem;
            margin-right: 10px;
          }

          .logo-icon {
            font-size: 1.2rem;
          }

          .mobile-auth-link {
            font-size: 0.9rem;
            padding: 10px 15px;
          }

          .mobile-sign-out {
            font-size: 0.9rem;
            padding: 10px 15px;
          }
        }

        @media (max-width: 360px) {
          .navbar-content {
            padding: 0 8px;
          }

          .mobile-menu {
            width: 100%;
            max-width: 100%;
          }

          .mobile-menu-content {
            padding: 10px;
          }

          .mobile-nav-link {
            font-size: 0.9rem;
            padding: 8px 0;
          }

          .mobile-nav-icon {
            font-size: 0.9rem;
            margin-right: 8px;
          }

          .logo-icon {
            font-size: 1.1rem;
          }

          .cart-button {
            width: 36px;
            height: 36px;
          }

          .mobile-menu-button {
            width: 44px;
            height: 44px;
          }
        }

        /* Landscape orientation adjustments */
        @media (max-height: 500px) and (orientation: landscape) {
          .mobile-menu {
            padding-top: 60px;
          }

          .mobile-nav-link {
            padding: 8px 0;
          }

          .mobile-auth-section {
            margin-top: 20px;
            gap: 10px;
          }
        }

        /* High DPI displays */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .navbar-container {
            border-bottom-width: 0.5px;
          }
        }

        /* Reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .navbar-container,
          .logo,
          .nav-link,
          .cart-button,
          .auth-link,
          .user-menu-button,
          .dropdown-chevron,
          .mobile-menu,
          .mobile-nav-link,
          .mobile-auth-link,
          .mobile-sign-out {
            transition: none;
          }

          .language-switcher select {
  padding: 6px 10px;
  border-radius: 6px;
  background: white;
  color: #2c3e50;
  font-weight: 600;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  min-height: 36px;
  min-width: 80px;
  outline: none;
  transition: background 0.3s ease;
}

.language-switcher select:hover {
  background: #f1f1f1;
}

          .logo:hover,
          .nav-link:hover,
          .cart-button:hover,
          .auth-link:hover,
          .user-menu-button:hover,
          .mobile-nav-link:hover,
          .mobile-auth-link:hover,
          .mobile-sign-out:hover {
            transform: none;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Nav;