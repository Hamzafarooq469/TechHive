
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import AdminMailBot from './AdminMailBot';

const SendingMails = () => {
  const loggedInUser = useSelector((state) => state.user.currentUser?.user);
  const senderEmail = loggedInUser?.email;

  const [sendMode, setSendMode] = useState('single'); // single, multiple, filtered, all
  const [showBot, setShowBot] = useState(false); // Toggle bot view
  const [messagePreviewMode, setMessagePreviewMode] = useState('html'); // 'html' or 'rendered'
  const [formData, setFormData] = useState({
    senderMail: '',
    receiverMail: '',
    subject: '',
    message: '',
    jobType: 'default'
  });

  // Filter state
  const [filters, setFilters] = useState({
    gender: 'all',
    ageMin: '',
    ageMax: '',
    maritalStatus: 'all',
    education: [],
    frequency: [],
    discountImportance: [],
    monthlySpendingMin: '',
    monthlySpendingMax: '',
    birthdayFilter: '',
    specificEmails: [],
    sendToAll: false
  });

  const [multipleEmails, setMultipleEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [recipientCount, setRecipientCount] = useState(0);

  // User search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [manualEmail, setManualEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (senderEmail) {
      setFormData(prev => ({ ...prev, senderMail: senderEmail }));
    }
  }, [senderEmail]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Search users
  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(`/user/search?query=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Add user from search results
  const addUserToSelected = (user) => {
    if (!selectedUsers.find(u => u.email === user.email)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  // Remove selected user
  const removeSelectedUser = (email) => {
    setSelectedUsers(selectedUsers.filter(u => u.email !== email));
  };

  // Add manual email
  const addManualEmail = () => {
    const email = manualEmail.trim();
    if (email && email.includes('@')) {
      if (!selectedUsers.find(u => u.email === email)) {
        setSelectedUsers([...selectedUsers, { name: email, email }]);
      }
      setManualEmail('');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      const array = filters[name] || [];
      setFilters(prev => ({
        ...prev,
        [name]: checked 
          ? [...array, value] 
          : array.filter(item => item !== value)
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // Validation for multiple mode
      if (sendMode === 'multiple' && selectedUsers.length === 0) {
        setStatus({ 
          type: 'error', 
          message: 'Please select at least one recipient' 
        });
        setLoading(false);
        return;
      }

      if (sendMode === 'single') {
        // Original single email functionality
        const response = await axios.post('/mail/sendMail', formData);
        setStatus({ type: 'success', message: 'Email sent successfully!' });
        setFormData({ 
          senderMail: senderEmail, 
          receiverMail: '', 
          subject: '', 
          message: '', 
          jobType: 'default' 
        });
      } else {
        // Bulk email functionality
        const bulkFilters = { ...filters };
        
        if (sendMode === 'multiple') {
          // Use selected users' emails
          const emails = selectedUsers.map(u => u.email);
          bulkFilters.specificEmails = emails;
          bulkFilters.sendToAll = false;
        } else if (sendMode === 'all') {
          bulkFilters.sendToAll = true;
        } else if (sendMode === 'filtered') {
          bulkFilters.sendToAll = false;
          bulkFilters.specificEmails = [];
        }

        const response = await axios.post('/mail/sendBulkMail', {
          senderMail: formData.senderMail,
          subject: formData.subject,
          message: formData.message,
          jobType: formData.jobType,
          filters: bulkFilters
        });

        setStatus({ 
          type: 'success', 
          message: `Emails queued successfully to ${response.data.recipientCount} recipients!` 
        });
        setRecipientCount(response.data.recipientCount);
      }
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to send email' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle email generated by bot
  const handleEmailGenerated = ({ subject, html }) => {
    setFormData(prev => ({
      ...prev,
      subject: subject,
      message: html
    }));
    setMessagePreviewMode('rendered'); // Switch to preview mode
    setShowBot(false);
    setStatus({ 
      type: 'success', 
      message: '✓ Email content loaded from AI Assistant! Preview below or switch to Edit mode to modify.' 
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <h1 style={{ marginBottom: '10px' }}>Send Email</h1>
          <p style={{ color: '#666', margin: 0 }}>
            Send emails to single recipient, multiple recipients, or filtered customer segments
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowBot(!showBot)}
          style={{
            padding: '12px 24px',
            backgroundColor: showBot ? '#6c757d' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {showBot ? '✕ Close' : ' AI Email Writer'}
        </button>
      </div>

      {showBot && (
        <div style={{ 
          marginBottom: '30px',
          height: '600px',
          border: '2px solid #667eea',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <AdminMailBot onEmailGenerated={handleEmailGenerated} />
        </div>
      )}
      
      {status.message && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: status.type === 'success' ? '#d4edda' : '#f8d7da',
          color: status.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${status.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Send Mode Selection */}
        <div style={{ 
          marginBottom: '30px', 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '16px' }}>
             Select Send Mode:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { value: 'single', label: ' Single Email', desc: 'Send to one recipient' },
              { value: 'multiple', label: ' Multiple Emails', desc: 'List of emails' },
              { value: 'filtered', label: ' Filtered', desc: 'By customer criteria' },
              { value: 'all', label: ' All Users', desc: 'Broadcast to everyone' }
            ].map(mode => (
              <label key={mode.value} style={{
                padding: '15px',
                border: `2px solid ${sendMode === mode.value ? '#007bff' : '#dee2e6'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: sendMode === mode.value ? '#e7f3ff' : 'white',
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  name="sendMode"
                  value={mode.value}
                  checked={sendMode === mode.value}
                  onChange={(e) => setSendMode(e.target.value)}
                  style={{ marginRight: '8px' }}
                />
                <div style={{ display: 'inline-block' }}>
                  <div style={{ fontWeight: '500' }}>{mode.label}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{mode.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* From Email */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            From (Your Email):
          </label>
          <input
            type="email"
            name="senderMail"
            value={formData.senderMail}
            readOnly
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: '#f5f5f5',
              cursor: 'not-allowed'
            }}
          />
        </div>

        {/* Recipient Input Based on Mode */}
        {sendMode === 'single' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              To (Email Address):
            </label>
            <input
              type="email"
              name="receiverMail"
              value={formData.receiverMail}
              onChange={handleChange}
              required
              placeholder="recipient@example.com"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
        )}

        {sendMode === 'multiple' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Select Recipients:
            </label>
            
            {/* Search Box */}
            <div style={{ position: 'relative', marginBottom: '15px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                placeholder="🔍 Search users by name or email..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              
              {/* Search Results Dropdown */}
              {searchQuery && searchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  marginTop: '5px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  {searchResults.map(user => (
                    <div
                      key={user._id}
                      onClick={() => addUserToSelected(user)}
                      style={{
                        padding: '10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      <div style={{ fontWeight: '500' }}>{user.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{user.email}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {isSearching && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  marginTop: '5px',
                  padding: '10px',
                  textAlign: 'center',
                  fontSize: '14px',
                  color: '#666'
                }}>
                  Searching...
                </div>
              )}
            </div>

            {/* Manual Email Input */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>
                Or add email manually:
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addManualEmail())}
                  placeholder="email@example.com"
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="button"
                  onClick={addManualEmail}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Selected Users List */}
            {selectedUsers.length > 0 && (
              <div style={{
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '10px' 
                }}>
                  <strong style={{ fontSize: '14px' }}>
                    Selected Recipients ({selectedUsers.length})
                  </strong>
                  <button
                    type="button"
                    onClick={() => setSelectedUsers([])}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Clear All
                  </button>
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px',
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}>
                  {selectedUsers.map((user, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        borderRadius: '20px',
                        fontSize: '13px'
                      }}
                    >
                      <span>{user.name}</span>
                      <button
                        type="button"
                        onClick={() => removeSelectedUser(user.email)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '16px',
                          lineHeight: '1',
                          padding: '0',
                          marginLeft: '4px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedUsers.length === 0 && (
              <div style={{
                padding: '15px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#856404'
              }}>
                ⚠️ Please search and select users or add email addresses manually
              </div>
            )}
          </div>
        )}

        {sendMode === 'all' && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffc107',
            borderRadius: '8px'
          }}>
            <strong>⚠️ Warning:</strong> This will send emails to ALL registered users in the system.
          </div>
        )}

        {/* Filtering Options */}
        {sendMode === 'filtered' && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>🎯 Filter Recipients</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              {/* Gender Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                  Gender:
                </label>
                <select
                  name="gender"
                  value={filters.gender}
                  onChange={handleFilterChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Age Range */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                  Age Range:
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="number"
                    name="ageMin"
                    value={filters.ageMin}
                    onChange={handleFilterChange}
                    placeholder="Min"
                    style={{
                      width: '50%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <input
                    type="number"
                    name="ageMax"
                    value={filters.ageMax}
                    onChange={handleFilterChange}
                    placeholder="Max"
                    style={{
                      width: '50%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Marital Status */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                  Marital Status:
                </label>
                <select
                  name="maritalStatus"
                  value={filters.maritalStatus}
                  onChange={handleFilterChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">All</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>

              {/* Birthday Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                  🎂 Birthday:
                </label>
                <select
                  name="birthdayFilter"
                  value={filters.birthdayFilter}
                  onChange={handleFilterChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">No Filter</option>
                  <option value="today">Today</option>
                  <option value="thisWeek">This Week</option>
                  <option value="thisMonth">This Month</option>
                </select>
              </div>

              {/* Monthly Spending */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' }}>
                  Monthly Spending ($):
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="number"
                    name="monthlySpendingMin"
                    value={filters.monthlySpendingMin}
                    onChange={handleFilterChange}
                    placeholder="Min"
                    style={{
                      width: '50%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <input
                    type="number"
                    name="monthlySpendingMax"
                    value={filters.monthlySpendingMax}
                    onChange={handleFilterChange}
                    placeholder="Max"
                    style={{
                      width: '50%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Education */}
            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                🎓 Education:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                {['High School', 'Bachelor', 'Master', 'PhD', 'Other'].map(edu => (
                  <label key={edu} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="education"
                      value={edu}
                      checked={filters.education.includes(edu)}
                      onChange={handleFilterChange}
                      style={{ marginRight: '5px' }}
                    />
                    {edu}
                  </label>
                ))}
              </div>
            </div>

            {/* Shopping Frequency */}
            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                🛍️ Shopping Frequency:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                {['Weekly', 'Monthly', 'Quarterly', 'Yearly', 'Occasionally'].map(freq => (
                  <label key={freq} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="frequency"
                      value={freq}
                      checked={filters.frequency.includes(freq)}
                      onChange={handleFilterChange}
                      style={{ marginRight: '5px' }}
                    />
                    {freq}
                  </label>
                ))}
              </div>
            </div>

            {/* Discount Importance */}
            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                💰 Discount Importance:
              </label>
              <div style={{ display: 'flex', gap: '15px' }}>
                {['Low', 'Medium', 'High'].map(imp => (
                  <label key={imp} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="discountImportance"
                      value={imp}
                      checked={filters.discountImportance.includes(imp)}
                      onChange={handleFilterChange}
                      style={{ marginRight: '5px' }}
                    />
                    {imp}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Subject */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Subject:
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            placeholder="Email subject"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Email Priority */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Email Priority:
          </label>
          <select
            name="jobType"
            value={formData.jobType}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              backgroundColor: 'white'
            }}
          >
            <option value="default"> Normal Priority</option>
            <option value="signup"> High Priority - Signup/Verification</option>
            <option value="order"> Highest Priority - Orders/Transactions</option>
          </select>
          <small style={{ color: '#666', display: 'block', marginTop: '5px', fontSize: '12px' }}>
             Higher priority emails are processed first in the queue
          </small>
        </div>

        {/* Message */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontWeight: '500' }}>
              Message:
            </label>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button
                type="button"
                onClick={() => setMessagePreviewMode('html')}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  border: messagePreviewMode === 'html' ? '2px solid #667eea' : '1px solid #ddd',
                  backgroundColor: messagePreviewMode === 'html' ? '#f0f4ff' : 'white',
                  color: messagePreviewMode === 'html' ? '#667eea' : '#666',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: messagePreviewMode === 'html' ? '600' : '400'
                }}
              >
                📝 Edit HTML
              </button>
              <button
                type="button"
                onClick={() => setMessagePreviewMode('rendered')}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  border: messagePreviewMode === 'rendered' ? '2px solid #667eea' : '1px solid #ddd',
                  backgroundColor: messagePreviewMode === 'rendered' ? '#f0f4ff' : 'white',
                  color: messagePreviewMode === 'rendered' ? '#667eea' : '#666',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: messagePreviewMode === 'rendered' ? '600' : '400'
                }}
              >
                👁️ Preview
              </button>
            </div>
          </div>
          {messagePreviewMode === 'html' ? (
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              placeholder="Write your message here..."
              rows="10"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                minHeight: '250px',
                padding: '20px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                fontSize: '14px',
                overflowY: 'auto',
                maxHeight: '500px'
              }}
              dangerouslySetInnerHTML={{ __html: formData.message }}
            />
          )}
          {messagePreviewMode === 'rendered' && (
            <small style={{ color: '#667eea', display: 'block', marginTop: '5px', fontSize: '12px' }}>
              💡 This is how recipients will see your email. Switch to "Edit HTML" to modify the content.
            </small>
          )}
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 30px',
              // backgroundColor: loading ? '#ccc' : '#007bff',
              // backgroundColor: loading ? '#ccc' : '#667eea ',
              // backgroundColor: loading ? '#ccc' : '#764ba2',
              // backgroundColor: loading ? '#ccc' : '#3498db ',
              // backgroundColor: loading ? '#ccc' : '#9b59b6 ',
              // backgroundColor: loading ? '' : '#dee2e6',
              // backgroundColor: loading ? '#ccc' : '#9b59b6 ',
              // backgroundColor: loading ? '#ccc' : '#9b59b6 ',
              // background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'Sending...' : `Send Email${sendMode !== 'single' ? 's' : ''}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SendingMails;