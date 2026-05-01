import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initial = user?.name?.[0]?.toUpperCase() || '?';

  return (
    <header className="navbar">
      <NavLink to={user ? (isAdmin ? '/admin' : '/events') : '/login'} className="navbar-brand">
        <div className="navbar-logo">🎓</div>
        <span className="navbar-title">UniEvents</span>
      </NavLink>

      <nav>
        {!user ? (
          <>
            <NavLink to="/login"    className={({ isActive }) => isActive ? 'active' : ''}>Login</NavLink>
            <NavLink to="/register" className={({ isActive }) => isActive ? 'active' : ''}>Register</NavLink>
          </>
        ) : isAdmin ? (
          <>
            <NavLink to="/admin"        end className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink>
            <NavLink to="/admin/events"     className={({ isActive }) => isActive ? 'active' : ''}>Events</NavLink>
            <NavLink to="/admin/users"      className={({ isActive }) => isActive ? 'active' : ''}>Users</NavLink>
          </>
        ) : (
          <>
            <NavLink to="/events"           className={({ isActive }) => isActive ? 'active' : ''}>Browse Events</NavLink>
            <NavLink to="/my-registrations" className={({ isActive }) => isActive ? 'active' : ''}>My Registrations</NavLink>
            <NavLink to="/notifications"    className={({ isActive }) => isActive ? 'active' : ''}>Notifications</NavLink>
          </>
        )}
      </nav>

      {user && (
        <div className="navbar-user">
          <div className="navbar-avatar">{initial}</div>
          <span className="navbar-user-name">{user.name}</span>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>Sign Out</button>
        </div>
      )}
    </header>
  );
}
