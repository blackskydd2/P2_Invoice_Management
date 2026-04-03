import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '../../api/invoiceApi';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/Shared/LoadingSpinner';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export default function AgingDashboardPage() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [aging, setAging] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        // Only load aging data for simplicity
        const agingData = await invoiceApi.getAging();
        setAging(agingData);
      } catch (error) {
        console.error('Failed to load aging analytics:', error);
        setError('Failed to load analytics. Please check your permissions and try again.');
      } finally {
        setLoading(false);
      }
    };

    // Only load if user has analytics permissions
    if (hasRole('FinanceManager') || hasRole('Admin')) {
      load();
    } else {
      setError('You do not have permission to view analytics.');
      setLoading(false);
    }
  }, [hasRole]);

  if (loading) return <LoadingSpinner message="Loading aging report..." />;

  const buckets = [
    { label: 'Current', sublabel: 'Not yet due', key: 'current', color: 'var(--status-paid)' },
    { label: '1–30 Days', sublabel: 'Slightly overdue', key: 'oneToThirtyDays', color: 'var(--accent)' },
    { label: '31–60 Days', sublabel: 'Moderately overdue', key: 'thirtyOneToSixtyDays', color: 'var(--status-partial)' },
    { label: '60+ Days', sublabel: 'Critically overdue', key: 'overSixtyDays', color: 'var(--status-overdue)' },
  ];

  const totalAging = aging
    ? buckets.reduce((sum, b) => sum + (aging[b.key] || 0), 0)
    : 0;

  const overdueTotal = aging 
    ? (aging.oneToThirtyDays || 0) + (aging.thirtyOneToSixtyDays || 0) + (aging.overSixtyDays || 0)
    : 0;

  const criticalOverdue = aging?.overSixtyDays || 0;

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          <h1>Aging Report</h1>
          <p>Simple receivables analysis by aging bucket</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/analytics/revenue')}>
            Revenue →
          </button>
        </div>
      </div>

      <div className="page-container">
        {error && (
          <div className="alert alert-error">
            <span>⚠</span> {error}
          </div>
        )}

        {/* Key Statistics Cards */}
        <div className="stat-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-label">Total Outstanding</div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>{fmt(totalAging)}</div>
            <div className="stat-sub">across all invoices</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Current Receivables</div>
            <div className="stat-value" style={{ color: 'var(--status-paid)' }}>{fmt(aging?.current || 0)}</div>
            <div className="stat-sub">not yet due</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Overdue Amount</div>
            <div className="stat-value" style={{ color: 'var(--status-overdue)' }}>{fmt(overdueTotal)}</div>
            <div className="stat-sub">past due date</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Critical Overdue</div>
            <div className="stat-value" style={{ color: 'var(--status-overdue)' }}>{fmt(criticalOverdue)}</div>
            <div className="stat-sub">60+ days overdue</div>
          </div>
        </div>

        {/* Aging Buckets */}
        <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="card-title" style={{ color: 'var(--text-primary)' }}>Receivables by Age</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Total: {fmt(totalAging)}
            </span>
          </div>

          {!aging ? (
            <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>📊</div>
              <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>No aging data available</h3>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>There might be no outstanding invoices.</p>
            </div>
          ) : (
            <div style={{ padding: '2rem' }}>
              {/* Simple Bucket Display */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {buckets.map(b => {
                  const amount = aging[b.key] || 0;
                  const percentage = totalAging > 0 ? (amount / totalAging) * 100 : 0;
                  
                  return (
                    <div 
                      key={b.key} 
                      style={{ 
                        background: 'var(--bg-elevated)', 
                        border: `1px solid var(--border-subtle)`,
                        borderRadius: 'var(--radius-md)',
                        padding: '1.5rem',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {b.label}
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: b.color, fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
                        {fmt(amount)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        {b.sublabel}
                      </div>
                      
                      {/* Simple Progress Bar */}
                      <div style={{ 
                        height: '8px', 
                        background: 'var(--bg-primary)', 
                        borderRadius: '4px', 
                        overflow: 'hidden',
                        marginBottom: '0.5rem'
                      }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${percentage}%`,
                            background: b.color,
                            borderRadius: '4px',
                            transition: 'width 0.5s ease'
                          }}
                        />
                      </div>
                      
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {percentage.toFixed(1)}% of total
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Simple Summary Table */}
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>Summary Breakdown</h3>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-primary)' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Category</th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Amount</th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buckets.map(b => {
                        const amount = aging[b.key] || 0;
                        const percentage = totalAging > 0 ? (amount / totalAging) * 100 : 0;
                        
                        return (
                          <tr key={b.key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                              <span style={{ 
                                display: 'inline-block', 
                                width: '12px', 
                                height: '12px', 
                                background: b.color, 
                                borderRadius: '2px', 
                                marginRight: '0.5rem' 
                              }}></span>
                              {b.label}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: b.color, fontWeight: 600 }}>
                              {fmt(amount)}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                              {percentage.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                      <tr style={{ background: 'var(--bg-primary)', fontWeight: 600 }}>
                        <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>Total</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                          {fmt(totalAging)}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          100.0%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
