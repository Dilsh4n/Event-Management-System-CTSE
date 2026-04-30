import { useState, useEffect } from 'react';
import { getEvents, createEvent } from '../../api';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

const EMPTY_FORM = { title: '', description: '', location: '', date: '', capacity: '' };

export default function AdminEventsPage() {
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]           = useState({ type: '', text: '' });

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
      const date = form.date.length === 16 ? form.date + ':00' : form.date;
      await createEvent({ ...form, date, capacity: parseInt(form.capacity, 10) });
      setMsg({ type: 'success', text: '🎉 Event created! All registered users have been notified via email.' });
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadEvents();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || err.response?.data?.error || 'Failed to create event.' });
    } finally { setSubmitting(false); }
  };

  const toggleForm = () => {
    setShowForm(v => !v);
    setMsg({ type: '', text: '' });
    if (showForm) setForm(EMPTY_FORM);
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
          <h2 className="page-title">Manage Events</h2>
          <p className="page-subtitle">{events.length} event{events.length !== 1 ? 's' : ''} on the platform</p>
        </div>
        <button
          className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`}
          onClick={toggleForm}
        >
          {showForm ? '✕ Cancel' : '+ Create Event'}
        </button>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type}`}>
          <span>{msg.type === 'success' ? '✅' : '⚠️'}</span>
          {msg.text}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="form-section">
          <h3 className="form-section-title">
            <span style={{
              width: 30, height: 30, background: 'var(--primary-light)',
              borderRadius: 'var(--radius-sm)', display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 16
            }}>📅</span>
            New Event Details
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label>Event Title *</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. AI Workshop 2025"
                  required
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Main Auditorium"
                />
              </div>
              <div className="form-group">
                <label>Date &amp; Time *</label>
                <input
                  name="date"
                  type="datetime-local"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Capacity *</label>
                <input
                  name="capacity"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={handleChange}
                  placeholder="e.g. 100"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the event, what attendees can expect..."
                rows={3}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    Creating...
                  </>
                ) : '🚀 Publish Event'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={toggleForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events table */}
      {events.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📅</span>
          <h3>No events yet</h3>
          <p>Create your first event using the button above.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Date &amp; Time</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id}>
                  <td>
                    <strong style={{ display: 'block', marginBottom: 2 }}>{ev.title}</strong>
                    {ev.description && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {ev.description.substring(0, 60)}{ev.description.length > 60 ? '…' : ''}
                      </span>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 13, color: 'var(--text-muted)' }}>
                    {formatDate(ev.date)}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{ev.location || '—'}</td>
                  <td>
                    <span className="badge badge-info">👥 {ev.capacity}</span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-light)' }}>
                    {new Date(ev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
