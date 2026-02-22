
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [openDropdown, setOpenDropdown] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleDropdown = (menu) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const navItems = [
    {
      name: 'Products',
      // icon: '📦',
      icon: '',
      children: [
        { name: 'All Products', path: '/admin/products', icon: '' },
        { name: 'Create Product', path: '/admin/createProduct', icon: '' },
        { name: 'Products Analytics', path: '/admin/productAnalytics', icon: '' },
      ]
    },
    {
      name: 'Users',
      // icon: '👥',
      icon: '',
      children: [
        { name: 'All Users', path: '/admin/getAllUsersForAdmin', icon: '' },
        { name: 'User Analytics', path: '/admin/userAnalytics', icon: '' },
      ]
    },
    {
      name: 'Orders',
      // icon: '📝',
      icon: '',
      children: [
        { name: 'All Orders', path: '/admin/getAllOrdersForAdmin', icon: '' },
        { name: 'Order Analytics', path: '/admin/orderAnalytics', icon: '' },
      ]
    },
    {
    name: 'Machine Learning', // New Top-Level Group
    // icon: '',
    icon: '',
    children: [
      // { name: 'Prediction Dashboard', path: '/admin/ml/dashboard', icon: '' }, // Overview
      { name: 'Customer Churn', path: '/admin/churnModel', icon: '' },       // Individual/Batch Churn Prediction
      { name: 'Sentiment - Manual Text', path: '/admin/sentimentModel', icon: '' }, // Sentiment Analysis - Manual
      { name: 'Sentiment - Product Comments', path: '/admin/sentimentProductComments', icon: '🛍️' }, // Sentiment Analysis - Product Comments
      // { name: 'Customer Segmentation', path: '/admin/ml/segmentation', icon: '' }, // (Future Model)
      // { name: 'Next Best Offer', path: '/admin/ml/offers', icon: '' },        // (Future Model)
    ]
  },    
  {
    name: 'Mailer', // New Top-Level Group
    icon: '',
    children: [
      { name: 'Mail Dashboard', path: '/admin/sendingMail', icon: '' }, // Overview
      // { name: 'Mail Templates', path: '/admin/template', icon: '' }, // Overview
    ]
  },  
  {
    name: 'Coupon', // New Top-Level Group
    icon: '',
    children: [
      { name: 'Coupon Manager', path: '/couponManager', icon: '' }, // Overview
    ]
  },
  ];

  const styles = {
    container: {
      display: 'flex',
      height: '100vh',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      position: 'relative'
    },
    sidebar: {
      width: isSidebarOpen ? '280px' : '0px',
      background: '#2c3e50',
      padding: isSidebarOpen ? '25px 20px' : '0px',
      color: '#ecf0f1',
      boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease',
      overflow: 'hidden',
      '@media (max-width: 768px)': {
        position: 'fixed',
        left: isSidebarOpen ? '0' : '-280px',
        top: '0',
        height: '100vh',
        zIndex: 1000,
        width: '280px',
        padding: '25px 20px'
      }
    },
    header: {
      fontSize: '1.8rem',
      marginBottom: '40px',
      paddingBottom: '15px',
      borderBottom: '2px solid #3d566e',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      opacity: isSidebarOpen ? 1 : 0,
      transition: 'opacity 0.3s ease',
      '@media (max-width: 768px)': {
        fontSize: '1.5rem',
        marginBottom: '30px',
        opacity: 1
      }
    },
    navItem: {
      margin: '12px 0',
      cursor: 'pointer',
      padding: '12px 15px',
      borderRadius: '6px',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontWeight: '500',
      fontSize: '1.05rem',
      backgroundColor: 'transparent',
      opacity: isSidebarOpen ? 1 : 0,
      '@media (max-width: 768px)': {
        fontSize: '1rem',
        padding: '10px 12px',
        opacity: 1
      }
    },
    activeNavItem: {
      backgroundColor: '#3498db',
      color: 'white',
      fontWeight: '600'
    },
    dropdown: {
      paddingLeft: '15px',
      marginTop: '5px',
      borderLeft: '2px solid #3d566e',
      marginLeft: '20px',
      opacity: isSidebarOpen ? 1 : 0,
      transition: 'opacity 0.3s ease',
      '@media (max-width: 768px)': {
        opacity: 1
      }
    },
    dropdownItem: {
      margin: '8px 0',
      cursor: 'pointer',
      padding: '10px 15px',
      borderRadius: '6px',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '0.95rem',
      '@media (max-width: 768px)': {
        fontSize: '0.9rem',
        padding: '8px 12px'
      }
    },
    activeDropdownItem: {
      color: '#3498db',
      fontWeight: '600',
      backgroundColor: 'rgba(52, 152, 219, 0.1)'
    },
    content: {
      flexGrow: 1,
      padding: '30px',
      backgroundColor: '#f5f7fa',
      overflowY: 'auto',
      transition: 'all 0.3s ease',
      marginLeft: isSidebarOpen ? '0' : '0',
      '@media (max-width: 768px)': {
        padding: '20px 15px',
        marginLeft: '0',
        width: '100%',
        minHeight: '100vh'
      }
    },
    chevron: {
      marginLeft: 'auto',
      transition: 'transform 0.3s ease',
      transform: 'rotate(0deg)'
    },
    chevronOpen: {
      transform: 'rotate(90deg)'
    },
    toggleButton: {
      position: 'fixed',
      top: '20px',
      left: isSidebarOpen ? '300px' : '20px',
      zIndex: 1001,
      background: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '1.2rem',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transition: 'all 0.3s ease',
      '@media (max-width: 768px)': {
        left: '20px'
      }
    },
    overlay: {
      display: 'none',
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 999,
      '@media (max-width: 768px)': {
        display: isSidebarOpen ? 'block' : 'none'
      }
    },
    closeButton: {
      display: 'none',
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: 'none',
      border: 'none',
      color: '#ecf0f1',
      fontSize: '1.5rem',
      cursor: 'pointer',
      '@media (max-width: 768px)': {
        display: 'block'
      }
    }
  };

  // Function to apply responsive styles
  const getResponsiveStyle = (baseStyle) => {
    let responsiveStyle = { ...baseStyle };
    
    if (isMobile) {
      Object.keys(baseStyle).forEach(key => {
        if (baseStyle[key] && baseStyle[key]['@media (max-width: 768px)']) {
          responsiveStyle = { ...responsiveStyle, ...baseStyle[key]['@media (max-width: 768px)'] };
        }
      });
    }
    
    // Remove media query objects
    Object.keys(responsiveStyle).forEach(key => {
      if (key.startsWith('@media')) {
        delete responsiveStyle[key];
      }
    });
    
    return responsiveStyle;
  };

  return (
    <div style={styles.container}>
      {/* Toggle Button - Always visible */}
      <button 
        style={getResponsiveStyle(styles.toggleButton)}
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? '◀' : '▶'}
      </button>

      {/* Overlay */}
      <div 
        style={getResponsiveStyle(styles.overlay)}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <div style={getResponsiveStyle(styles.sidebar)}>
        {/* Close Button for Mobile */}
        <button 
          style={getResponsiveStyle(styles.closeButton)}
          onClick={closeSidebar}
          aria-label="Close sidebar"
        >
          ✕
        </button>

        <h2 style={getResponsiveStyle(styles.header)}> Admin Panel</h2>
        {navItems.map((item) => (
          <div key={item.name}>
            <div
              onClick={() => {
                if (item.children) {
                  toggleDropdown(item.name);
                } else {
                  navigate(item.path);
                  closeSidebar();
                }
              }}
              style={{
                ...getResponsiveStyle(styles.navItem),
                ...(item.children?.some(child => location.pathname.startsWith(child.path)) ||
                  location.pathname.startsWith(item.path || '')
                  ? styles.activeNavItem
                  : {}),
                backgroundColor: openDropdown === item.name ? 'rgba(255,255,255,0.1)' : 'transparent'
              }}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
              {item.children && (
                <span style={{
                  ...styles.chevron,
                  ...(openDropdown === item.name ? styles.chevronOpen : {})
                }}>›</span>
              )}
            </div>

            {item.children && openDropdown === item.name && (
              <div style={styles.dropdown}>
                {item.children.map((child) => (
                  <div
                    key={child.name}
                    onClick={() => {
                      navigate(child.path);
                      closeSidebar();
                    }}
                    style={{
                      ...getResponsiveStyle(styles.dropdownItem),
                      ...(location.pathname === child.path ? styles.activeDropdownItem : {})
                    }}
                  >
                    <span>{child.icon}</span>
                    <span>{child.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={getResponsiveStyle(styles.content)}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
