import { useState, useEffect } from 'react';
import { getAdminUsers } from '../../api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) return <p>Loading users...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <>
      <h2 className="page-title">Registered Users</h2>

      {users.length === 0 ? (
        <div className="empty-state"><h3>No users found</h3></div>
      ) : (
        <>
          <p style={{ marginBottom: 16, color: 'var(--text-light)' }}>{users.length} user{users.length !== 1 ? 's' : ''} registered</p>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table>
              <thead>
                <tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id}>
                    <td>{i + 1}</td>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td><span className={`badge ${u.role === 'ADMIN' ? 'badge-primary' : 'badge-success'}`}>{u.role}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-light)' }}>{u.createdAt ? formatDate(u.createdAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
