import { useState, useEffect } from 'react';
import { getEvents, registerForEvent, getMyRegistrations } from '../api';
import { useAuth } from '../context/AuthContext';

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [evRes, regRes] = await Promise.all([
        getEvents(),
        getMyRegistrations(user.userId),
      ]);
      setEvents(evRes.data);
      const ids = new Set(regRes.data.filter(r => r.status === 'CONFIRMED').map(r => r.eventId));
      setRegisteredEventIds(ids);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleRegister = async (eventId) => {
    setRegistering(eventId);
    setMsg({ type: '', text: '' });
    try {
      const { data } = await registerForEvent(user.userId, eventId);
      setMsg({ type: 'success', text: data.message || 'Registered successfully!' });
      setRegisteredEventIds(prev => new Set([...prev, eventId]));
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || err.response?.data?.error || 'Registration failed.' });
    } finally { setRegistering(null); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return <p>Loading events...</p>;

  return (
    <>
      <h2 className="page-title">Browse Events</h2>
      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
      {events.length === 0 ? (
        <div className="empty-state">
          <h3>No events yet</h3>
          <p>Check back later for upcoming university events.</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {events.map(ev => (
            <div className="card" key={ev.id}>
              <div className="flex flex-between mb-4">
                <h3>{ev.title}</h3>
                <span className="badge badge-info">{ev.capacity} seats</span>
              </div>
              {ev.description && <p style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 12 }}>{ev.description}</p>}
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 4 }}>
                📅 {formatDate(ev.date)}
              </div>
              {ev.location && (
                <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 12 }}>
                  📍 {ev.location}
                </div>
              )}
              {registeredEventIds.has(ev.id) ? (
                <span className="badge badge-success">✓ Registered</span>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleRegister(ev.id)}
                  disabled={registering === ev.id}
                >
                  {registering === ev.id ? 'Registering...' : 'Register'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
