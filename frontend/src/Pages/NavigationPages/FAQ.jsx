import React, { useState } from 'react';
import { FiSearch, FiChevronDown, FiChevronUp, FiExternalLink } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const FAQ = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState([]);

  const toggleItem = (id) => {
    if (expandedItems.includes(id)) {
      setExpandedItems(expandedItems.filter(itemId => itemId !== id));
    } else {
      setExpandedItems([...expandedItems, id]);
    }
  };

  const faqCategories = [
    { id: 'shipping', name: t('faq.categories.shipping'), icon: '🚚' },
    { id: 'returns', name: t('faq.categories.returns'), icon: '🔄' },
    { id: 'orders', name: t('faq.categories.orders'), icon: '📦' },
    { id: 'products', name: t('faq.categories.products'), icon: '🔌' },
    { id: 'account', name: t('faq.categories.account'), icon: '👤' },
    { id: 'payments', name: t('faq.categories.payments'), icon: '💳' },
  ];

  const faqItems = [
    {
      id: 1,
      question: t('faq.questions.shippingTime.question'),
      answer: t('faq.questions.shippingTime.answer'),
      category: 'shipping',
      links: t('faq.questions.shippingTime.links', { returnObjects: true })
    },
    {
      id: 2,
      question: t('faq.questions.returns.question'),
      answer: t('faq.questions.returns.answer'),
      category: 'returns',
      links: t('faq.questions.returns.links', { returnObjects: true })
    },
    {
      id: 3,
      question: t('faq.questions.trackOrder.question'),
      answer: t('faq.questions.trackOrder.answer'),
      category: 'orders',
      links: t('faq.questions.trackOrder.links', { returnObjects: true })
    },
    {
      id: 4,
      question: t('faq.questions.authenticity.question'),
      answer: t('faq.questions.authenticity.answer'),
      category: 'products'
    },
    {
      id: 5,
      question: t('faq.questions.paymentMethods.question'),
      answer: t('faq.questions.paymentMethods.answer'),
      category: 'payments'
    },
    {
      id: 6,
      question: t('faq.questions.resetPassword.question'),
      answer: t('faq.questions.resetPassword.answer'),
      category: 'account',
      links: t('faq.questions.resetPassword.links', { returnObjects: true })
    },
    {
      id: 7,
      question: t('faq.questions.internationalShipping.question'),
      answer: t('faq.questions.internationalShipping.answer'),
      category: 'shipping',
      links: t('faq.questions.internationalShipping.links', { returnObjects: true })
    },
    {
      id: 8,
      question: t('faq.questions.warranty.question'),
      answer: t('faq.questions.warranty.answer'),
      category: 'products',
      links: t('faq.questions.warranty.links', { returnObjects: true })
    }
  ];

  const filteredItems = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="faq-page">
      {/* Hero Section */}
      <div className="hero-section">
        <h1>{t('faq.title')}</h1>
        <p>{t('faq.subtitle')}</p>
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder={t('faq.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="content-container">
        {/* Categories Navigation */}
        <div className="categories-section">
          <h2 className="section-title">{t('faq.categories.title')}</h2>
          <div className="category-buttons">
            <button 
              className={activeCategory === 'all' ? 'active' : ''}
              onClick={() => setActiveCategory('all')}
            >
              {t('faq.categories.all')}
            </button>
            {faqCategories.map(category => (
              <button
                key={category.id}
                className={activeCategory === category.id ? 'active' : ''}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Items */}
        <div className="faq-items-section">
          {filteredItems.length > 0 ? (
            <div className="faq-items">
              {filteredItems.map(item => (
                <div 
                  key={item.id} 
                  className={`faq-item ${expandedItems.includes(item.id) ? 'expanded' : ''}`}
                >
                  <div 
                    className="faq-question"
                    onClick={() => toggleItem(item.id)}
                  >
                    <h3>{item.question}</h3>
                    <span className="toggle-icon">
                      {expandedItems.includes(item.id) ? <FiChevronUp /> : <FiChevronDown />}
                    </span>
                  </div>
                  {expandedItems.includes(item.id) && (
                    <div className="faq-answer">
                      <p>{item.answer}</p>
                      {item.links && (
                        <div className="faq-links">
                          {item.links.map((link, index) => (
                            <a 
                              key={index} 
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {link.text} <FiExternalLink />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>{t('faq.noResults')}</p>
              <button 
                className="reset-btn"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
              >
                {t('faq.resetFilters')}
              </button>
            </div>
          )}
        </div>

        {/* Support Section */}
        <div className="support-section">
          <h2>{t('faq.support.title')}</h2>
          <p>{t('faq.support.subtitle')}</p>
          <div className="support-buttons">
            <a href="/contact" className="support-btn primary">
              {t('faq.support.contactSupport')}
            </a>
            <a href="tel:+9251XXXXXXX" className="support-btn secondary">
              {t('faq.support.callNow')}
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .faq-page {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding-bottom: 40px;
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
          max-width: 1200px;
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
          margin: 0 auto 30px;
        }

        .search-bar {
          max-width: 700px;
          margin: 0 auto;
          position: relative;
        }

        .search-bar input {
          width: 100%;
          padding: 15px 20px 15px 50px;
          border-radius: 50px;
          border: none;
          font-size: 1.1rem;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }

        .search-icon {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          color: #667eea;
          font-size: 1.2rem;
        }

        .content-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
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

        .categories-section {
          background: white;
          border-radius: 20px;
          margin: 40px auto;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .category-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
        }

        .category-buttons button {
          padding: 12px 20px;
          border: 2px solid #ddd;
          border-radius: 50px;
          background: white;
          font-size: 1rem;
          font-weight: 600;
          color: #2c3e50;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .category-buttons button:hover {
          border-color: #667eea;
          color: #667eea;
        }

        .category-buttons button.active {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          border-color: transparent;
        }

        .faq-items-section {
          background: white;
          border-radius: 20px;
          margin: 40px auto;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .faq-items {
          max-width: 800px;
          margin: 0 auto;
        }

        .faq-item {
          border-bottom: 1px solid #eee;
          margin-bottom: 15px;
          transition: all 0.3s ease;
        }

        .faq-item.expanded {
          border-bottom-color: #667eea;
        }

        .faq-question {
          padding: 20px 0;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .faq-question h3 {
          font-size: 1.2rem;
          color: #2c3e50;
          margin: 0;
          flex: 1;
        }

        .faq-question:hover h3 {
          color: #667eea;
        }

        .toggle-icon {
          color: #667eea;
          font-size: 1.2rem;
          margin-left: 20px;
          transition: transform 0.3s ease;
        }

        .faq-answer {
          padding: 0 0 20px 0;
          animation: fadeIn 0.3s ease;
        }

        .faq-answer p {
          color: #555;
          line-height: 1.7;
          margin-bottom: 15px;
        }

        .faq-links {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-top: 15px;
        }

        .faq-links a {
          display: inline-flex;
          align-items: center;
          padding: 8px 15px;
          background: #f0f4ff;
          border-radius: 5px;
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .faq-links a:hover {
          background: #667eea;
          color: white;
        }

        .faq-links svg {
          margin-left: 5px;
          font-size: 0.9rem;
        }

        .no-results {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .no-results p {
          margin-bottom: 20px;
        }

        .reset-btn {
          padding: 10px 25px;
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .reset-btn:hover {
          transform: translateY(-3px);
        }

        .support-section {
          background: white;
          border-radius: 20px;
          margin: 40px auto;
          padding: 60px 40px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .support-section h2 {
          font-size: 2.5rem;
          color: #2c3e50;
          margin-bottom: 15px;
        }

        .support-section p {
          color: #666;
          font-size: 1.2rem;
          margin-bottom: 30px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .support-buttons {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .support-btn {
          display: inline-block;
          padding: 15px 30px;
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .support-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }

        .support-btn.secondary {
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
        }

        .support-btn.secondary:hover {
          background: #f0f4ff;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
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
          
          .hero-section, .categories-section, .faq-items-section, .support-section {
            padding: 30px 20px;
            margin: 20px auto;
          }
          
          .category-buttons {
            justify-content: flex-start;
          }
          
          .category-buttons button {
            padding: 10px 15px;
            font-size: 0.9rem;
          }
          
          .faq-question h3 {
            font-size: 1.1rem;
          }
          
          .support-section h2 {
            font-size: 2rem;
          }
          
              `}</style>
    </div>
  );
};


export default FAQ;
