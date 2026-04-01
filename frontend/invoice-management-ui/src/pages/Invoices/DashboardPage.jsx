import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { invoiceApi } from '../../api/invoiceApi';
import StatusBadge from '../../components/Shared/StatusBadge';
import LoadingSpinner from '../../components/Shared/LoadingSpinner';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [invData] = await Promise.all([
          invoiceApi.getAll({ page: 1, pageSize: 5 }),
        ]);
        setInvoices(invData.items || invData || []);

        if (hasRole('FinanceManager', 'Admin')) {
          const [aging, revenue] = await Promise.all([
            invoiceApi.getAging(),
            invoiceApi.getRevenueSummary(),
          ]);
          setAnalytics({ aging, revenue });
        }
      } catch {
        // API not connected yet — show empty state
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  const overdue = invoices.filter(i => i.status === 'Overdue').length;
  const totalOutstanding = invoices.reduce((sum, i) => sum + (i.outstandingBalance || 0), 0);
  const paid = invoices.filter(i => i.status === 'Paid').length;

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name || user?.email} — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => navigate('/invoices/create')}>
            + New Invoice
          </button>
        </div>
      </div>

      <div className="page-container">
        {/* Stats */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Total Invoices</div>
            <div className="stat-value">{invoices.length}</div>
            <div className="stat-sub">This period</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Outstanding</div>
            <div className="stat-value danger">{fmt(totalOutstanding)}</div>
            <div className="stat-sub">Awaiting payment</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Overdue</div>
            <div className="stat-value" style={{ color: overdue > 0 ? 'var(--status-overdue)' : 'var(--status-paid)' }}>{overdue}</div>
            <div className="stat-sub">Requires action</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Paid</div>
            <div className="stat-value success">{paid}</div>
            <div className="stat-sub">Completed invoices</div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Invoices</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/invoices')}>
              View All →
            </button>
          </div>

          {invoices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧾</div>
              <h3>No invoices yet</h3>
              <p style={{ fontSize: '0.83rem' }}>Create your first invoice to get started</p>
              <button className="btn btn-primary" style={{ marginTop: '0.5rem' }} onClick={() => navigate('/invoices/create')}>
                + Create Invoice
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Due Date</th>
                    <th>Grand Total</th>
                    <th>Outstanding</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr
                      key={inv.invoiceId}
                      className={inv.status === 'Overdue' ? 'overdue' : ''}
                      onClick={() => navigate(`/invoices/${inv.invoiceId}`)}
                    >
                      <td><span className="table-invoice-number">{inv.invoiceNumber}</span></td>
                      <td style={{ color: 'var(--text-primary)' }}>{inv.customerName || inv.customerId}</td>
                      <td>{fmtDate(inv.invoiceDate)}</td>
                      <td>{fmtDate(inv.dueDate)}</td>
                      <td><span className="table-amount">{fmt(inv.grandTotal)}</span></td>
                      <td><span className="table-amount outstanding">{fmt(inv.outstandingBalance)}</span></td>
                      <td><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Analytics summary for managers */}
        {hasRole('FinanceManager', 'Admin') && analytics && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">Aging Summary</div>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/analytics/aging')}>Details →</button>
              </div>
              <div className="aging-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {[
                  { label: 'Current', cls: 'current', key: 'current' },
                  { label: '1-30 Days', cls: 'overdue-30', key: 'oneToThirtyDays' },
                  { label: '31-60 Days', cls: 'overdue-60', key: 'thirtyOneToSixtyDays' },
                  { label: '60+ Days', cls: 'overdue-plus', key: 'overSixtyDays' },
                ].map(b => (
                  <div key={b.key} className={`aging-bucket ${b.cls}`}>
                    <div className="bucket-label">{b.label}</div>
                    <div className="bucket-amount">{fmt(analytics.aging?.[b.key] || 0)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Revenue Overview</div>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/analytics/revenue')}>Details →</button>
              </div>
              <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {[
                  { label: 'Total Invoiced', val: analytics.revenue?.totalInvoiced },
                  { label: 'Collected', val: analytics.revenue?.totalCollected },
                  { label: 'Outstanding', val: analytics.revenue?.totalOutstanding },
                  { label: 'Overdue Amount', val: analytics.revenue?.totalOverdue },
                ].map(item => (
                  <div key={item.label} className="info-item">
                    <div className="info-item-label">{item.label}</div>
                    <div className="info-item-value mono">{fmt(item.val)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
