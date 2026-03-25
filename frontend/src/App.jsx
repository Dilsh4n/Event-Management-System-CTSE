import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventsPage from './pages/EventsPage';
import MyRegistrationsPage from './pages/MyRegistrationsPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEventsPage from './pages/admin/AdminEventsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/events" />;
  return children;
}

function App() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/login" element={user ? <Navigate to={user.role === 'ROLE_ADMIN' ? '/admin' : '/events'} /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/events" /> : <RegisterPage />} />
          <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
          <Route path="/my-registrations" element={<ProtectedRoute><MyRegistrationsPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/events" element={<AdminRoute><AdminEventsPage /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
          <Route path="*" element={<Navigate to={user ? (user.role === 'ROLE_ADMIN' ? '/admin' : '/events') : '/login'} />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
