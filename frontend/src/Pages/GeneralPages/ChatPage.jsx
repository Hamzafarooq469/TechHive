import React, { useState, useEffect } from 'react';
import Message from './Message';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

const ChatPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loggedInUser = useSelector((state) => state.user.currentUser?.user);

  useEffect(() => {
    if (!loggedInUser) return;

    const fetchUsers = async () => {
      try {
        let response;
        if (loggedInUser.role === 'user' || loggedInUser.role === 'admin') {
          // Show only users with customer_support role
          response = await axios.get('/user/all');
          response.data = response.data.filter(user => user.role === 'customer_support');
        } else if (loggedInUser.role === 'customer_support') {
          // Show only users who have messaged the support user
          response = await axios.get(`/message/contacts/${loggedInUser.uid}`);;
          console.log(response.data)
        } else {
          response = { data: [] };
        }
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [loggedInUser]);

  if (!loggedInUser) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '20px',
        color: '#888'
      }}>
        {t('chatPage.accessDenied')}
      </div>
    );
  }

  if (loading) {
    return <div>{t('chatPage.loading')}</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* User List Sidebar */}
      <div style={{
        width: '300px',
        borderRight: '1px solid #ddd',
        padding: '20px',
        overflowY: 'auto'
      }} className={sidebarOpen ? 'mobile-open' : ''}>
        {/* <h3>Users</h3> */}
        <h3>{loggedInUser.role === 'customer_support' ? t('chatPage.sidebar.users') : t('chatPage.sidebar.customerSupport')}</h3>
        {users.length === 0 ? (
          <p style={{ color: '#999' }}>{t('chatPage.sidebar.noUsers')}</p>
        ) : (
          users.map(user => (
            <div
              key={user.uid}
              onClick={() => setSelectedUser(user)}
              style={{
                padding: '10px',
                cursor: 'pointer',
                backgroundColor: selectedUser?.uid === user.uid ? '#e3f2fd' : 'transparent',
                borderRadius: '4px',
                marginBottom: '5px'
              }}
            >
              <strong>{user.name}</strong>
              <br />
              <small style={{ color: '#666' }}>{user.email}</small>
            </div>
          ))
        )}
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1 }}>
        {selectedUser ? (
          <Message
            targetUserId={selectedUser.uid}
            targetUserName={selectedUser.name}
          />
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: '#666'
          }}>
            {t('chatPage.chatArea.selectUser')}
          </div>
        )}
      </div>

      {/* Mobile Toggle Button */}
      <button 
        className="mobile-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={t('chatPage.mobile.toggleButton')}
      >
        ☰
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />}

      <style jsx>{`
        /* Mobile Responsive Design Only */
        @media (max-width: 768px) {
          div[style*="display: flex"] {
            position: relative;
          }
          
          div[style*="width: 300px"] {
            position: fixed !important;
            top: 0 !important;
            left: -100% !important;
            height: 100vh !important;
            width: 85% !important;
            max-width: 300px !important;
            transform: translateX(0) !important;
            transition: transform 0.3s ease !important;
            z-index: 1000 !important;
            background: white !important;
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1) !important;
          }
          
          div[style*="width: 300px"].mobile-open {
            transform: translateX(100%) !important;
          }
          
          /* Mobile toggle button */
          .mobile-toggle {
            display: block !important;
            position: fixed !important;
            top: 20px !important;
            left: 20px !important;
            z-index: 1001 !important;
            background: #007bff !important;
            color: white !important;
            border: none !important;
            border-radius: 8px !important;
            padding: 12px 16px !important;
            font-size: 18px !important;
            cursor: pointer !important;
            box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3) !important;
            transition: all 0.3s ease !important;
          }
          
          .mobile-toggle:hover {
            background: #0056b3 !important;
            transform: translateY(-2px) !important;
          }
          
          /* Mobile overlay */
          .mobile-overlay {
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: rgba(0, 0, 0, 0.5) !important;
            z-index: 999 !important;
          }
        }
        
        @media (max-width: 480px) {
          div[style*="width: 300px"] {
            width: 90% !important;
            max-width: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatPage;