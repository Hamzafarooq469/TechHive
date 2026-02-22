import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AboutUs = () => {
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

    document.querySelectorAll('.hero-section, .content-section, .stats-section, .team-section, .commitment-section, .contact-section').forEach(section => {
      observer.observe(section);
    });

    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
      const target = counter.textContent;
      const numericTarget = parseInt(target.replace(/[^\d]/g, ''));
      
      if (!isNaN(numericTarget)) {
        let count = 0;
        const increment = numericTarget / 100;
        const timer = setInterval(() => {
          count += increment;
          if (count >= numericTarget) {
            counter.textContent = target;
            clearInterval(timer);
          } else {
            counter.textContent = Math.floor(count) + target.substring(target.search(/[^\d]/));
          }
        }, 20);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="container">
      {/* Hero Section */}
      <div className="hero-section">
        <h1>{t('about.title')}</h1>
        <p>{t('about.subtitle')}</p>
      </div>

      {/* Our Story Section */}
      <div className="content-section">
        <h2 className="section-title">{t('about.ourStory.title')}</h2>
        <div className="story-content">
          <p>{t('about.ourStory.paragraph1')}</p>
          <p>{t('about.ourStory.paragraph2')}</p>
          <p>{t('about.ourStory.paragraph3')}</p>
          <p>{t('about.ourStory.paragraph4')}</p>
        </div>
      </div>

      {/* Values Section */}
      <div className="content-section">
        <h2 className="section-title">{t('about.coreValues.title')}</h2>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon">🔒</div>
            <h3>{t('about.coreValues.authenticity.title')}</h3>
            <p>{t('about.coreValues.authenticity.description')}</p>
          </div>
          <div className="value-card">
            <div className="value-icon">🚚</div>
            <h3>{t('about.coreValues.delivery.title')}</h3>
            <p>{t('about.coreValues.delivery.description')}</p>
          </div>
          <div className="value-card">
            <div className="value-icon">💬</div>
            <h3>{t('about.coreValues.support.title')}</h3>
            <p>{t('about.coreValues.support.description')}</p>
          </div>
          <div className="value-card">
            <div className="value-icon">💰</div>
            <h3>{t('about.coreValues.prices.title')}</h3>
            <p>{t('about.coreValues.prices.description')}</p>
          </div>
          <div className="value-card">
            <div className="value-icon">🛠️</div>
            <h3>{t('about.coreValues.afterSales.title')}</h3>
            <p>{t('about.coreValues.afterSales.description')}</p>
          </div>
          <div className="value-card">
            <div className="value-icon">⚡</div>
            <h3>{t('about.coreValues.technology.title')}</h3>
            <p>{t('about.coreValues.technology.description')}</p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <h2 className="section-title" style={{color: 'white'}}>{t('about.impact.title')}</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">50K+</span>
            <span className="stat-label">{t('about.impact.ordersDelivered')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">15K+</span>
            <span className="stat-label">{t('about.impact.happyCustomers')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">500+</span>
            <span className="stat-label">{t('about.impact.productVarieties')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">50+</span>
            <span className="stat-label">{t('about.impact.citiesCovered')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">{t('about.impact.customerSupport')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">99.2%</span>
            <span className="stat-label">{t('about.impact.customerSatisfaction')}</span>
          </div>
        </div>
      </div>

      {/* Product Range Section */}
      <div className="content-section">
        <h2 className="section-title">{t('about.whatWeOffer.title')}</h2>
        <div className="story-content">
          <p>{t('about.whatWeOffer.intro')}</p>
          <p><strong>{t('about.whatWeOffer.mobilePhones')}</strong></p>
          <p><strong>{t('about.whatWeOffer.computers')}</strong></p>
          <p><strong>{t('about.whatWeOffer.appliances')}</strong></p>
          <p><strong>{t('about.whatWeOffer.gaming')}</strong></p>
          <p><strong>{t('about.whatWeOffer.smartHome')}</strong></p>
        </div>
      </div>

      {/* Team Section */}
      <div className="team-section">
        <h2 className="section-title">{t('about.team.title')}</h2>
        <div className="story-content">
          <p>{t('about.team.paragraph1')}</p>
          <p>{t('about.team.paragraph2')}</p>
          <p>{t('about.team.paragraph3')}</p>
          <p>{t('about.team.paragraph4')}</p>
        </div>
      </div>

      {/* Commitment Section */}
      <div className="commitment-section">
        <h2 className="section-title" style={{color: 'white'}}>{t('about.commitment.title')}</h2>
        <div className="commitment-content">
          <p>{t('about.commitment.paragraph1')}</p>
          <p>{t('about.commitment.paragraph2')}</p>
          <p>{t('about.commitment.paragraph3')}</p>
        </div>
        <a href="#" className="cta-button">{t('about.commitment.cta')}</a>
      </div>

      {/* Contact Section */}
      <div className="contact-section">
        <h2 className="section-title">{t('about.contact.title')}</h2>
        <p>{t('about.contact.intro')}</p>
        
        <div className="contact-info">
          <div className="contact-item">
            <h4>📍 {t('about.contact.headOffice')}</h4>
            <p dangerouslySetInnerHTML={{ __html: t('about.contact.address') }}></p>
          </div>
          <div className="contact-item">
            <h4>📞 {t('about.contact.customerSupport')}</h4>
            <p dangerouslySetInnerHTML={{ __html: t('about.contact.phone') }}></p>
          </div>
          <div className="contact-item">
            <h4>✉️ {t('about.contact.emailUs')}</h4>
            <p dangerouslySetInnerHTML={{ __html: t('about.contact.emails') }}></p>
          </div>
          <div className="contact-item">
            <h4>🕒 {t('about.contact.businessHours')}</h4>
            <p dangerouslySetInnerHTML={{ __html: t('about.contact.hours') }}></p>
          </div>
        </div>
      </div>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
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

        .content-section {
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

        .story-content {
          font-size: 1.1rem;
          line-height: 1.8;
          color: #555;
          margin-bottom: 40px;
        }

        .story-content p {
          margin-bottom: 20px;
        }

        .values-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          margin: 50px 0;
        }

        .value-card {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 30px;
          border-radius: 15px;
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: 2px solid transparent;
        }

        .value-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          border-color: #667eea;
        }

        .value-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(45deg, #667eea, #764ba2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 24px;
          color: white;
        }

        .value-card h3 {
          font-size: 1.5rem;
          color: #2c3e50;
          margin-bottom: 15px;
        }

        .stats-section {
          background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
          color: white;
          text-align: center;
          padding: 60px 40px;
          border-radius: 20px;
          margin: 40px auto;
          animation: fadeInUp 1s ease-out 0.4s both;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 40px;
          margin-top: 40px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-size: 3rem;
          font-weight: 700;
          color: #3498db;
          display: block;
          margin-bottom: 10px;
        }

        .stat-label {
          font-size: 1.1rem;
          color: rgba(255,255,255,0.8);
        }

        .team-section {
          background: white;
          border-radius: 20px;
          padding: 50px 40px;
          margin: 40px auto;
          animation: fadeInUp 1s ease-out 0.6s both;
        }

        .commitment-section {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          color: white;
          padding: 60px 40px;
          border-radius: 20px;
          text-align: center;
          margin: 40px auto;
          animation: fadeInUp 1s ease-out 0.8s both;
        }

        .commitment-content {
          max-width: 800px;
          margin: 0 auto;
          font-size: 1.2rem;
          line-height: 1.8;
        }

        .contact-section {
          background: white;
          border-radius: 20px;
          padding: 50px 40px;
          margin: 40px auto;
          text-align: center;
          animation: fadeInUp 1s ease-out 1s both;
        }

        .contact-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
          margin-top: 30px;
        }

        .contact-item {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
          transition: transform 0.3s ease;
        }

        .contact-item:hover {
          transform: translateY(-5px);
        }

        .contact-item h4 {
          color: #2c3e50;
          margin-bottom: 10px;
          font-size: 1.2rem;
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
          
          .hero-section, .content-section, .stats-section, 
          .team-section, .commitment-section, .contact-section {
            padding: 30px 20px;
            margin: 20px auto;
          }
        }

        .highlight {
          background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%);
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
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
      `}</style>
    </div>
  );
};

export default AboutUs;