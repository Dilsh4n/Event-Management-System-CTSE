import { useState, useEffect } from 'react';
import { getMyNotifications } from '../api';
import { useAuth } from '../context/AuthContext';

const TYPE_CONFIG = {
  WELCOME: {
    icon: '👋',
    bg: '#dbeafe',
    label: 'Welcome',
    tagClass: '',
    tagStyle: { background: '#ede9fe', color: '#5b21b6' },
  },
  NEW_EVENT: {
    icon: '🎉',
    bg: '#fef3c7',
    label: 'New Event',
    tagStyle: { background: '#fef3c7', color: '#92400e' },
  },
  REGISTRATION_CONFIRMED: {
    icon: '✅',
    bg: '#d1fae5',
    label: 'Confirmed',
    tagStyle: { background: '#d1fae5', color: '#065f46' },
  },
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    getMyNotifications(user.userId)
      .then(({ data }) => setNotifications(data.reverse()))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.userId]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        Loading notifications...
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Notifications</h2>
          <p className="page-subtitle">Stay updated on events and your registrations</p>
        </div>
        {notifications.length > 0 && (
          <span className="badge badge-info">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🔔</span>
          <h3>No notifications yet</h3>
          <p>You'll see notifications here when events are scheduled or when you register.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((n, i) => {
            const config = TYPE_CONFIG[n.type] || { icon: '🔔', bg: '#e2e8f0', label: n.type, tagStyle: {} };
            return (
              <div
                className="notification-card"
                key={n.id}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="notif-icon" style={{ background: config.bg }}>
                  {config.icon}
                </div>
                <div className="notif-content">
                  <p className="notif-message">{n.message}</p>
                  <div className="notif-meta">
                    <span>{formatDate(n.createdAt)}</span>
                    <span
                      className="notif-tag"
                      style={config.tagStyle}
                    >
                      {config.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
