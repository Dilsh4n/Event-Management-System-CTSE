import { useState, useEffect } from 'react';
import { getEvents, getAllUsers } from '../../api';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats]             = useState({ events: 0, users: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([getEvents(), getAllUsers()])
      .then(([evRes, usRes]) => {
        setStats({ events: evRes.data.length, users: usRes.data.length });
        setRecentEvents(evRes.data.slice(-5).reverse());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        Loading dashboard...
      </div>
    );
  }

  return (
    <>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h2 className="page-title">
          Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="page-subtitle">Here&apos;s what&apos;s happening on the platform today.</p>
      </div>

      {/* Stat cards */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">📅</div>
          <div className="stat-value">{stats.events}</div>
          <div className="stat-label">Total Events</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-success">👥</div>
          <div className="stat-value">{stats.users}</div>
          <div className="stat-label">Registered Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-warning">🔔</div>
          <div className="stat-value">{recentEvents.length}</div>
          <div className="stat-label">Recent Events</div>
        </div>
      </div>

      {/* Quick actions */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          boxShadow: 'var(--shadow-primary)',
        }}
      >
        <div>
          <h3 style={{ color: 'white', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
            Ready to create a new event?
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
            Notify all registered users instantly when you publish an event.
          </p>
        </div>
        <Link
          to="/admin/events"
          className="btn"
          style={{ background: 'white', color: '#4f46e5', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          + Create Event
        </Link>
      </div>

      {/* Recent events table */}
      <div className="section-header">
        <span className="section-title">Recent Events</span>
        <Link to="/admin/events" className="btn btn-outline btn-sm">View All →</Link>
      </div>

      {recentEvents.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📅</span>
          <h3>No events yet</h3>
          <p>Create your first event to get started.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Location</th>
                <th>Capacity</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map(ev => (
                <tr key={ev.id}>
                  <td>
                    <strong>{ev.title}</strong>
                    {ev.description && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {ev.description.substring(0, 55)}{ev.description.length > 55 ? '…' : ''}
                      </div>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: 13 }}>
                    {formatDate(ev.date)}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{ev.location || '—'}</td>
                  <td>
                    <span className="badge badge-info">{ev.capacity} seats</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
