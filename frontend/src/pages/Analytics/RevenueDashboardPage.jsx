import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '../../api/invoiceApi';
import LoadingSpinner from '../../components/Shared/LoadingSpinner';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const fmtPct = (n) => `${(n || 0).toFixed(1)}%`;

export default function RevenueDashboardPage() {
  const navigate = useNavigate();
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    invoiceApi.getRevenueSummary()
      .then(data => setRevenue(data))
      .catch(() => setError('Failed to load revenue data. The API may not be connected yet.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading revenue data..." />;

  const collectionRate = revenue
    ? revenue.totalInvoiced > 0 ? (revenue.totalCollected / revenue.totalInvoiced) * 100 : 0
    : 0;

  const statusBreakdown = revenue?.byStatus || [];

  const statusColors = {
    Paid: 'var(--status-paid)',
    PartiallyPaid: 'var(--status-partial)',
    Overdue: 'var(--status-overdue)',
    Sent: 'var(--status-sent)',
    Draft: 'var(--status-draft)',
    Cancelled: 'var(--status-cancelled)',
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          <h1>Revenue Dashboard</h1>
          <p>Financial performance overview</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/analytics/aging')}>
            ← Aging Report
          </button>
        </div>
      </div>

      <div className="page-container">
        {error && (
          <div className="alert alert-info">
            <span>ℹ</span> {error}
          </div>
        )}

        {/* Key Metrics */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Total Invoiced</div>
            <div className="stat-value">{fmt(revenue?.totalInvoiced)}</div>
            <div className="stat-sub">{revenue?.totalInvoiceCount || 0} invoices</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Collected</div>
            <div className="stat-value success">{fmt(revenue?.totalCollected)}</div>
            <div className="stat-sub">
              <span style={{ color: 'var(--status-paid)' }}>{fmtPct(collectionRate)}</span> collection rate
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Outstanding</div>
            <div className="stat-value danger">{fmt(revenue?.totalOutstanding)}</div>
            <div className="stat-sub">Pending collection</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Overdue Amount</div>
            <div className="stat-value" style={{ color: 'var(--status-overdue)' }}>{fmt(revenue?.totalOverdue)}</div>
            <div className="stat-sub">{revenue?.overdueCount || 0} overdue invoices</div>
          </div>
        </div>

        {/* Collection Rate Gauge */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">Collection Rate</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: collectionRate >= 80 ? 'var(--status-paid)' : collectionRate >= 50 ? 'var(--accent)' : 'var(--status-overdue)' }}>
              {fmtPct(collectionRate)}
            </span>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <div className="progress-bar" style={{ height: 12 }}>
              <div
                className="progress-fill"
                style={{
                  width: `${collectionRate}%`,
                  background: collectionRate >= 80
                    ? 'var(--status-paid)'
                    : collectionRate >= 50
                      ? 'var(--accent)'
                      : 'var(--status-overdue)',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>0%</span>
            <span style={{ color: collectionRate >= 80 ? 'var(--status-paid)' : 'var(--text-muted)' }}>
              {collectionRate >= 80 ? '✓ Excellent' : collectionRate >= 60 ? '~ Good' : '⚠ Needs attention'}
            </span>
            <span>100%</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1.25rem' }}>
            {[
              { label: 'Collected', value: fmt(revenue?.totalCollected), color: 'var(--status-paid)' },
              { label: 'Outstanding', value: fmt(revenue?.totalOutstanding), color: 'var(--accent)' },
              { label: 'Overdue', value: fmt(revenue?.totalOverdue), color: 'var(--status-overdue)' },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  {m.label}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700, color: m.color }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Breakdown */}
        {statusBreakdown.length > 0 && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div className="card-title">Revenue by Status</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {statusBreakdown.map(s => {
                const pct = revenue?.totalInvoiced > 0 ? (s.amount / revenue.totalInvoiced) * 100 : 0;
                const color = statusColors[s.status] || 'var(--text-muted)';
                return (
                  <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 120, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{s.status}</span>
                    </div>
                    <div style={{ flex: 1, height: 20, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, opacity: 0.85 }} />
                    </div>
                    <div style={{ width: 50, textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {pct.toFixed(0)}%
                    </div>
                    <div style={{ width: 110, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color }}>
                      {fmt(s.amount)}
                    </div>
                    <div style={{ width: 40, textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {s.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Monthly breakdown if available */}
        {revenue?.monthly && revenue.monthly.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Monthly Revenue Trend</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {revenue.monthly.map(m => {
                const maxVal = Math.max(...revenue.monthly.map(x => x.invoiced || 0));
                const pct = maxVal > 0 ? (m.invoiced / maxVal) * 100 : 0;
                return (
                  <div key={m.month} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 60, fontSize: '0.78rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{m.month}</div>
                    <div style={{ flex: 1, height: 24, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', opacity: 0.7, borderRadius: 4 }} />
                      <div style={{
                        position: 'absolute', left: 0, top: 0, height: '100%',
                        width: `${maxVal > 0 ? (m.collected / maxVal) * 100 : 0}%`,
                        background: 'var(--status-paid)', opacity: 0.5, borderRadius: 4
                      }} />
                    </div>
                    <div style={{ width: 110, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {fmt(m.invoiced)}
                    </div>
                  </div>
                );
              })}
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.72rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 10, height: 10, background: 'var(--accent)', opacity: 0.7, borderRadius: 2, display: 'inline-block' }} />
                  Invoiced
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 10, height: 10, background: 'var(--status-paid)', opacity: 0.5, borderRadius: 2, display: 'inline-block' }} />
                  Collected
                </span>
              </div>
            </div>
          </div>
        )}

        {!revenue && !error && (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">📈</div>
              <h3>No revenue data yet</h3>
              <p style={{ fontSize: '0.83rem' }}>Create invoices to see revenue analytics here</p>
              <button className="btn btn-primary" style={{ marginTop: '0.5rem' }} onClick={() => navigate('/invoices/create')}>
                Create Invoice
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
