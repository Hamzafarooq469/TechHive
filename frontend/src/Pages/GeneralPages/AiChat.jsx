import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// Simple markdown-like formatter
const formatMessage = (content) => {
  if (!content) return content;
  
  let formatted = content;
  
  formatted = formatted.replace(/^\s*-\s*!\[.*?\]\([^)]+\)\s*$/gim, '');
  formatted = formatted.replace(/!\[.*?\]\([^)]+\)/g, '');
  
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  formatted = formatted.replace(/^### (.*$)/gim, '<div style="font-size: 1.1em; font-weight: bold; margin: 4px 0 2px 0;">$1</div>');
  
  formatted = formatted.replace(/^## (.*$)/gim, '<div style="font-size: 1.05em; font-weight: bold; margin: 3px 0 2px 0;">$1</div>');
  
  formatted = formatted.replace(/^# (.*$)/gim, '<div style="font-size: 1.08em; font-weight: bold; margin: 4px 0 2px 0;">$1</div>');
  
  formatted = formatted.replace(/^- (.*$)/gim, '<div style="margin-left: 15px; margin-bottom: 2px;">• $1</div>');
  
  formatted = formatted.replace(/\n/g, '<br/>');
  
  return formatted;
};

const AiChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('default');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  const navigate = useNavigate();

  const loggedInUser = useSelector((state) => state.user.currentUser?.user);
  const uid = loggedInUser?.uid;

  // Check if user is logged in
  const isLoggedIn = !!uid;

  // Set sessionId based on uid when available
  useEffect(() => {
    if (uid) {
      setSessionId(uid);
    }
  }, [uid]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      scrollToBottom();
      prevMessageCountRef.current = messages.length;
    }
  }, [messages]);

  const loadConversationHistory = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/chatbot/history/${sessionId}`);
      const loadedMessages = response.data.messages || [];
      setMessages(loadedMessages);
      prevMessageCountRef.current = loadedMessages.length;
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  }, [sessionId]);

  useEffect(() => {
    loadConversationHistory();
  }, [loadConversationHistory]);

  useEffect(() => {
    return () => {
      if (window.currentStreamCleanup) {
        window.currentStreamCleanup();
      }
    };
  }, []);


  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    const currentInput = inputMessage;
    setInputMessage('');
    
    // Focus input after sending
    setTimeout(() => inputRef.current?.focus(), 100);

    // Add temporary AI message placeholder for streaming
    const aiMessageId = Date.now();
    const initialAiMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      id: aiMessageId,
      isStreaming: true
    };
    
    setMessages(prev => [...prev, initialAiMessage]);

    try {
      // Create EventSource for streaming
      const eventSource = new EventSource(
        `http://localhost:5000/api/chatbot/chat/stream?${new URLSearchParams({
          message: currentInput,
          session_id: sessionId,
          ...(isLoggedIn && uid ? { user_id: uid } : {})
        })}`
      );

      let finalContent = '';
      let hasError = false;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'status') {
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: data.content, isStreaming: true }
                : msg
            ));
          } else if (data.type === 'content') {
            finalContent = data.content;
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { 
                    ...msg, 
                    content: data.content, 
                    isStreaming: data.is_partial,
                    needs_approval: data.needs_approval 
                  }
                : msg
            ));
          } else if (data.type === 'complete') {
            finalContent = data.content;
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { 
                    ...msg, 
                    content: data.content, 
                    isStreaming: false,
                    needs_approval: data.needs_approval 
                  }
                : msg
            ));
            setLoading(false);
            eventSource.close();
          } else if (data.type === 'error') {
            hasError = true;
            console.error('Streaming error:', data.content);
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { 
                    ...msg, 
                    content: data.content, 
                    isStreaming: false,
                    role: 'system' 
                  }
                : msg
            ));
            setLoading(false);
            eventSource.close();
          } else if (data.type === 'end') {
            setLoading(false);
            eventSource.close();
          }
        } catch (parseError) {
          console.error('Failed to parse streaming data:', parseError, 'Raw data:', event.data);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
        eventSource.close();
        setLoading(false);
        
        if (!hasError && !finalContent) {
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  content: 'Sorry, I encountered an error while processing your request. Please try again.',
                  isStreaming: false,
                  role: 'system'
                }
              : msg
          ));
        }
      };

      const cleanup = () => {
        eventSource.close();
        setLoading(false);
      };

      setTimeout(() => {
        setLoading(false);
      }, 30000);

      window.currentStreamCleanup = cleanup;

    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = {
        role: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? errorMessage
          : msg
      ));
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = async () => {
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      try {
        await axios.delete(`http://localhost:5000/api/chatbot/history/${sessionId}`);
        setMessages([]);
      } catch (error) {
        console.error('Failed to clear conversation:', error);
        alert('Failed to clear conversation');
      }
    }
  };

  return (
    <div className="ai-chat-container">
      {/* Header */}
      <div className="ai-chat-header">
        <div className="header-content">
          <h1 className="header-title">
            <span className="header-icon">🤖</span>
            AI Assistant
          </h1>
          {isLoggedIn && (
            <span className="header-subtitle">Welcome, {loggedInUser?.name || 'User'}!</span>
          )}
        </div>
        <div className="header-actions">
          <Link to="/" className="btn-secondary">
            ← Back to Products
          </Link>
          {!isLoggedIn && (
            <button onClick={() => navigate('/login')} className="btn-primary">
              Login
            </button>
          )}
          {isLoggedIn && (
            <button onClick={clearConversation} className="btn-danger">
              Clear Chat
            </button>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="messages-container" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👋</div>
            <h2>Hi! I'm your AI shopping assistant</h2>
            <p className="empty-description">I can help you:</p>
            <ul className="empty-features">
              <li>🔍 Find and search products</li>
              <li>ℹ️ Get product information and recommendations</li>
              <li>❓ Answer questions about our store</li>
              {isLoggedIn ? (
                <li>🛒 Manage your cart and orders</li>
              ) : (
                <li>🔐 Login to access cart and order management</li>
              )}
            </ul>
            <p className="empty-cta">What can I help you with today?</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message, index) => (
              <div 
                key={message.id || index} 
                className={`message-wrapper ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
              >
                <div className="message-bubble">
                  {message.role === 'assistant' && (
                    <div className="message-avatar">🤖</div>
                  )}
                  <div className="message-content">
                    <div 
                      className="message-text"
                      dangerouslySetInnerHTML={{ 
                        __html: message.role === 'assistant' ? 
                          formatMessage(message.content) + (message.isStreaming ? '<span class="cursor-blink">▊</span>' : '') : 
                          message.content 
                      }}
                    />
                    {message.needs_approval && (
                      <div className="approval-notice">
                        ⚠️ This response requires human approval
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="message-avatar user-avatar">👤</div>
                  )}
                </div>
              </div>
            ))}
            {loading && messages.length > 0 && (
              <div className="message-wrapper ai-message">
                <div className="message-bubble">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="input-container">
        <form onSubmit={sendMessage} className="input-form">
          <div className="input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isLoggedIn ? "Ask me anything about products, your cart, or our store..." : "Ask me about products and our store (login for cart features)..."}
              disabled={loading}
              className="chat-input"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="send-button"
              aria-label="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .ai-chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #f7f7f8;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        }

        .ai-chat-header {
          background: white;
          border-bottom: 1px solid #e5e5e6;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .header-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .header-title {
          font-size: 18px;
          font-weight: 600;
          color: #202123;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-icon {
          font-size: 20px;
        }

        .header-subtitle {
          font-size: 13px;
          color: #8e8ea0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .btn-secondary, .btn-primary, .btn-danger {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
        }

        .btn-secondary {
          background: #f4f4f5;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #e5e5e6;
        }

        .btn-primary {
          background: #10a37f;
          color: white;
        }

        .btn-primary:hover {
          background: #0d8f6e;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px 0;
          scroll-behavior: auto;
          position: relative;
        }

        .messages-container::-webkit-scrollbar {
          width: 8px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        .empty-state {
          max-width: 768px;
          margin: 0 auto;
          padding: 80px 24px;
          text-align: center;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .empty-state h2 {
          font-size: 24px;
          font-weight: 600;
          color: #202123;
          margin: 0 0 16px 0;
        }

        .empty-description {
          font-size: 16px;
          color: #565869;
          margin-bottom: 24px;
        }

        .empty-features {
          list-style: none;
          padding: 0;
          margin: 0 auto 32px;
          max-width: 400px;
          text-align: left;
        }

        .empty-features li {
          padding: 8px 0;
          font-size: 15px;
          color: #565869;
        }

        .empty-cta {
          font-size: 15px;
          color: #8e8ea0;
          font-style: italic;
        }

        .messages-list {
          max-width: 768px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .message-wrapper {
          display: flex;
          margin-bottom: 24px;
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .user-message {
          justify-content: flex-end;
        }

        .ai-message {
          justify-content: flex-start;
        }

        .message-bubble {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          max-width: 85%;
          position: relative;
        }


        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          background: #ececf1;
        }

        .user-avatar {
          background: #10a37f;
        }

        .message-content {
          flex: 1;
          min-width: 0;
        }

        .user-message .message-content {
          background: #10a37f;
          color: white;
          padding: 12px 16px;
          border-radius: 12px;
          border-top-right-radius: 4px;
        }

        .ai-message .message-content {
          background: white;
          color: #353740;
          padding: 12px 16px;
          border-radius: 12px;
          border-top-left-radius: 4px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .message-text {
          font-size: 15px;
          line-height: 1.6;
          word-wrap: break-word;
        }

        .message-text :global(strong) {
          font-weight: 600;
        }

        .approval-notice {
          margin-top: 8px;
          padding: 8px 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 6px;
          font-size: 13px;
          color: #dc2626;
        }

        .cursor-blink {
          animation: blink 1s infinite;
          color: #10a37f;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #9ca3af;
          animation: typing 1.4s infinite;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        .input-container {
          background: white;
          border-top: 1px solid #e5e5e6;
          padding: 16px 24px;
          position: sticky;
          bottom: 0;
          z-index: 10;
        }

        .input-form {
          max-width: 768px;
          margin: 0 auto;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          padding: 8px 12px;
          gap: 8px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-wrapper:focus-within {
          border-color: #10a37f;
          box-shadow: 0 0 0 3px rgba(16, 163, 127, 0.1);
        }

        .chat-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 15px;
          color: #202123;
          background: transparent;
          padding: 8px 4px;
          resize: none;
          max-height: 200px;
          font-family: inherit;
        }

        .chat-input::placeholder {
          color: #9ca3af;
        }

        .chat-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .send-button {
          background: #10a37f;
          color: white;
          border: none;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
          flex-shrink: 0;
          padding: 0;
        }

        .send-button:hover:not(:disabled) {
          background: #0d8f6e;
        }

        .send-button:disabled {
          background: #d1d5db;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .send-button svg {
          stroke-width: 2.5;
        }

        @media (max-width: 768px) {
          .ai-chat-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .header-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .message-bubble {
            max-width: 90%;
          }

          .messages-list {
            padding: 0 16px;
          }

          .input-container {
            padding: 12px 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default AiChat;