import { useState, useEffect } from 'react';
import { getEvents, createEvent } from '../../api';

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', location: '', date: '', capacity: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    try {
      const { data } = await getEvents();
      setEvents(data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type: '', text: '' });
    try {
      const payload = { ...form, capacity: parseInt(form.capacity, 10) };
      await createEvent(payload);
      setMsg({ type: 'success', text: 'Event created successfully! Notifications sent to all users.' });
      setForm({ title: '', description: '', location: '', date: '', capacity: '' });
      setShowForm(false);
      loadEvents();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || err.response?.data?.error || 'Failed to create event.' });
    } finally { setSubmitting(false); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return <p>Loading events...</p>;

  return (
    <>
      <div className="flex flex-between mb-4">
        <h2 className="page-title" style={{ marginBottom: 0 }}>Manage Events</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Create Event'}
        </button>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {showForm && (
        <div className="card mb-4">
          <h3 style={{ marginBottom: 16 }}>New Event</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Title *</label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="AI Workshop" required />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input name="location" value={form.location} onChange={handleChange} placeholder="Main Hall" />
              </div>
              <div className="form-group">
                <label>Date & Time *</label>
                <input name="date" type="datetime-local" value={form.date} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Capacity *</label>
                <input name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} placeholder="50" required />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Event description..." rows={3} />
            </div>
            <button className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Event'}
            </button>
          </form>
        </div>
      )}

      {events.length === 0 ? (
        <div className="empty-state"><h3>No events yet</h3><p>Create your first event above.</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr><th>Title</th><th>Date</th><th>Location</th><th>Capacity</th><th>Created</th></tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id}>
                  <td><strong>{ev.title}</strong>{ev.description && <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{ev.description.substring(0, 60)}{ev.description.length > 60 ? '...' : ''}</div>}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(ev.date)}</td>
                  <td>{ev.location || '—'}</td>
                  <td>{ev.capacity}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-light)' }}>{formatDate(ev.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
