import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AdminLayout from './components/AdminLayout';
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
  return <AdminLayout>{children}</AdminLayout>;
}

function App() {
  const { user, loading } = useAuth();
  if (loading) return null;

  const adminHome = '/admin';
  const userHome  = '/events';

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login"    element={user ? <Navigate to={user.role === 'ROLE_ADMIN' ? adminHome : userHome} /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to={userHome} /> : <RegisterPage />} />

        <Route path="/events"           element={<ProtectedRoute><div className="container"><EventsPage /></div></ProtectedRoute>} />
        <Route path="/my-registrations" element={<ProtectedRoute><div className="container"><MyRegistrationsPage /></div></ProtectedRoute>} />
        <Route path="/notifications"    element={<ProtectedRoute><div className="container"><NotificationsPage /></div></ProtectedRoute>} />

        <Route path="/admin"        element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/events" element={<AdminRoute><AdminEventsPage /></AdminRoute>} />
        <Route path="/admin/users"  element={<AdminRoute><AdminUsersPage /></AdminRoute>} />

        <Route path="*" element={<Navigate to={user ? (user.role === 'ROLE_ADMIN' ? adminHome : userHome) : '/login'} />} />
      </Routes>
    </>
  );
}

export default App;
