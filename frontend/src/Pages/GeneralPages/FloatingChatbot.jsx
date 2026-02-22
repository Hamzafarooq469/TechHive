import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { FiMessageCircle, FiX, FiSend, FiMinus, FiTrash2 } from 'react-icons/fi';

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

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('default');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  const loggedInUser = useSelector((state) => state.user.currentUser?.user);
  const uid = loggedInUser?.uid;

  if (!uid) {
    return null;
  }

  useEffect(() => {
    if (uid) {
      setSessionId(uid);
    }
  }, [uid]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  };

  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      scrollToBottom();
      prevMessageCountRef.current = messages.length;
    }
  }, [messages]);

  useEffect(() => {
    if (loading) {
      scrollToBottom();
    }
  }, [messages, loading]);

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
    if (isOpen && !isMinimized) {
      loadConversationHistory();
    }
  }, [loadConversationHistory, isOpen, isMinimized]);

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
    const currentInput = inputMessage;
    setInputMessage('');
    setLoading(true);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);

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
      if (window.currentStreamCleanup) {
        window.currentStreamCleanup();
      }

      const eventSource = new EventSource(
        `http://localhost:5000/api/chatbot/chat/stream?${new URLSearchParams({
          message: currentInput,
          session_id: sessionId,
          user_id: uid || 'anonymous'
        })}`
      );

      window.currentStreamCleanup = () => {
        eventSource.close();
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'status') {
            // Update status message (like "Processing...")
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: data.content, isStreaming: true }
                : msg
            ));
          } else if (data.type === 'content') {
            // Update with actual content
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { 
                    ...msg, 
                    content: data.content, 
                    isStreaming: data.is_partial
                  }
                : msg
            ));
          } else if (data.type === 'complete') {
            // Finalize the message
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { 
                    ...msg, 
                    content: data.content, 
                    isStreaming: false
                  }
                : msg
            ));
            setLoading(false);
            eventSource.close();
            window.currentStreamCleanup = null;
          } else if (data.type === 'error') {
            console.error('Stream error:', data.content);
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { 
                    ...msg, 
                    content: data.content || 'Sorry, I encountered an error. Please try again.', 
                    isStreaming: false,
                    error: true
                  }
                : msg
            ));
            setLoading(false);
            eventSource.close();
            window.currentStreamCleanup = null;
          } else if (data.type === 'end') {
            setLoading(false);
            eventSource.close();
            window.currentStreamCleanup = null;
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId && msg.content === ''
            ? { 
                ...msg, 
                content: 'Sorry, I encountered an error. Please try again.', 
                isStreaming: false,
                error: true
              }
            : msg
        ));
        eventSource.close();
        setLoading(false);
        window.currentStreamCleanup = null;
      };

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId
          ? { 
              ...msg, 
              content: 'Sorry, I encountered an error. Please try again.', 
              isStreaming: false,
              error: true
            }
          : msg
      ));
      setLoading(false);
    }
  };

  const clearChat = async () => {
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      try {
        await axios.delete(`http://localhost:5000/api/chatbot/history/${sessionId}`);
        setMessages([]);
        prevMessageCountRef.current = 0;
      } catch (error) {
        console.error('Failed to clear conversation:', error);
      }
    }
  };

  const toggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <>
      <style jsx>{`
        .floating-chatbot-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .chat-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
          transition: all 0.3s ease;
          color: white;
        }

        .chat-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
        }

        .chat-button svg {
          width: 28px;
          height: 28px;
        }

        .chat-window {
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 380px;
          height: 600px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideUp 0.3s ease;
        }

        .chat-window.minimized {
          height: 60px;
          overflow: hidden;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .chat-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .chat-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .header-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }

        .header-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #f7f9fc;
        }

        .message {
          margin-bottom: 16px;
          display: flex;
          gap: 10px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .message.user {
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          color: white;
        }

        .message.user .message-avatar {
          background: linear-gradient(135deg, #667eea, #764ba2);
        }

        .message.assistant .message-avatar {
          background: linear-gradient(135deg, #f093fb, #f5576c);
        }

        .message-content {
          max-width: 75%;
          padding: 12px 16px;
          border-radius: 12px;
          line-height: 1.5;
          font-size: 14px;
        }

        .message.user .message-content {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message.assistant .message-content {
          background: white;
          color: #333;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border-bottom-left-radius: 4px;
        }

        .chat-input-container {
          padding: 16px;
          background: white;
          border-top: 1px solid #e0e0e0;
          flex-shrink: 0;
        }

        .chat-input-form {
          display: flex;
          gap: 8px;
        }

        .chat-input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 24px;
          outline: none;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }

        .chat-input:focus {
          border-color: #667eea;
        }

        .send-button {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .send-button:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
        }

        .typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #999;
          animation: typing 1.4s infinite;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-10px); }
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #999;
          text-align: center;
          padding: 20px;
        }

        .empty-state svg {
          width: 64px;
          height: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        @media (max-width: 768px) {
          .chat-window {
            width: calc(100vw - 40px);
            height: calc(100vh - 100px);
            bottom: 80px;
          }
        }
      `}</style>

      <div className="floating-chatbot-container">
        {!isOpen ? (
          <button className="chat-button" onClick={toggleChat} aria-label="Open chat">
            <FiMessageCircle />
          </button>
        ) : (
          <div className={`chat-window ${isMinimized ? 'minimized' : ''}`}>
            <div className="chat-header">
              <h3>AI Assistant</h3>
              <div className="header-actions">
                {!isMinimized && (
                  <button 
                    className="header-btn" 
                    onClick={clearChat}
                    aria-label="Clear chat"
                    title="Clear chat"
                  >
                    <FiTrash2 size={16} />
                  </button>
                )}
                <button 
                  className="header-btn" 
                  onClick={() => setIsMinimized(!isMinimized)}
                  aria-label="Minimize"
                  title="Minimize"
                >
                  <FiMinus size={16} />
                </button>
                <button 
                  className="header-btn" 
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                  title="Close"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div className="chat-messages" ref={messagesContainerRef}>
                  {messages.length === 0 ? (
                    <div className="empty-state">
                      <FiMessageCircle />
                      <p>Start a conversation with our AI assistant!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div key={index} className={`message ${msg.role}`}>
                        <div className="message-avatar">
                          {msg.role === 'user' ? (loggedInUser?.username?.[0]?.toUpperCase() || 'U') : 'AI'}
                        </div>
                        <div className="message-content">
                          {msg.role === 'assistant' && msg.content === '' && loading ? (
                            <div className="typing-indicator">
                              <div className="typing-dot"></div>
                              <div className="typing-dot"></div>
                              <div className="typing-dot"></div>
                            </div>
                          ) : (
                            <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-container">
                  <form onSubmit={sendMessage} className="chat-input-form">
                    <input
                      ref={inputRef}
                      type="text"
                      className="chat-input"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type your message..."
                      disabled={loading}
                    />
                    <button 
                      type="submit" 
                      className="send-button"
                      disabled={loading || !inputMessage.trim()}
                      aria-label="Send message"
                    >
                      <FiSend size={18} />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default FloatingChatbot;
