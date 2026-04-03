import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
  >
    <span className="nav-icon">{icon}</span>
    {label}
  </NavLink>
);

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">IV</div>
          <div className="logo-text">Invoice<span>OS</span></div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        <NavItem to="/dashboard" icon="⬛" label="Dashboard" />
        <NavItem to="/invoices" icon="🧾" label="Invoices" />

        <div className="nav-section-label">Finance</div>
        <NavItem to="/invoices/create" icon="✚" label="New Invoice" />
        <NavItem to="/payments" icon="💳" label="Payments" />

        {hasRole('FinanceManager', 'Admin') && (
          <>
            <div className="nav-section-label">Analytics</div>
            <NavItem to="/analytics/aging" icon="📊" label="Aging Report" />
            <NavItem to="/analytics/revenue" icon="💰" label="Revenue Dashboard" />
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || user?.email}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: 'auto', fontSize: '0.75rem' }}
            title="Logout"
          >
            ↩
          </button>
        </div>
      </div>
    </aside>
  );
}
