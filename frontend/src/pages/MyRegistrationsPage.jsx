import { useState, useEffect } from 'react';
import { getMyRegistrations, cancelRegistration, getEventById } from '../api';
import { useAuth } from '../context/AuthContext';

const fmt = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const fmtShort = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function MyRegistrationsPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [eventMap, setEventMap]           = useState({});
  const [loading, setLoading]             = useState(true);
  const [cancelling, setCancelling]       = useState(null);
  const [msg, setMsg]                     = useState({ type: '', text: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data } = await getMyRegistrations(user.userId);
      const confirmed = data.filter(r => r.status === 'CONFIRMED');
      setRegistrations(confirmed);

      const evMap = {};
      await Promise.all(
        confirmed.map(async (r) => {
          try {
            const ev = await getEventById(r.eventId);
            evMap[r.eventId] = ev.data;
          } catch { evMap[r.eventId] = null; }
        })
      );
      setEventMap(evMap);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleCancel = async (regId) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) return;
    setCancelling(regId);
    setMsg({ type: '', text: '' });
    try {
      await cancelRegistration(regId);
      setRegistrations(prev => prev.filter(r => r.id !== regId));
      setMsg({ type: 'success', text: 'Registration cancelled successfully.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to cancel registration.' });
    } finally { setCancelling(null); }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        Loading your registrations...
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">My Registrations</h2>
          <p className="page-subtitle">Events you're signed up for</p>
        </div>
        {registrations.length > 0 && (
          <span className="badge badge-success">{registrations.length} confirmed</span>
        )}
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type}`}>
          <span>{msg.type === 'success' ? '✅' : '⚠️'}</span>
          {msg.text}
        </div>
      )}

      {registrations.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🎟️</span>
          <h3>No registrations yet</h3>
          <p>Browse upcoming events and register for the ones that interest you.</p>
        </div>
      ) : (
        <div className="events-grid">
          {registrations.map((reg, i) => {
            const ev = eventMap[reg.eventId];
            return (
              <div
                className="event-card"
                key={reg.id}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div
                  className="event-card-accent"
                  style={{ background: 'var(--gradient-success)' }}
                />
                <div className="event-card-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <h3 className="event-card-title" style={{ margin: 0 }}>{ev?.title || 'Event'}</h3>
                    <span className="badge badge-success" style={{ flexShrink: 0 }}>✓ Confirmed</span>
                  </div>

                  {ev?.description && (
                    <p className="event-card-desc">{ev.description}</p>
                  )}

                  {ev && (
                    <div className="event-meta">
                      <div className="event-meta-row">
                        <span className="event-meta-icon" style={{ background: 'var(--success-light)' }}>📅</span>
                        {fmt(ev.date)}
                      </div>
                      {ev.location && (
                        <div className="event-meta-row">
                          <span className="event-meta-icon" style={{ background: 'var(--success-light)' }}>📍</span>
                          {ev.location}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 8 }}>
                    Registered on {fmtShort(reg.createdAt)}
                  </div>
                </div>

                <div className="event-card-footer">
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    ID: {reg.id.slice(0, 8)}…
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleCancel(reg.id)}
                    disabled={cancelling === reg.id}
                  >
                    {cancelling === reg.id ? (
                      <>
                        <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                        Cancelling...
                      </>
                    ) : 'Cancel'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
