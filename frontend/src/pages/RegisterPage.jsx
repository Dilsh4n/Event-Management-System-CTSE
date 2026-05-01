import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await register(name, email, password);
      loginUser(data);
      navigate('/events');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Hero side */}
      <div className="auth-hero">
        <div className="auth-hero-icon">🚀</div>
        <h2>Join UniEvents</h2>
        <p>Create your free account and never miss an important university event or workshop again.</p>

        <div className="auth-features">
          <div className="auth-feature-item">
            <span className="auth-feature-dot">🎯</span>
            Discover curated tech events
          </div>
          <div className="auth-feature-item">
            <span className="auth-feature-dot">📧</span>
            Receive email confirmations
          </div>
          <div className="auth-feature-item">
            <span className="auth-feature-dot">🗂️</span>
            Manage all registrations in one place
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="auth-form-side">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h1>Create Account</h1>
            <p>Join thousands of students on the platform</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@university.edu"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
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
                  Creating account...
                </>
              ) : 'Create Account →'}
            </button>
          </form>

          <div className="auth-divider" style={{ marginTop: 24 }}>
            Already have an account?{' '}
            <Link to="/login">Sign in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
