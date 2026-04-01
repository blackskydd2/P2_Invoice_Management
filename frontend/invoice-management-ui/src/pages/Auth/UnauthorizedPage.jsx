import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.4 }}>🔒</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '0.5rem' }}>
          Access Denied
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Your role (<strong style={{ color: 'var(--accent)' }}>{user?.role}</strong>) does not have permission to view this page.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
