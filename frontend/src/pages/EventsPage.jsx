import { useState, useEffect } from 'react';
import { getEvents, registerForEvent, getMyRegistrations } from '../api';
import { useAuth } from '../context/AuthContext';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents]                   = useState([]);
  const [registeredIds, setRegisteredIds]     = useState(new Set());
  const [loading, setLoading]                 = useState(true);
  const [registering, setRegistering]         = useState(null);
  const [msg, setMsg]                         = useState({ type: '', text: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [evRes, regRes] = await Promise.all([
        getEvents(),
        getMyRegistrations(user.userId),
      ]);
      setEvents(evRes.data);
      const ids = new Set(
        regRes.data.filter(r => r.status === 'CONFIRMED').map(r => r.eventId)
      );
      setRegisteredIds(ids);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleRegister = async (eventId) => {
    setRegistering(eventId);
    setMsg({ type: '', text: '' });
    try {
      const { data } = await registerForEvent(user.userId, eventId);
      setMsg({ type: 'success', text: data.message || 'Registered successfully! Check your email for confirmation.' });
      setRegisteredIds(prev => new Set([...prev, eventId]));
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || err.response?.data?.error || 'Registration failed.' });
    } finally { setRegistering(null); }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        Loading events...
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Browse Events</h2>
          <p className="page-subtitle">Discover and register for upcoming university events</p>
        </div>
        {events.length > 0 && (
          <span className="badge badge-info">{events.length} event{events.length !== 1 ? 's' : ''} available</span>
        )}
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type}`}>
          <span>{msg.type === 'success' ? '✅' : '⚠️'}</span>
          {msg.text}
        </div>
      )}

      {events.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📅</span>
          <h3>No events yet</h3>
          <p>Check back soon — new events are added regularly.</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((ev, i) => (
            <div
              className="event-card"
              key={ev.id}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="event-card-accent" />
              <div className="event-card-body">
                <h3 className="event-card-title">{ev.title}</h3>
                {ev.description && (
                  <p className="event-card-desc">{ev.description}</p>
                )}
                <div className="event-meta">
                  <div className="event-meta-row">
                    <span className="event-meta-icon">📅</span>
                    {formatDate(ev.date)}
                  </div>
                  {ev.location && (
                    <div className="event-meta-row">
                      <span className="event-meta-icon">📍</span>
                      {ev.location}
                    </div>
                  )}
                </div>
              </div>

              <div className="event-card-footer">
                <div className="capacity-badge">
                  <span>👥</span>
                  {ev.capacity} seats
                </div>
                {registeredIds.has(ev.id) ? (
                  <span className="badge badge-success">✓ Registered</span>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleRegister(ev.id)}
                    disabled={registering === ev.id}
                  >
                    {registering === ev.id ? (
                      <>
                        <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                        Registering...
                      </>
                    ) : 'Register →'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
