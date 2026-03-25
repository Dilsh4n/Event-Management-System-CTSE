import { useState, useEffect } from 'react';
import { getMyRegistrations, cancelRegistration, getEventById } from '../api';
import { useAuth } from '../context/AuthContext';

export default function MyRegistrationsPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [eventMap, setEventMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data } = await getMyRegistrations(user.userId);
      const confirmed = data.filter(r => r.status === 'CONFIRMED');
      setRegistrations(confirmed);

      // Fetch event details for each registration
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
    if (!window.confirm('Cancel this registration?')) return;
    setCancelling(regId);
    setMsg({ type: '', text: '' });
    try {
      await cancelRegistration(regId);
      setRegistrations(prev => prev.filter(r => r.id !== regId));
      setMsg({ type: 'success', text: 'Registration cancelled.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to cancel.' });
    } finally { setCancelling(null); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return <p>Loading registrations...</p>;

  return (
    <>
      <h2 className="page-title">My Registrations</h2>
      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
      {registrations.length === 0 ? (
        <div className="empty-state">
          <h3>No registrations yet</h3>
          <p>Browse events and register for the ones you're interested in.</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {registrations.map(reg => {
            const ev = eventMap[reg.eventId];
            return (
              <div className="card" key={reg.id}>
                <div className="flex flex-between mb-4">
                  <h3>{ev?.title || 'Event'}</h3>
                  <span className="badge badge-success">Confirmed</span>
                </div>
                {ev && (
                  <>
                    {ev.description && <p style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 8 }}>{ev.description}</p>}
                    <div style={{ fontSize: 13, color: 'var(--text-light)' }}>📅 {formatDate(ev.date)}</div>
                    {ev.location && <div style={{ fontSize: 13, color: 'var(--text-light)' }}>📍 {ev.location}</div>}
                  </>
                )}
                <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 8 }}>
                  Registered: {formatDate(reg.createdAt)}
                </div>
                <button
                  className="btn btn-danger btn-sm mt-2"
                  onClick={() => handleCancel(reg.id)}
                  disabled={cancelling === reg.id}
                >
                  {cancelling === reg.id ? 'Cancelling...' : 'Cancel Registration'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
