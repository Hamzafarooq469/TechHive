import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const AdminMailBot = ({ onEmailGenerated }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your email writing assistant. Tell me what kind of email you'd like to create. For example:\n\n- 'Write a promotional email about our new tech products'\n- 'Create a newsletter for this month'\n- 'Write a welcome email for new customers'\n- 'Make an announcement about our sale'"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState(null);
  const [previewMode, setPreviewMode] = useState('rendered'); // 'rendered' or 'html'
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      let response;

      // Check if we're refining an existing email
      if (currentEmail && userMessage.toLowerCase().includes('change')) {
        response = await axios.post('http://localhost:5000/api/mail/refine-email', {
          feedback: userMessage,
          current_subject: currentEmail.subject,
          current_body: currentEmail.html,
          conversation_history: messages
        });
      } else {
        // Generate new email
        response = await axios.post('http://localhost:5000/api/mail/generate-email', {
          prompt: userMessage,
          conversation_history: messages
        });
      }

      const { subject, html, email_type, tone } = response.data;

      setCurrentEmail({ subject, html, email_type, tone });
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `✅ I've generated your email!\n\n**Type:** ${email_type || 'general'}\n**Tone:** ${tone || 'professional'}\n\nCheck the preview below. You can:\n- Click "Use This Email" to apply it\n- Ask me to make changes (e.g., "make it shorter" or "add a discount code")`
        }
      ]);

      // Notify parent component
      if (onEmailGenerated) {
        onEmailGenerated({ subject, html });
      }

    } catch (error) {
      console.error('Email generation error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '❌ Sorry, I encountered an error generating the email. Please try again or rephrase your request.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUseEmail = () => {
    if (currentEmail && onEmailGenerated) {
      onEmailGenerated({ subject: currentEmail.subject, html: currentEmail.html });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🤖 Email Writing Assistant</h2>
        <p style={styles.subtitle}>AI-powered email generation using LangGraph</p>
      </div>

      <div style={styles.chatContainer}>
        <div style={styles.messagesArea}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                ...styles.message,
                ...(msg.role === 'user' ? styles.userMessage : styles.botMessage)
              }}
            >
              <div style={styles.messageHeader}>
                <span style={styles.messageRole}>
                  {msg.role === 'user' ? '👤 You' : '🤖 Assistant'}
                </span>
              </div>
              <div style={styles.messageContent}>
                {msg.content.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line.startsWith('**') && line.endsWith('**') ? (
                      <strong>{line.slice(2, -2)}</strong>
                    ) : line.startsWith('- ') ? (
                      <li style={{ marginLeft: '20px' }}>{line.slice(2)}</li>
                    ) : (
                      line
                    )}
                    <br />
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ ...styles.message, ...styles.botMessage }}>
              <div style={styles.messageHeader}>
                <span style={styles.messageRole}>🤖 Assistant</span>
              </div>
              <div style={styles.loadingDots}>
                <span>●</span>
                <span>●</span>
                <span>●</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {currentEmail && (
          <div style={styles.emailPreview}>
            <div style={styles.previewHeader}>
              <h3 style={styles.previewTitle}>📧 Email Preview</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setCurrentEmail(null)} 
                  style={{
                    ...styles.useButton,
                    backgroundColor: '#e2e8f0',
                    color: '#2d3748'
                  }}
                >
                  ✕ Close Preview
                </button>
                <button onClick={handleUseEmail} style={styles.useButton}>
                  ✓ Use This Email
                </button>
              </div>
            </div>
            <div style={styles.previewSubject}>
              <strong>Subject:</strong> {currentEmail.subject}
            </div>
            <div style={styles.previewTabs}>
              <button
                type="button"
                onClick={() => setPreviewMode('rendered')}
                style={{
                  ...styles.tabButton,
                  ...(previewMode === 'rendered' ? styles.activeTab : {})
                }}
              >
                👁️ Visual Preview
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('html')}
                style={{
                  ...styles.tabButton,
                  ...(previewMode === 'html' ? styles.activeTab : {})
                }}
              >
                📝 HTML Code
              </button>
            </div>
            {previewMode === 'rendered' ? (
              <div
                style={styles.previewBody}
                dangerouslySetInnerHTML={{ __html: currentEmail.html }}
              />
            ) : (
              <pre style={styles.previewCode}>
                {currentEmail.html}
              </pre>
            )}
          </div>
        )}

        <div style={styles.inputArea}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe the email you want to create..."
            style={styles.input}
            rows={3}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            style={{
              ...styles.sendButton,
              ...(loading || !input.trim() ? styles.sendButtonDisabled : {})
            }}
          >
            {loading ? '⏳ Generating...' : '🚀 Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '20px',
    textAlign: 'center'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700'
  },
  subtitle: {
    margin: '5px 0 0 0',
    fontSize: '14px',
    opacity: 0.9
  },
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden'
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  message: {
    padding: '15px',
    borderRadius: '12px',
    maxWidth: '80%',
    wordWrap: 'break-word'
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#667eea',
    color: 'white',
    marginLeft: 'auto'
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    color: '#2d3748',
    border: '1px solid #e2e8f0'
  },
  messageHeader: {
    marginBottom: '8px'
  },
  messageRole: {
    fontSize: '12px',
    fontWeight: '600',
    opacity: 0.8
  },
  messageContent: {
    fontSize: '14px',
    lineHeight: '1.6'
  },
  loadingDots: {
    display: 'flex',
    gap: '5px',
    fontSize: '20px',
    animation: 'pulse 1.5s ease-in-out infinite'
  },
  emailPreview: {
    backgroundColor: 'white',
    borderTop: '2px solid #e2e8f0',
    padding: '204x',
    maxHeight: '300px',
    overflowY: 'auto'
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  previewTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#2d3748'
  },
  useButton: {
    padding: '8px 16px',
    backgroundColor: '#48bb78',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  previewSubject: {
    padding: '10px',
    backgroundColor: '#f7fafc',
    borderRadius: '6px',
    marginBottom: '10px',
    fontSize: '14px'
  },
  previewBody: {
    padding: '20px',
    fontSize: '14px',
    lineHeight: '1.6',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    minHeight: '200px'
  },
  previewTabs: {
    display: 'flex',
    gap: '5px',
    marginBottom: '15px',
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: '0'
  },
  tabButton: {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: '#f7fafc',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#718096',
    borderBottom: '3px solid transparent',
    borderRadius: '8px 8px 0 0',
    transition: 'all 0.2s ease',
    outline: 'none'
  },
  activeTab: {
    color: '#667eea',
    backgroundColor: 'white',
    borderBottom: '3px solid #667eea',
    fontWeight: '700'
  },
  previewCode: {
    padding: '15px',
    fontSize: '12px',
    lineHeight: '1.6',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    backgroundColor: '#f7fafc',
    overflow: 'auto',
    maxHeight: '300px',
    fontFamily: 'Monaco, Consolas, monospace',
    color: '#2d3748',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all'
  },
  inputArea: {
    padding: '20px',
    backgroundColor: 'white',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-end'
  },
  input: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    resize: 'none',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.3s ease'
  },
  sendButton: {
    padding: '12px 24px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap'
  },
  sendButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
};

export default AdminMailBot;
