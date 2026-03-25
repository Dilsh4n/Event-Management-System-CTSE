import { useState, useEffect } from 'react';
import { getEvents, getAllUsers } from '../../api';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ events: 0, users: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getEvents(), getAllUsers()])
      .then(([evRes, usRes]) => {
        setStats({ events: evRes.data.length, users: usRes.data.length });
        setRecentEvents(evRes.data.slice(-5).reverse());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <>
      <h2 className="page-title">Admin Dashboard</h2>
      <div className="stat-cards">
        <div className="card stat-card">
          <div className="stat-value">{stats.events}</div>
          <div className="stat-label">Total Events</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{stats.users}</div>
          <div className="stat-label">Registered Users</div>
        </div>
      </div>

      <div className="flex flex-between mb-4">
        <h3>Recent Events</h3>
        <Link to="/admin/events" className="btn btn-primary btn-sm">Manage Events →</Link>
      </div>

      {recentEvents.length === 0 ? (
        <div className="empty-state"><p>No events created yet.</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr><th>Title</th><th>Date</th><th>Location</th><th>Capacity</th></tr>
            </thead>
            <tbody>
              {recentEvents.map(ev => (
                <tr key={ev.id}>
                  <td><strong>{ev.title}</strong></td>
                  <td>{formatDate(ev.date)}</td>
                  <td>{ev.location || '—'}</td>
                  <td>{ev.capacity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
