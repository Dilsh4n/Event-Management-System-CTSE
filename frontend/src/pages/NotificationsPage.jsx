import { useState, useEffect } from 'react';
import { getMyNotifications } from '../api';
import { useAuth } from '../context/AuthContext';

const ICON_MAP = {
  WELCOME: { icon: '👋', bg: '#dbeafe' },
  NEW_EVENT: { icon: '🎉', bg: '#fef9c3' },
  REGISTRATION_CONFIRMED: { icon: '✅', bg: '#dcfce7' },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyNotifications(user.userId)
      .then(({ data }) => setNotifications(data.reverse()))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.userId]);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return <p>Loading notifications...</p>;

  return (
    <>
      <h2 className="page-title">Notifications</h2>
      {notifications.length === 0 ? (
        <div className="empty-state">
          <h3>No notifications</h3>
          <p>You'll see notifications here when events happen.</p>
        </div>
      ) : (
        <div>
          {notifications.map(n => {
            const style = ICON_MAP[n.type] || { icon: '🔔', bg: '#e2e8f0' };
            return (
              <div className="card notification-item" key={n.id}>
                <div className="notification-icon" style={{ background: style.bg }}>{style.icon}</div>
                <div className="notification-body">
                  <div className="msg">{n.message}</div>
                  <div className="time">{formatDate(n.createdAt)} · {n.type.replace(/_/g, ' ')}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
