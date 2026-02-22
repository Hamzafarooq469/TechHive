import React, { useState } from 'react';
import { FiSearch, FiDownload, FiVideo, FiFileText, FiMessageSquare, FiHeadphones } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const HelpCenter = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const resources = [
    {
      id: 1,
      title: t('helpCenter.articles.smartphoneSetup'),
      category: "setup",
      type: "guide",
      link: "#"
    },
    {
      id: 2,
      title: t('helpCenter.articles.wifiTroubleshooting'),
      category: "troubleshooting",
      type: "article",
      link: "#"
    },
    {
      id: 3,
      title: t('helpCenter.articles.laptopBatteryCare'),
      category: "maintenance",
      type: "video",
      link: "#"
    },
    {
      id: 4,
      title: t('helpCenter.articles.warrantyClaim'),
      category: "warranty",
      type: "guide",
      link: "#"
    },
    {
      id: 5,
      title: t('helpCenter.articles.bluetoothSetup'),
      category: "setup",
      type: "video",
      link: "#"
    },
    {
      id: 6,
      title: t('helpCenter.articles.returnPolicies'),
      category: "returns",
      type: "article",
      link: "#"
    }
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || resource.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getResourceTypeText = (type) => {
    switch (type) {
      case 'video':
        return t('helpCenter.resources.viewVideo');
      case 'guide':
        return t('helpCenter.resources.viewGuide');
      case 'article':
        return t('helpCenter.resources.viewArticle');
      default:
        return t('helpCenter.resources.viewArticle');
    }
  };

  const getCategoryTitle = () => {
    switch (activeCategory) {
      case 'setup':
        return t('helpCenter.resources.setupTitle');
      case 'troubleshooting':
        return t('helpCenter.resources.troubleshootingTitle');
      case 'maintenance':
        return t('helpCenter.resources.maintenanceTitle');
      case 'warranty':
        return t('helpCenter.resources.warrantyTitle');
      case 'returns':
        return t('helpCenter.resources.returnsTitle');
      default:
        return t('helpCenter.resources.title');
    }
  };

  return (
    <div className="help-center-page">
      {/* Hero Section */}
      <div className="hero-section">
        <h1>{t('helpCenter.title')}</h1>
        <p>{t('helpCenter.subtitle')}</p>
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder={t('helpCenter.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="content-container">
        {/* Categories Navigation */}
        <div className="categories-section">
          <h2 className="section-title">{t('helpCenter.categories.title')}</h2>
          <div className="category-buttons">
            <button 
              className={activeCategory === 'all' ? 'active' : ''}
              onClick={() => setActiveCategory('all')}
            >
              <FiHeadphones /> {t('helpCenter.categories.all')}
            </button>
            <button 
              className={activeCategory === 'setup' ? 'active' : ''}
              onClick={() => setActiveCategory('setup')}
            >
              <FiDownload /> {t('helpCenter.categories.setup')}
            </button>
            <button 
              className={activeCategory === 'troubleshooting' ? 'active' : ''}
              onClick={() => setActiveCategory('troubleshooting')}
            >
              <FiFileText /> {t('helpCenter.categories.troubleshooting')}
            </button>
            <button 
              className={activeCategory === 'maintenance' ? 'active' : ''}
              onClick={() => setActiveCategory('maintenance')}
            >
              <FiFileText /> {t('helpCenter.categories.maintenance')}
            </button>
            <button 
              className={activeCategory === 'warranty' ? 'active' : ''}
              onClick={() => setActiveCategory('warranty')}
            >
              <FiFileText /> {t('helpCenter.categories.warranty')}
            </button>
            <button 
              className={activeCategory === 'returns' ? 'active' : ''}
              onClick={() => setActiveCategory('returns')}
            >
              <FiFileText /> {t('helpCenter.categories.returns')}
            </button>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="resources-section">
          <h2 className="section-title">
            {getCategoryTitle()}
          </h2>
          
          {filteredResources.length > 0 ? (
            <div className="resources-grid">
              {filteredResources.map(resource => (
                <div key={resource.id} className="resource-card">
                  <div className="resource-icon">
                    {resource.type === 'video' ? <FiVideo /> : 
                     resource.type === 'guide' ? <FiDownload /> : <FiFileText />}
                  </div>
                  <h3>{resource.title}</h3>
                  <div className="resource-meta">
                    <span className={`resource-category ${resource.category}`}>
                      {resource.category}
                    </span>
                    <span className="resource-type">{resource.type}</span>
                  </div>
                  <a href={resource.link} className="view-resource">
                    {getResourceTypeText(resource.type)}
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>{t('helpCenter.resources.noResults')}</p>
            </div>
          )}
        </div>

        {/* Support Options */}
        <div className="support-section">
          <h2 className="section-title">{t('helpCenter.support.title')}</h2>
          <div className="support-options">
            <div className="support-card">
              <div className="support-icon">
                <FiMessageSquare />
              </div>
              <h3>{t('helpCenter.support.liveChat.title')}</h3>
              <p>{t('helpCenter.support.liveChat.description')}</p>
              <a href="#" className="support-link">{t('helpCenter.support.liveChat.action')}</a>
            </div>
            <div className="support-card">
              <div className="support-icon">
                <FiHeadphones />
              </div>
              <h3>{t('helpCenter.support.phoneSupport.title')}</h3>
              <p>{t('helpCenter.support.phoneSupport.description')}</p>
              <a href="tel:+9251XXXXXXX" className="support-link">{t('helpCenter.support.phoneSupport.action')}</a>
            </div>
            <div className="support-card">
              <div className="support-icon">
                <FiFileText />
              </div>
              <h3>{t('helpCenter.support.submitTicket.title')}</h3>
              <p>{t('helpCenter.support.submitTicket.description')}</p>
              <a href="/contact" className="support-link">{t('helpCenter.support.submitTicket.action')}</a>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .help-center-page {
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
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .category-buttons button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 15px;
          border: 2px solid #ddd;
          border-radius: 10px;
          background: white;
          font-size: 1rem;
          font-weight: 600;
          color: #2c3e50;
          cursor: pointer;
          transition: all 0.3s ease;
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

        .resources-section {
          background: white;
          border-radius: 20px;
          margin: 40px auto;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .resources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 30px;
        }

        .resource-card {
          background: #f9f9f9;
          border-radius: 15px;
          padding: 30px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: 1px solid #eee;
        }

        .resource-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.1);
          border-color: #667eea;
        }

        .resource-icon {
          width: 50px;
          height: 50px;
          background: linear-gradient(45deg, #667eea, #764ba2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          color: white;
          font-size: 1.2rem;
        }

        .resource-card h3 {
          font-size: 1.3rem;
          color: #2c3e50;
          margin-bottom: 15px;
          min-height: 60px;
        }

        .resource-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 0.9rem;
        }

        .resource-category {
          padding: 5px 10px;
          border-radius: 20px;
          background: #e0e0e0;
          text-transform: capitalize;
        }

        .resource-category.setup { background: #d4edff; color: #0066cc; }
        .resource-category.troubleshooting { background: #ffe8e8; color: #cc0000; }
        .resource-category.maintenance { background: #e8f5e9; color: #2e7d32; }
        .resource-category.warranty { background: #fff3e0; color: #e65100; }
        .resource-category.returns { background: #f3e5f5; color: #7b1fa2; }

        .resource-type {
          color: #666;
          font-style: italic;
        }

        .view-resource {
          display: inline-block;
          padding: 8px 20px;
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          transition: transform 0.3s ease;
        }

        .view-resource:hover {
          transform: translateY(-3px);
        }

        .no-results {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .support-section {
          background: white;
          border-radius: 20px;
          margin: 40px auto;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .support-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
        }

        .support-card {
          background: #f9f9f9;
          border-radius: 15px;
          padding: 30px;
          text-align: center;
          transition: transform 0.3s ease;
          border: 1px solid #eee;
        }

        .support-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.1);
          border-color: #667eea;
        }

        .support-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(45deg, #667eea, #764ba2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: white;
          font-size: 1.5rem;
        }

        .support-card h3 {
          font-size: 1.5rem;
          color: #2c3e50;
          margin-bottom: 10px;
        }

        .support-card p {
          color: #666;
          margin-bottom: 20px;
        }

        .support-link {
          display: inline-block;
          padding: 10px 25px;
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          transition: transform 0.3s ease;
        }

        .support-link:hover {
          transform: translateY(-3px);
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
          
          .hero-section, .categories-section, .resources-section, .support-section {
            padding: 30px 20px;
            margin: 20px auto;
          }
          
          .category-buttons {
            grid-template-columns: 1fr 1fr;
          }
          
          .resources-grid {
            grid-template-columns: 1fr;
          }
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
      `}</style>
    </div>
  );
};

export default HelpCenter;