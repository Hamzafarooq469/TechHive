import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import  socket  from '@Services/Socket';
import axios from "axios";
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';

const Message = ({ targetUserId, targetUserName }) => {
  const { t } = useTranslation();
  const uid = useSelector((state) => state.user.currentUser?.user?.uid);
  const userName = useSelector((state) => state.user.currentUser?.user.name);
  
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const createRoomId = (userId1, userId2) => {
    return [userId1, userId2].sort().join('_');
  };

  const roomId = createRoomId(uid, targetUserId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!uid || !targetUserId) return;

    // Register current user and join the room
    socket.emit("register_uid", uid);
    socket.emit("join_room", { 
      currentUserId: uid, 
      targetUserId: targetUserId 
    });

    // Load previous messages
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`/message/${roomId}`);
        setMessages(res.data);
      } catch (error) {
        console.error(t('message.errors.fetchMessages'), error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [uid, targetUserId, roomId, t]);

  useEffect(() => {
    const handleMessage = (data) => {
      if (data.roomName === roomId) {
        setMessages((prev) => {
          const messageExists = prev.some(msg => 
            msg.uid === data.uid && 
            msg.message === data.message && 
            Math.abs(new Date(msg.timestamp) - new Date(data.timestamp)) < 2000
          );
          return messageExists ? prev : [...prev, data];
        });
      }
    };

    socket.on("receive_message", handleMessage);
    return () => socket.off("receive_message", handleMessage);
  }, [roomId]);

  const sendMessage = async () => {
    if (!message.trim() || !targetUserId) return;
    
    const messageData = { 
      message: message.trim(), 
      room: roomId,
      uid, 
      senderName: userName,
      targetUserId: targetUserId
    };
    
    try {
      socket.emit("send_message", messageData);
      await axios.post("/message/send", messageData);
      setMessage("");
    } catch (error) {
      console.error(t('message.errors.sendMessage'), error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!targetUserId) {
    return (
      <div className="empty-chat">
        <div className="empty-chat-icon">{t('message.emptyChat.icon')}</div>
        <p className="empty-chat-text">{t('message.emptyChat.text')}</p>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-user-info">
          <div className="user-avatar">
            {targetUserName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="user-name">{targetUserName}</h2>
            <p className="user-status">{t('message.chatHeader.online')}</p>
          </div>
        </div>
      </div>
      
      {/* Messages Container */}
      <div className="messages-container">
        {isLoading ? (
          <div className="loading-messages">
            <div className="spinner"></div>
            <p>{t('message.loading.messages')}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-messages">
            <div className="empty-icon">{t('message.emptyMessages.icon')}</div>
            <p>{t('message.emptyMessages.text')}</p>
            <p className="empty-subtext">{t('message.emptyMessages.subtext', { userName: targetUserName })}</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div 
              key={i} 
              className={`message-bubble ${msg.uid === uid ? 'sent' : 'received'}`}
            >
              <div className="message-header">
                <span className="sender-name">
                  {msg.senderName} {msg.uid === uid && t('message.messageBubble.you')}
                </span>
                <span className="message-time">
                  {format(new Date(msg.timestamp), t('message.messageBubble.timeFormat'))}
                </span>
              </div>
              <div className="message-content">{msg.message}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        <div className="input-wrapper">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('message.input.placeholder', { userName: targetUserName })}
            className="message-input"
          />
          <button 
            onClick={sendMessage}
            disabled={!message.trim()}
            className="send-button"
            aria-label={t('message.input.sendButton')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 80%;
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .chat-header {
          padding: 16px 20px;
          border-bottom: 1px solid #f0f0f0;
          background: #ffffff;
        }

        .chat-user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6e8efb, #a777e3);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 18px;
        }

        .user-name {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .user-status {
          margin: 0;
          font-size: 13px;
          color: #666;
        }

        .messages-container {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          background: #f8f9fa;
          display: flex;
          flex-direction: column;
        }

        .message-bubble {
          max-width: 70%;
          padding: 12px 16px;
          margin-bottom: 12px;
          border-radius: 18px;
          position: relative;
          animation: fadeIn 0.3s ease;
        }

        .message-bubble.sent {
          align-self: flex-end;
          background: #007bff;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message-bubble.received {
          align-self: flex-start;
          background: white;
          color: #333;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          border-bottom-left-radius: 4px;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .sender-name {
          font-weight: 600;
          font-size: 14px;
        }

        .message-bubble.sent .sender-name {
          color: rgba(255, 255, 255, 0.9);
        }

        .message-bubble.received .sender-name {
          color: #555;
        }

        .message-time {
          font-size: 11px;
          opacity: 0.8;
          margin-left: 10px;
        }

        .message-bubble.sent .message-time {
          color: rgba(255, 255, 255, 0.7);
        }

        .message-bubble.received .message-time {
          color: #777;
        }

        .message-content {
          font-size: 15px;
          line-height: 1.4;
        }

        .message-input-container {
          padding: 16px 20px;
          border-top: 1px solid #f0f0f0;
          background: white;
        }

        .input-wrapper {
          display: flex;
          gap: 8px;
        }

        .message-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e0e0e0;
          border-radius: 24px;
          font-size: 15px;
          outline: none;
          transition: all 0.2s;
        }

        .message-input:focus {
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
        }

        .send-button {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #007bff;
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .send-button:disabled {
          background: #e0e0e0;
          color: #aaa;
          cursor: not-allowed;
        }

        .send-button:not(:disabled):hover {
          background: #0069d9;
          transform: translateY(-1px);
        }

        .empty-chat {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #666;
        }

        .empty-chat-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-chat-text {
          font-size: 16px;
          color: #888;
        }

        .loading-messages {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #666;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(0, 123, 255, 0.2);
          border-radius: 50%;
          border-top-color: #007bff;
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 16px;
        }

        .empty-messages {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #666;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-subtext {
          font-size: 14px;
          color: #888;
          margin-top: 8px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Message;