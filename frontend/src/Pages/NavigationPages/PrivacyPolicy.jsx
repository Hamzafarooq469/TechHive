import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy = () => {
  const { t } = useTranslation();

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
        }
      });
    }, observerOptions);

    // Observe all animated sections
    document.querySelectorAll('.hero-section, .content-section, .process-section, .faq-section').forEach(section => {
      observer.observe(section);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="container">
      {/* Hero Section */}
      <div className="hero-section">
        <h1>{t('privacyPolicy.title')}</h1>
        <p>{t('privacyPolicy.subtitle')}</p>
      </div>

      {/* Policy Overview Section */}
      <div className="content-section">
        <h2 className="section-title">{t('privacyPolicy.commitment.title')}</h2>
        <div className="story-content">
          <p>{t('privacyPolicy.commitment.intro')}</p>
          
          <p>{t('privacyPolicy.commitment.transparency')}</p>
          
          <div className="highlight-box">
            <h4>{t('privacyPolicy.commitment.principles.title')}</h4>
            <ul>
              {t('privacyPolicy.commitment.principles.items', { returnObjects: true }).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Information Collection Section */}
      <div className="process-section">
        <h2 className="section-title">{t('privacyPolicy.informationCollection.title')}</h2>
        <div className="values-grid">
          <div className="process-card">
            <div className="process-step">📝</div>
            <h3>{t('privacyPolicy.informationCollection.personalInfo.title')}</h3>
            <p>{t('privacyPolicy.informationCollection.personalInfo.description')}</p>
          </div>
          <div className="process-card">
            <div className="process-step">🛒</div>
            <h3>{t('privacyPolicy.informationCollection.orderInfo.title')}</h3>
            <p>{t('privacyPolicy.informationCollection.orderInfo.description')}</p>
          </div>
          <div className="process-card">
            <div className="process-step">🌐</div>
            <h3>{t('privacyPolicy.informationCollection.technicalData.title')}</h3>
            <p>{t('privacyPolicy.informationCollection.technicalData.description')}</p>
          </div>
          <div className="process-card">
            <div className="process-step">🍪</div>
            <h3>{t('privacyPolicy.informationCollection.cookies.title')}</h3>
            <p>{t('privacyPolicy.informationCollection.cookies.description')}</p>
          </div>
        </div>
      </div>

      {/* How We Use Information Section */}
      <div className="content-section">
        <h2 className="section-title">{t('privacyPolicy.howWeUse.title')}</h2>
        <div className="story-content">
          <p>{t('privacyPolicy.howWeUse.intro')}</p>
          
          <div className="conditions-grid">
            <div className="condition-card">
              <h4>{t('privacyPolicy.howWeUse.orderProcessing.title')}</h4>
              <p>{t('privacyPolicy.howWeUse.orderProcessing.description')}</p>
            </div>
            <div className="condition-card">
              <h4>{t('privacyPolicy.howWeUse.accountManagement.title')}</h4>
              <p>{t('privacyPolicy.howWeUse.accountManagement.description')}</p>
            </div>
            <div className="condition-card">
              <h4>{t('privacyPolicy.howWeUse.serviceImprovement.title')}</h4>
              <p>{t('privacyPolicy.howWeUse.serviceImprovement.description')}</p>
            </div>
            <div className="condition-card">
              <h4>{t('privacyPolicy.howWeUse.communication.title')}</h4>
              <p>{t('privacyPolicy.howWeUse.communication.description')}</p>
            </div>
          </div>
          
          <p className="notice">{t('privacyPolicy.howWeUse.notice')}</p>
        </div>
      </div>

      {/* Data Protection Section */}
      <div className="process-section">
        <h2 className="section-title">{t('privacyPolicy.dataProtection.title')}</h2>
        <div className="values-grid">
          <div className="process-card">
            <div className="process-step">🔒</div>
            <h3>{t('privacyPolicy.dataProtection.encryption.title')}</h3>
            <p>{t('privacyPolicy.dataProtection.encryption.description')}</p>
          </div>
          <div className="process-card">
            <div className="process-step">🛡️</div>
            <h3>{t('privacyPolicy.dataProtection.accessControl.title')}</h3>
            <p>{t('privacyPolicy.dataProtection.accessControl.description')}</p>
          </div>
          <div className="process-card">
            <div className="process-step">🔍</div>
            <h3>{t('privacyPolicy.dataProtection.monitoring.title')}</h3>
            <p>{t('privacyPolicy.dataProtection.monitoring.description')}</p>
          </div>
          <div className="process-card">
            <div className="process-step">📋</div>
            <h3>{t('privacyPolicy.dataProtection.compliance.title')}</h3>
            <p>{t('privacyPolicy.dataProtection.compliance.description')}</p>
          </div>
        </div>
      </div>

      {/* Your Rights Section */}
      <div className="content-section">
        <h2 className="section-title">{t('privacyPolicy.yourRights.title')}</h2>
        <div className="story-content">
          <p>{t('privacyPolicy.yourRights.intro')}</p>
          
          <div className="highlight-box">
            <h4>{t('privacyPolicy.yourRights.rights.title')}</h4>
            <ul>
              <li><strong>{t('privacyPolicy.yourRights.rights.access')}</strong></li>
              <li><strong>{t('privacyPolicy.yourRights.rights.correction')}</strong></li>
              <li><strong>{t('privacyPolicy.yourRights.rights.deletion')}</strong></li>
              <li><strong>{t('privacyPolicy.yourRights.rights.portability')}</strong></li>
              <li><strong>{t('privacyPolicy.yourRights.rights.optOut')}</strong></li>
              <li><strong>{t('privacyPolicy.yourRights.rights.restriction')}</strong></li>
            </ul>
          </div>
          
          <p>{t('privacyPolicy.yourRights.contact')}</p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <h2 className="section-title">{t('privacyPolicy.faq.title')}</h2>
        <div className="faq-content">
          <div className="faq-item">
            <h3>{t('privacyPolicy.faq.sellData.question')}</h3>
            <p>{t('privacyPolicy.faq.sellData.answer')}</p>
          </div>
          <div className="faq-item">
            <h3>{t('privacyPolicy.faq.dataRetention.question')}</h3>
            <p>{t('privacyPolicy.faq.dataRetention.answer')}</p>
          </div>
          <div className="faq-item">
            <h3>{t('privacyPolicy.faq.cookies.question')}</h3>
            <p>{t('privacyPolicy.faq.cookies.answer')}</p>
          </div>
          <div className="faq-item">
            <h3>{t('privacyPolicy.faq.dataBreach.question')}</h3>
            <p>{t('privacyPolicy.faq.dataBreach.answer')}</p>
          </div>
        </div>
        <a href="/contact" className="cta-button">{t('privacyPolicy.contact')}</a>
      </div>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .hero-section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          margin: 40px auto;
          padding: 60px 40px;
          text-align: center;
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
          border: 1px solid rgba(255, 255, 255, 0.18);
          animation: fadeInUp 1s ease-out;
        }

        .hero-section h1 {
          font-size: 3.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 20px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .hero-section p {
          font-size: 1.3rem;
          color: rgba(255, 255, 255, 0.9);
          max-width: 600px;
          margin: 0 auto;
        }

        .content-section, .process-section, .faq-section {
          background: white;
          border-radius: 20px;
          margin: 40px auto;
          padding: 50px 40px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          animation: fadeInUp 1s ease-out 0.2s both;
        }

        .section-title {
          font-size: 2.5rem;
          color: #2c3e50;
          margin-bottom: 30px;
          text-align: center;
          position: relative;
        }

        .section-title::after {
          content: '';
          width: 80px;
          height: 4px;
          background: linear-gradient(45deg, #667eea, #764ba2);
          display: block;
          margin: 15px auto;
          border-radius: 2px;
        }

        .story-content, .faq-content {
          font-size: 1.1rem;
          line-height: 1.8;
          color: #555;
          margin-bottom: 40px;
        }

        .story-content p, .faq-item p {
          margin-bottom: 20px;
        }

        .highlight {
          background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%);
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
        }

        .highlight-box {
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 30px 0;
          border-radius: 0 8px 8px 0;
        }

        .highlight-box ul {
          padding-left: 20px;
        }

        .highlight-box li {
          margin-bottom: 10px;
        }

        .values-grid, .conditions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
          margin: 50px 0;
        }

        .process-card, .condition-card {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 30px;
          border-radius: 15px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: 2px solid transparent;
        }

        .process-card:hover, .condition-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          border-color: #667eea;
        }

        .process-step {
          width: 50px;
          height: 50px;
          background: linear-gradient(45deg, #667eea, #764ba2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 24px;
          color: white;
          font-weight: bold;
        }

        .process-card h3, .condition-card h4 {
          font-size: 1.3rem;
          color: #2c3e50;
          margin-bottom: 15px;
          text-align: center;
        }

        .faq-item {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }

        .faq-item h3 {
          color: #2c3e50;
          margin-bottom: 15px;
          font-size: 1.3rem;
        }

        .notice {
          font-style: italic;
          color: #e74c3c;
          font-weight: 500;
        }

        .cta-button {
          display: inline-block;
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          padding: 15px 30px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          margin-top: 20px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .cta-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .hero-section h1 {
            font-size: 2.5rem;
          }
          
          .hero-section p {
            font-size: 1.1rem;
          }
          
          .section-title {
            font-size: 2rem;
          }
          
          .hero-section, .content-section, .process-section, .faq-section {
            padding: 30px 20px;
            margin: 20px auto;
          }
        }
      `}</style>
    </div>
  );
};

export default PrivacyPolicy;
