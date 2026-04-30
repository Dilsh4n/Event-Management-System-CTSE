import { useState, useEffect } from 'react';
import { getAdminUsers } from '../../api';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#06b6d4,#0ea5e9)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#ef4444,#dc2626)',
];

export default function AdminUsersPage() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getAdminUsers();
        setUsers(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load users.');
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        Loading users...
      </div>
    );
  }

  if (error) return <div className="alert alert-error"><span>⚠️</span>{error}</div>;

  const filtered = users.filter(
    u => u.name?.toLowerCase().includes(search.toLowerCase())
      || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Registered Users</h2>
          <p className="page-subtitle">{users.length} user{users.length !== 1 ? 's' : ''} on the platform</p>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: 20, maxWidth: 360 }}>
        <input
          placeholder="🔍  Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 16 }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">👥</span>
          <h3>{search ? 'No matching users' : 'No users found'}</h3>
          <p>{search ? 'Try a different search term.' : 'Users will appear here after they register.'}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--text-light)', fontSize: 13, width: 40 }}>{i + 1}</td>
                  <td>
                    <div className="user-info-cell">
                      <div
                        className="user-avatar"
                        style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                      >
                        {getInitials(u.name)}
                      </div>
                      <strong>{u.name}</strong>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-danger' : 'badge-info'}`}>
                      {u.role === 'ADMIN' ? '🛡️ Admin' : '👤 User'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-light)' }}>
                    {u.createdAt ? formatDate(u.createdAt) : '—'}
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
