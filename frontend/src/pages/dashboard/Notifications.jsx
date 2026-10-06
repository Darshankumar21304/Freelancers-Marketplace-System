import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, MessageSquare, Briefcase, FileText, X, Check, CheckCheck, Loader2, Sparkles } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import './Notifications.css';

const getIconDetails = (type) => {
  switch (type) {
    case 'ai_recommendation':
    case 'recommendation':
      return { Icon: Sparkles, color: '#6366f1', bg: '#eef2ff' };
    case 'message':
      return { Icon: MessageSquare, color: '#3b82f6', bg: '#eff6ff' };
    case 'proposal':
      return { Icon: FileText, color: '#8b5cf6', bg: '#f5f3ff' };
    case 'project':
      return { Icon: CheckCircle, color: '#10b981', bg: '#ecfdf5' };
    case 'system':
    default:
      return { Icon: Briefcase, color: '#f59e0b', bg: '#fffbeb' };
  }
};

const formatRelativeTime = (dateString) => {
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return 'Recent';
  }
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Unread'];

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch('/notifications').catch(() => []);
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n._id === id || n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking single notification read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await apiFetch(`/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n._id !== id && n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'Unread') return !n.read;
    return true;
  });

  return (
    <div className="gigsphere-notifications">
      <div className="notifications-container">
        
        {/* Header */}
        <div className="page-header">
          <div className="breadcrumb">Dashboard / Notifications</div>
          <div className="title-row">
            <h1 className="page-title">Notifications</h1>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount} New</span>
            )}
          </div>
          <p className="page-desc">Stay updated with your latest alerts, messages, and project activities.</p>
        </div>

        <div className="dashboard-content">
          <div className="card notifications-card">
            
            {/* Toolbar */}
            <div className="notifications-toolbar">
              <div className="filters">
                {filters.map(filter => (
                  <button 
                    key={filter}
                    className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <button 
                className="mark-read-btn" 
                onClick={markAllAsRead} 
                disabled={unreadCount === 0 || isLoading}
              >
                <CheckCheck size={18} /> Mark all as read
              </button>
            </div>

            {/* List */}
            <div className="notifications-list">
              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '40px 0', color: '#64748b' }}>
                  <Loader2 size={36} className="animate-spin" color="#1a73e8" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading alerts...</span>
                </div>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map(notification => {
                  const { Icon, color, bg } = getIconDetails(notification.type);
                  return (
                    <div key={notification._id || notification.id} className={`notification-item ${!notification.read ? 'unread' : ''}`}>
                      <div className="notification-icon" style={{ backgroundColor: bg, color: color }}>
                        <Icon size={20} />
                      </div>
                      
                      <div className="notification-content">
                        <div className="notification-header">
                          <h4 className="notification-title">{notification.title}</h4>
                          <span className="notification-time">{formatRelativeTime(notification.createdAt)}</span>
                        </div>
                        <p className="notification-desc">{notification.description}</p>
                      </div>

                      <div className="notification-actions">
                        {!notification.read && (
                          <button className="action-btn check-btn" onClick={() => markAsRead(notification._id || notification.id)} title="Mark as read">
                            <Check size={18} />
                          </button>
                        )}
                        <button className="action-btn delete-btn" onClick={() => deleteNotification(notification._id || notification.id)} title="Remove">
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <Bell className="empty-icon" size={48} />
                  <h3 className="empty-title">All caught up!</h3>
                  <p className="empty-desc">You don't have any {activeFilter.toLowerCase()} notifications right now.</p>
                </div>
              )}
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
