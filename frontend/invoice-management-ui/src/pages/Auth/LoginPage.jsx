import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password) {
      setError('Username and password are required.');
      return;
    }
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left panel */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-icon">IV</div>
          <h1>Invoice<span style={{ color: 'var(--accent)' }}>OS</span></h1>
          <p>Enterprise Invoice Management</p>
        </div>
        <div className="login-features">
          <div className="login-feature">
            <span className="login-feature-icon">🔒</span>
            <span className="login-feature-text">Role-based access control</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">⚡</span>
            <span className="login-feature-text">Real-time payment tracking</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">📊</span>
            <span className="login-feature-text">Financial analytics & DSO</span>
          </div>
          <div className="login-feature">
            <span className="login-feature-icon">🔄</span>
            <span className="login-feature-text">Automated aging reports</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div className="login-form-card">
          <h2 className="login-form-title">Sign in</h2>
          <p className="login-form-subtitle">Access your financial dashboard</p>

          {error && (
            <div className="alert alert-error">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                className="form-input"
                placeholder="username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Signing in...
                </>
              ) : 'Sign In →'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Demo Credentials</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {[
                { label: 'Admin', username: 'admin' },
                { label: 'Finance Manager', username: 'finance-manager' },
                { label: 'Finance User', username: 'user' },
              ].map(d => (
                <button
                  key={d.username}
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', fontSize: '0.75rem' }}
                  onClick={() => setForm({ username: d.username, password: 'password123' })}
                >
                  <span style={{ color: 'var(--accent)', width: 100 }}>{d.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{d.username}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
