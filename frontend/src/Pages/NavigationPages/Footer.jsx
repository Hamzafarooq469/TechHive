import React from 'react';
import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin, FiChevronRight } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <div className="footer-container">
      <div className="footer-content">
        <div className="footer-section">
          <h2 className="footer-logo">🛒 TechHive Pakistan</h2>
          <p className="footer-description">
            {t('footer.description')}
          </p>
          <div className="social-links">
            <a href="https://www.facebook.com/" target='_blank' className="social-icon">fb</a>
            <a href="https://www.instagram.com/" target='_blank' className="social-icon">ig</a>
            <a href="https://x.com/" target='_blank' className="social-icon">tw</a>
            <a href="https://www.youtube.com/" target='_blank' className="social-icon">yt</a>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="footer-section">
          <h3 className="footer-heading">{t('footer.quickLinks')}</h3>
          <ul className="footer-links">
            <li><Link to="/" className="footer-link"><FiChevronRight className="link-icon" /> {t('footer.home')}</Link></li>
            <li><Link to="/products" className="footer-link"><FiChevronRight className="link-icon" /> {t('footer.products')}</Link></li>
            <li><Link to="/about" className="footer-link"><FiChevronRight className="link-icon" /> {t('footer.aboutUs')}</Link></li>
            {/* <li><Link to="/blog" className="footer-link"><FiChevronRight className="link-icon" /> Blog</Link></li> */}
          </ul>
        </div>

        {/* Customer Support */}
        <div className="footer-section">
          <h3 className="footer-heading">{t('footer.support')}</h3>
          <ul className="footer-links">
            <li><Link to="/faq" className="footer-link"><FiChevronRight className="link-icon" /> {t('footer.faq')}</Link></li>
            <li><Link to="/returns" className="footer-link"><FiChevronRight className="link-icon" /> {t('footer.returnsPolicy')}</Link></li>
            {/* <li><Link to="/shipping" className="footer-link"><FiChevronRight className="link-icon" /> Shipping Info</Link></li> */}
            <li><Link to="/help" className="footer-link"><FiChevronRight className="link-icon" /> {t('footer.helpCenter')}</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-section">
          <h3 className="footer-heading">{t('footer.contactUs')}</h3>
          <div className="contact-info">
            <div className="contact-item">
              <FiPhone className="contact-icon" />
              <span>{t('footer.phone')}</span>
            </div>
            <div className="contact-item">
              <FiMail className="contact-icon" />
              <span>{t('footer.email')}</span>
            </div>
            <div className="contact-item">
              <FiMapPin className="contact-icon" />
              <span>{t('footer.address')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="copyright-section">
        <div className="copyright-text">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </div>
        <div className="legal-links">
          <Link to="/privacy" className="legal-link">{t('footer.privacyPolicy')}</Link>
          <Link to="/terms" className="legal-link">{t('footer.termsOfService')}</Link>
          <Link to="/complain" className="legal-link">{t('Complain')}</Link>
          <Link to="/survey" className="legal-link">Survey</Link>
          {/* <Link to="/couponManager" className="legal-link">{t('Coupon Manager')}</Link> */}
          {/* <Link to="/sitemap" className="legal-link">Sitemap</Link> */}
        </div>
      </div>

      <style jsx>{`
        .footer-container {
          background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
          color: rgba(255, 255, 255, 0.9);
          padding: 60px 20px 30px;
          margin-top: auto;
          width: 100%;
        }

        .footer-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 40px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .footer-section {
          animation: fadeInUp 0.6s ease-out;
        }

        .footer-logo {
          font-size: 2rem;
          color: #ffc107;
          margin-bottom: 20px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .footer-description {
          line-height: 1.7;
          margin-bottom: 25px;
          color: rgba(255, 255, 255, 0.7);
        }

        .social-links {
          display: flex;
          gap: 15px;
        }

        .social-icon {
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: all 0.3s ease;
        }

        .social-icon:hover {
          background: #ffc107;
          color: #2c3e50;
          transform: translateY(-3px);
        }

        .footer-heading {
          font-size: 1.3rem;
          color: #ffc107;
          margin-bottom: 25px;
          position: relative;
          padding-bottom: 10px;
        }

        .footer-heading::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 50px;
          height: 3px;
          background: #ffc107;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-links li {
          margin-bottom: 12px;
        }

        .footer-link {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          display: flex;
          align-items: center;
          transition: all 0.3s ease;
        }

        .footer-link:hover {
          color: #ffc107;
          transform: translateX(5px);
        }

        .link-icon {
          margin-right: 8px;
          font-size: 0.9rem;
          color: #ffc107;
        }

        .contact-info {
          margin-top: 20px;
        }

        .contact-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 15px;
          line-height: 1.6;
        }

        .contact-icon {
          color: #ffc107;
          margin-right: 12px;
          margin-top: 3px;
          flex-shrink: 0;
        }

        .copyright-section {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 30px;
          margin-top: 50px;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }

        .copyright-text {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
        }

        .legal-links {
          display: flex;
          gap: 20px;
        }

        .legal-link {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.3s ease;
        }

        .legal-link:hover {
          color: #ffc107;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .footer-content {
            grid-template-columns: 1fr;
            gap: 30px;
          }
          
          .copyright-section {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }
          
          .legal-links {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Footer;