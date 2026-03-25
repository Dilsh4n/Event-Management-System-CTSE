import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="navbar">
      <h1>🎓 UniEvents</h1>
      <nav>
        {!user ? (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        ) : isAdmin ? (
          <>
            <NavLink to="/admin">Dashboard</NavLink>
            <NavLink to="/admin/events">Manage Events</NavLink>
            <NavLink to="/admin/users">Users</NavLink>
            <span style={{ color: 'var(--text-light)', fontSize: 13 }}>{user.name}</span>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <NavLink to="/events">Events</NavLink>
            <NavLink to="/my-registrations">My Registrations</NavLink>
            <NavLink to="/notifications">Notifications</NavLink>
            <span style={{ color: 'var(--text-light)', fontSize: 13 }}>{user.name}</span>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
          </>
        )}
      </nav>
    </div>
  );
}
