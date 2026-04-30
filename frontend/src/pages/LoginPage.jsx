import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await login(email, password);
      loginUser(data);
      navigate(data.role === 'ROLE_ADMIN' ? '/admin' : '/events');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Hero side */}
      <div className="auth-hero">
        <div className="auth-hero-icon">🎓</div>
        <h2>Welcome Back!</h2>
        <p>Sign in to access your university event dashboard and manage your registrations.</p>

        <div className="auth-features">
          <div className="auth-feature-item">
            <span className="auth-feature-dot">📅</span>
            Browse upcoming events &amp; workshops
          </div>
          <div className="auth-feature-item">
            <span className="auth-feature-dot">✅</span>
            Register in one click
          </div>
          <div className="auth-feature-item">
            <span className="auth-feature-dot">🔔</span>
            Get instant notifications
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="auth-form-side">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h1>Sign In</h1>
            <p>Enter your credentials to access your account</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@university.edu"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              className="btn btn-primary btn-lg w-full"
              style={{ marginTop: 8 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Signing in...
                </>
              ) : 'Sign In →'}
            </button>
          </form>

          <div className="auth-divider" style={{ marginTop: 24 }}>
            Don&apos;t have an account?{' '}
            <Link to="/register">Create one for free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
