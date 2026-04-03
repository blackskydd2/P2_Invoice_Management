import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceApi } from '../../api/invoiceApi';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/Shared/StatusBadge';
import LoadingSpinner from '../../components/Shared/LoadingSpinner';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const PAYMENT_ICONS = { Cash: '💵', CreditCard: '💳', BankTransfer: '🏦' };

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadAll();
  }, [id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [inv, lineItems, pymts] = await Promise.all([
        invoiceApi.getById(id),
        invoiceApi.getItems(id),
        invoiceApi.getPayments(id),
      ]);
      setInvoice(inv);
      setItems(lineItems || []);
      setPayments(pymts || []);
    } catch {
      setError('Failed to load invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    try {
      await invoiceApi.changeStatus(id, newStatus);
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change status.');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await invoiceApi.delete(id);
      navigate('/invoices');
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot delete invoice. Payments may exist.');
      setShowDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading invoice..." />;
  if (!invoice) return (
    <div className="page-container">
      <div className="alert alert-error">Invoice not found.</div>
      <button className="btn btn-secondary" onClick={() => navigate('/invoices')}>← Back</button>
    </div>
  );

  const isPaid = invoice.status === 'Paid';
  const isCancelled = invoice.status === 'Cancelled';
  const canEdit = !isPaid && !isCancelled;
  const paidPercent = invoice.grandTotal > 0
    ? Math.min(100, ((invoice.grandTotal - invoice.outstandingBalance) / invoice.grandTotal) * 100)
    : 0;

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          <h1 style={{ fontSize: '1rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/invoices')} style={{ marginRight: '0.5rem' }}>← Invoices</button>
            / Invoice Detail
          </h1>
        </div>
        <div className="topbar-actions">
          {canEdit && (
            <button className="btn btn-primary" onClick={() => navigate(`/invoices/${id}/payment`)}>
              + Add Payment
            </button>
          )}
          {hasRole('FinanceManager', 'Admin') && canEdit && (
            <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="page-container">
        {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

        {/* Header */}
        <div className="detail-header">
          <div className="detail-header-left">
            <h1>
              <span className="invoice-num">{invoice.invoiceNumber}</span>
              <StatusBadge status={invoice.status} />
            </h1>
            <div className="detail-header-meta">
              <span>Created {fmtDate(invoice.createdDate)}</span>
              <span>•</span>
              <span>Customer ID: <strong style={{ color: 'var(--text-primary)' }}>{invoice.customerId}</strong></span>
              {invoice.quoteId && <><span>•</span><span>Quote: <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{invoice.quoteId}</strong></span></>}
            </div>
          </div>

          {hasRole('FinanceManager', 'Admin') && canEdit && (
            <div className="detail-header-actions">
              <select
                className="form-select"
                style={{ width: 180 }}
                value={invoice.status}
                onChange={e => handleStatusChange(e.target.value)}
                disabled={statusLoading}
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Overdue">Overdue</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          )}
        </div>

        {/* Payment Progress */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                Payment Progress
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                {fmt(invoice.grandTotal - invoice.outstandingBalance)}
                <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                  of {fmt(invoice.grandTotal)} paid
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                Outstanding
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: invoice.outstandingBalance > 0 ? 'var(--status-overdue)' : 'var(--status-paid)' }}>
                {fmt(invoice.outstandingBalance)}
              </div>
            </div>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div
              className={`progress-fill ${isPaid ? 'paid' : invoice.outstandingBalance > 0 ? 'partial' : 'paid'}`}
              style={{ width: `${paidPercent}%` }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>{paidPercent.toFixed(0)}% collected</span>
            <span>Due {fmtDate(invoice.dueDate)}</span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header"><div className="card-title">Invoice Information</div></div>
          <div className="info-grid">
            {[
              { label: 'Invoice Date', value: fmtDate(invoice.invoiceDate) },
              { label: 'Due Date', value: fmtDate(invoice.dueDate) },
              { label: 'Sub Total', value: fmt(invoice.subTotal), mono: true },
              { label: 'Discount', value: fmt(invoice.discountAmount), mono: true },
              { label: 'Tax Amount', value: fmt(invoice.taxAmount), mono: true },
              { label: 'Grand Total', value: fmt(invoice.grandTotal), mono: true },
            ].map(item => (
              <div key={item.label} className="info-item">
                <div className="info-item-label">{item.label}</div>
                <div className={`info-item-value${item.mono ? ' mono' : ''}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Line Items */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">Line Items</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{items.length} items</span>
          </div>
          {items.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No line items found.</p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Discount</th>
                    <th>Tax</th>
                    <th style={{ textAlign: 'right' }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.lineItemId}>
                      <td style={{ color: 'var(--text-primary)' }}>{item.description}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{item.quantity}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(item.unitPrice)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--status-partial)' }}>
                        {item.discount > 0 ? `-${fmt(item.discount)}` : '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                        {item.tax > 0 ? fmt(item.tax) : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="table-amount">{fmt(item.lineTotal)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <div className="totals-box" style={{ minWidth: 280 }}>
              <div className="totals-row">
                <span style={{ color: 'var(--text-secondary)' }}>Sub Total</span>
                <span className="amount mono">{fmt(invoice.subTotal)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="totals-row">
                  <span style={{ color: 'var(--text-secondary)' }}>Discount</span>
                  <span className="amount mono" style={{ color: 'var(--status-partial)' }}>-{fmt(invoice.discountAmount)}</span>
                </div>
              )}
              <div className="totals-row total">
                <span>Grand Total</span>
                <span className="amount" style={{ color: 'var(--accent)' }}>{fmt(invoice.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Payment History</div>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={() => navigate(`/invoices/${id}/payment`)}>
                + Add Payment
              </button>
            )}
          </div>

          {payments.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-state-icon">💳</div>
              <h3>No payments recorded</h3>
              {canEdit && (
                <button className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => navigate(`/invoices/${id}/payment`)}>
                  Record First Payment
                </button>
              )}
            </div>
          ) : (
            payments.map(p => (
              <div key={p.paymentId} className="payment-item">
                <div className="payment-item-left">
                  <div className="payment-icon">{PAYMENT_ICONS[p.paymentMethod] || '💰'}</div>
                  <div>
                    <div className="payment-method">{p.paymentMethod}</div>
                    <div className="payment-ref">
                      {p.referenceNumber || 'No reference'} · {fmtDate(p.paymentDate)}
                    </div>
                  </div>
                </div>
                <div className="payment-amount">{fmt(p.paymentAmount)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Delete Invoice</div>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Are you sure you want to delete invoice <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{invoice.invoiceNumber}</strong>?
              This action cannot be undone. Invoices with payments cannot be deleted.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? 'Deleting…' : 'Delete Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
