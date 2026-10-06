import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { 
  Search, MoreVertical, Paperclip, Send, 
  File as FileIcon, ChevronLeft, Info, X, 
  Smile, Check, CheckCheck, MessageSquare, Plus, Briefcase
} from 'lucide-react';
import { formatINR } from '../../utils/currency';
import { Link, useLocation } from 'react-router-dom';
import { uploadFileToCloudinary } from '../../utils/fileUpload';
import { getUserProfile, getToken } from '../../utils/authUtils';
import { getCleanAvatar } from '../../utils/avatarUtils';
import MediaPreviewModal from '../../components/MediaPreviewModal';
import './Chat.css';

const socket = io('http://localhost:5001');

const extractId = (val) => {
  if (!val) return null;
  if (typeof val === 'string') return (val === 'undefined' || val === 'null' || !val.trim()) ? null : val.trim();
  if (typeof val === 'object') {
    const id = val._id || val.id || val.user_id || val.userId || val.freelancer_id || val.clientId;
    return extractId(id);
  }
  return String(val);
};

export default function Chat() {
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);

  // Media Preview State
  const [previewFile, setPreviewFile] = useState(null);
  const [isMediaPreviewOpen, setIsMediaPreviewOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [mobileView, setMobileView] = useState('list');

  const currentUser = getUserProfile() || JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = extractId(currentUser._id || currentUser.id || currentUser.user_id) || 'client';
  const getAuthToken = () => getToken() || localStorage.getItem('token') || localStorage.getItem('gigsphere_user_token');

  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (currentUserId) {
      socket.emit('user_connected', currentUserId);
      socket.emit('check_online_users');
    }

    const handleOnlineUsers = (users) => {
      if (Array.isArray(users)) {
        setOnlineUsers(users.map(u => String(u)));
      }
    };

    socket.on('get_online_users', handleOnlineUsers);

    return () => {
      socket.off('get_online_users', handleOnlineUsers);
    };
  }, [currentUserId]);

  const isUserOnline = (partnerId) => {
    const cleanId = extractId(partnerId);
    if (!cleanId) return false;
    return onlineUsers.some(u => extractId(u) === cleanId);
  };

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = getAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // 1. Fetch past conversation threads from backend
        const response = await axios.get('http://localhost:5001/api/messages/conversations', { headers }).catch(() => ({ data: [] }));
        let convs = Array.isArray(response.data) ? response.data : [];

        // Helper to check if a contact already exists in convs by ID or Name
        const isAlreadyPresent = (id, name) => {
          const cleanTargetId = extractId(id);
          const cleanTargetName = (name || '').toLowerCase().trim();
          return convs.some(c => {
            const existingId = extractId(c.partnerId || c._id);
            const existingName = (c.partnerName || c.name || '').toLowerCase().trim();
            if (cleanTargetId && existingId && cleanTargetId === existingId) return true;
            if (cleanTargetName && existingName && (cleanTargetName === existingName || existingName.startsWith(cleanTargetName) || cleanTargetName.startsWith(existingName))) {
              return true;
            }
            return false;
          });
        };

        // 2. Populate proposals received to ensure candidate contacts are available if no prior messages exist
        const proposalsRes = await axios.get('http://localhost:5001/api/proposals/received', { headers }).catch(() => ({ data: [] }));
        const proposals = Array.isArray(proposalsRes.data) ? proposalsRes.data : [];

        proposals.forEach(prop => {
          const flId = extractId(prop.freelancer?.id || prop.freelancer?._id || prop.freelancer_id);
          const flName = prop.freelancerName || prop.freelancer?.name || 'Freelancer';
          if (flId && !isAlreadyPresent(flId, flName)) {
            const flAvatar = getCleanAvatar(prop.freelancer?.avatar || prop.freelancer?.profilePhoto, flName);
            convs.push({
              partnerId: flId,
              partnerName: flName,
              partnerAvatar: flAvatar,
              avatar: flAvatar,
              partnerRole: 'Freelancer',
              projectTitle: prop.projectTitle || prop.project_title || 'Submitted Proposal',
              lastMessage: 'Tap to start conversation',
              lastMessageTime: 'Candidate',
              unreadCount: 0
            });
          }
        });

        // 3. Handle incoming target user state (from Send Message button / URL params)
        const targetState = location.state;
        const queryPartnerId = new URLSearchParams(location.search).get('partnerId');
        const targetId = extractId(
          queryPartnerId ||
          targetState?.partnerId || 
          targetState?.freelancerId || 
          targetState?.clientId || 
          targetState?.user_id || 
          targetState?.id
        );

        if (targetId) {
          const existing = convs.find(c => {
            const existingId = extractId(c.partnerId || c._id);
            const rawName = targetState?.name || targetState?.partnerName || targetState?.freelancerName || targetState?.clientName;
            const existingName = (c.partnerName || c.name || '').toLowerCase().trim();
            return (existingId && existingId === targetId) || (rawName && existingName === rawName.toLowerCase().trim());
          });

          if (existing) {
            setActiveConversation(existing);
          } else {
            const rawName = targetState?.name || targetState?.partnerName || targetState?.freelancerName || targetState?.clientName || 'Freelancer Partner';
            const cleanAvatar = getCleanAvatar(targetState?.avatar || targetState?.partnerAvatar || targetState?.profilePhoto, rawName);
            const newConv = {
              partnerId: targetId,
              partnerName: rawName,
              partnerAvatar: cleanAvatar,
              avatar: cleanAvatar,
              partnerRole: targetState?.role || 'Freelancer',
              projectTitle: targetState?.title || targetState?.projectTitle || 'Direct Message',
              lastMessage: 'Tap to start conversation',
              lastMessageTime: 'Just now',
              unreadCount: 0
            };
            convs = [newConv, ...convs];
            setActiveConversation(newConv);
          }
          setMobileView('chat');
        } else if (convs.length > 0) {
          setActiveConversation(convs[0]);
        }

        // 4. Final distinct deduplication pass
        const seenIds = new Set();
        const seenNames = new Set();
        const uniqueConvs = [];

        for (const c of convs) {
          const idKey = extractId(c.partnerId || c._id);
          const nameKey = (c.partnerName || c.name || '').toLowerCase().trim();

          const isIdDuplicate = idKey && seenIds.has(idKey);
          const isNameDuplicate = nameKey && seenNames.has(nameKey);

          if (!isIdDuplicate && !isNameDuplicate) {
            if (idKey) seenIds.add(idKey);
            if (nameKey) seenNames.add(nameKey);
            uniqueConvs.push(c);
          }
        }

        setConversations(uniqueConvs);
        if (uniqueConvs.length > 0 && !activeConversation) {
          setActiveConversation(uniqueConvs[0]);
        }
      } catch (error) {
        setConversations([]);
      }
    };
    fetchConversations();
  }, [location.state, location.search]);

  useEffect(() => {
    if (!activeConversation) return;

    const partnerId = extractId(activeConversation.partnerId || activeConversation._id);
    if (!partnerId) return;

    const roomId = [currentUserId, partnerId].sort().join('_');
    socket.emit('join_room', roomId);

    const fetchHistory = async () => {
      try {
        const token = getAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // 1. Fetch history with authorization headers
        const response = await axios.get(
          `http://localhost:5001/api/messages/history/${currentUserId}/${partnerId}`,
          { headers }
        );
        setMessages(response.data || []);

        // 2. Mark messages as read in the database
        await axios.put(`http://localhost:5001/api/messages/read-all/${partnerId}`, {}, { headers }).catch(() => null);
        
        // 3. Clear unreadCount locally
        setConversations(prev => prev.map(c => extractId(c.partnerId) === partnerId ? { ...c, unreadCount: 0 } : c));
      } catch (error) {
        setMessages([]);
      }
    };
    fetchHistory();

    socket.on('receive_message', (message) => {
      if (!message) return;
      setMessages((prev) => {
        const isDuplicate = prev.some(m => 
          (m.id && message.id && String(m.id) === String(message.id)) ||
          (m._id && message._id && String(m._id) === String(message._id)) ||
          (m.id && message._id && String(m.id) === String(message._id)) ||
          (m._id && message.id && String(m._id) === String(message.id)) ||
          (extractId(m.sender_id) === extractId(message.sender_id) &&
           m.message_text === message.message_text &&
           Math.abs(new Date(m.timestamp || m.createdAt || Date.now()).getTime() - new Date(message.timestamp || message.createdAt || Date.now()).getTime()) < 5000)
        );
        if (isDuplicate) return prev;
        return [...prev, message];
      });
    });

    socket.on('user_typing', (data) => {
      if (data.sender_id !== currentUserId) {
        setIsTyping(true);
        clearTimeout(window.typingTimeout);
        window.typingTimeout = setTimeout(() => setIsTyping(false), 2000);
      }
    });

    return () => {
      socket.off('receive_message');
      socket.off('user_typing');
    };
  }, [activeConversation, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (activeConversation) {
      const partnerId = extractId(activeConversation.partnerId || activeConversation._id);
      const roomId = [currentUserId, partnerId].sort().join('_');
      socket.emit('typing', { room: roomId, sender_id: currentUserId });
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const res = await uploadFileToCloudinary(selectedFile, '/api/upload/single');
      const fileUrl = res.url || res.secure_url || res.fileUrl;
      setFile({
        name: selectedFile.name,
        url: fileUrl,
        type: selectedFile.type
      });
    } catch (err) {
      console.error('Chat file upload error:', err);
      alert(`Failed to upload file: ${err.message || 'Error uploading file'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !file) || !activeConversation) return;

    const partnerId = extractId(activeConversation.partnerId || activeConversation._id);
    if (!partnerId) return;

    const roomId = [currentUserId, partnerId].sort().join('_');
    const tempId = 'temp_' + Date.now();
    const textToSend = newMessage;
    const fileToSend = file;

    const optimisticMsg = {
      _id: tempId,
      id: tempId,
      room: roomId,
      sender_id: currentUserId,
      receiver_id: partnerId,
      message_text: textToSend,
      file_url: fileToSend ? fileToSend.url : null,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');
    setFile(null);

    setConversations(prev => {
      const exists = prev.some(c => extractId(c.partnerId) === partnerId || extractId(c._id) === partnerId);
      if (exists) {
        return prev.map(c => 
          (extractId(c.partnerId) === partnerId || extractId(c._id) === partnerId)
            ? { ...c, lastMessage: textToSend || (fileToSend ? 'Attachment sent' : ''), lastMessageTime: 'Just now' }
            : c
        );
      } else {
        return [{ ...activeConversation, lastMessage: textToSend || (fileToSend ? 'Attachment sent' : ''), lastMessageTime: 'Just now' }, ...prev];
      }
    });

    const token = getAuthToken();
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post('http://localhost:5001/api/messages/send', {
        receiver_id: partnerId,
        message_text: textToSend,
        file_url: fileToSend ? fileToSend.url : null,
        room: roomId
      }, { headers });

      const savedMessage = res.data?.message;
      if (savedMessage) {
        setMessages(prev => prev.map(m => (m._id === tempId || m.id === tempId) ? savedMessage : m));
      }
    } catch (err) {
      console.error('REST msg send error:', err);
      // Socket fallback
      socket.emit('send_message', optimisticMsg);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const pName = c.partnerName || c.name || '';
    return pName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="gigsphere-client-messages">
      <div className="messages-container">
        
        {/* PANEL LEFT: Conversations */}
        <div className={`panel-left ${mobileView === 'list' ? 'mobile-visible' : 'mobile-hidden'}`}>
          <div className="list-header">
            <h2 className="list-title">Messages</h2>
            <div className="search-box">
              <Search className="search-icon" size={16} />
              <input 
                type="text" 
                className="search-input"
                placeholder="Search conversations..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="tabs">
              <button className={`tab-btn ${activeTab === 'All' ? 'active' : ''}`} onClick={() => setActiveTab('All')}>All</button>
            </div>
          </div>
          
          <div className="conversation-list">
            {filteredConversations.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>0 Active Conversations</span>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <div 
                  key={conv.partnerId} 
                  className={`conversation-item ${activeConversation?.partnerId === conv.partnerId ? 'active' : ''}`} 
                  onClick={() => { setActiveConversation(conv); setMobileView('chat'); }}
                >
                  <div className="avatar-wrapper">
                    <img src={getCleanAvatar(conv.partnerAvatar || conv.avatar, conv.partnerName)} alt={conv.partnerName} className="avatar" />
                    <div className={`status-dot ${isUserOnline(conv.partnerId) ? 'online' : 'offline'}`}></div>
                  </div>
                  <div className="conv-info">
                    <div className="conv-header">
                      <h3 className="client-name">{conv.partnerName}</h3>
                      <span className="conv-time">{conv.lastMessageTime || 'Now'}</span>
                    </div>
                    <p className="conv-project" style={{ textTransform: 'capitalize', fontSize: '0.75rem', color: '#1a73e8', fontWeight: '800', margin: '2px 0 4px' }}>
                      {conv.partnerRole}
                    </p>
                    <div className="conv-preview-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p className="conv-preview" style={{ flex: 1, marginRight: '8px' }}>{conv.lastMessage || 'Click to open conversation'}</p>
                      {conv.unreadCount > 0 && (
                        <span style={{ 
                          background: '#ef4444', 
                          color: '#fff', 
                          borderRadius: '50%', 
                          fontSize: '10px', 
                          fontWeight: '800', 
                          minWidth: '18px', 
                          height: '18px', 
                          padding: '0 4px',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}>
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PANEL CENTER: Active Chat */}
        <div className={`panel-center ${mobileView === 'chat' ? 'mobile-visible' : 'mobile-hidden'}`}>
          {!activeConversation ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', textAlign: 'center', background: '#f8fafc' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <MessageSquare size={32} color="#1a73e8" />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>No Conversations Yet</h3>
              <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '0.9rem', maxWidth: '380px', lineHeight: 1.5 }}>
                Direct messages with freelancers will appear here when you post project requirements or receive proposals.
              </p>
              <Link to="/client/dashboard/create-project" style={{ padding: '12px 26px', background: '#1a73e8', color: '#ffffff', borderRadius: '30px', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(26,115,232,0.25)' }}>
                + Post a Project Requirement
              </Link>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <div className="chat-header-info">
                  <button className="back-btn" onClick={() => setMobileView('list')}>
                    <ChevronLeft size={24} />
                  </button>
                  <div className="avatar-wrapper">
                    <img src={getCleanAvatar(activeConversation.avatar || activeConversation.partnerAvatar, activeConversation.partnerName)} alt={activeConversation.partnerName} className="avatar" style={{width: '40px', height: '40px'}} />
                    <div className={`status-dot ${isUserOnline(activeConversation.partnerId) ? 'online' : 'offline'}`}></div>
                  </div>
                  <div className="chat-title-group">
                    <h2>{activeConversation.partnerName}</h2>
                    <p className="chat-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isUserOnline(activeConversation.partnerId) ? '#10b981' : '#9ca3af' }}></span>
                      {isUserOnline(activeConversation.partnerId) ? 'Online Now' : 'Offline'} • {activeConversation.projectTitle || 'GigSphere Requirement'}
                    </p>
                  </div>
                </div>
                <div className="chat-actions">
                  <button className="icon-btn" title="Search Messages"><Search size={20} /></button>
                  <button className="icon-btn drawer-toggle-btn" onClick={() => setShowDrawer(true)} title="Details"><Info size={20} /></button>
                </div>
              </div>

              <div className="chat-area">
                <div className="date-separator"><span>Today</span></div>
                
                {messages.map((msg, idx) => {
                  const isMe = msg.sender_id === (currentUser._id || currentUser.id || 'client');
                  const timeString = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div key={idx} className={`message-row ${isMe ? 'outgoing' : 'incoming'}`}>
                      <div className="message-bubble">
                        {msg.file_url && (
                          <div className="attachment-preview" onClick={() => { setPreviewFile({ url: msg.file_url, name: 'Chat Attachment' }); setIsMediaPreviewOpen(true); }} style={{ cursor: 'pointer' }}>
                            {msg.file_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null ? (
                              <img src={msg.file_url} alt="attachment" className="attachment-image" style={{ borderRadius: '8px', maxHeight: '200px', cursor: 'pointer' }} />
                            ) : (
                              <div className="attachment-file" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FileIcon size={16} /> <span>Preview In-App</span>
                              </div>
                            )}
                          </div>
                        )}
                        {msg.message_text && <p className="message-text">{msg.message_text}</p>}
                        <div className="message-meta">
                          {timeString}
                          {isMe && <CheckCheck size={14} color="#a7f3d0" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {isTyping && (
                  <div className="message-row incoming">
                    <div className="message-bubble">
                      <div className="typing-indicator">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="composer">
                {file && (
                  <div className="file-preview">
                    <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <FileIcon size={14} /> {file.name}
                    </span>
                    <button type="button" className="remove-file" onClick={() => setFile(null)}>Remove</button>
                  </div>
                )}
                <form className="composer-inner" onSubmit={sendMessage}>
                  <label className="icon-btn attachment-btn" style={{ cursor: 'pointer' }}>
                    <Paperclip size={20} />
                    <input type="file" onChange={handleFileChange} style={{ display: 'none' }} disabled={isUploading} />
                  </label>
                  <input 
                    type="text" 
                    placeholder={isUploading ? "Uploading attachment..." : "Write a message..."} 
                    value={newMessage}
                    onChange={handleTyping}
                    className="composer-input chat-input"
                    disabled={isUploading}
                  />
                  
                  <div className="composer-actions">
                    <button 
                      type="submit" 
                      className="send-btn" 
                      disabled={(!newMessage.trim() && !file) || isUploading}
                    >
                      <Send size={16} style={{marginLeft: '2px'}} />
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>

        {/* PANEL RIGHT: Freelancer / Project Details */}
        {activeConversation && (
          <div className={`panel-right ${showDrawer ? 'drawer-open' : ''}`}>
            <div className="details-header">
              <h3 className="details-title">Details</h3>
              <button className="icon-btn close-drawer-btn" onClick={() => setShowDrawer(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="details-body">
              <div className="details-section">
                <h4 className="section-title">Freelancer Information</h4>
                <div className="info-card" style={{alignItems: 'center', textAlign: 'center'}}>
                  <img src={getCleanAvatar(activeConversation.avatar || activeConversation.partnerAvatar, activeConversation.partnerName)} alt={activeConversation.partnerName} style={{width: '64px', height: '64px', borderRadius: '50%'}} />
                  <div className="info-row">
                    <span className="info-value" style={{fontSize: '16px'}}>{activeConversation.partnerName}</span>
                    <span className="info-label">GigSphere Verified Freelancer</span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h4 className="section-title">Project Information</h4>
                <div className="info-card">
                  <div className="info-row">
                    <span className="info-label">Project</span>
                    <span className="info-value">{activeConversation.projectTitle || 'Requirement'}</span>
                  </div>
                  {activeConversation.budget && (
                    <div className="info-row">
                      <span className="info-label">Budget</span>
                      <span className="info-value amount">{formatINR(activeConversation.budget)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      <MediaPreviewModal 
        isOpen={isMediaPreviewOpen} 
        onClose={() => setIsMediaPreviewOpen(false)} 
        file={previewFile} 
      />
    </div>
  );
}
