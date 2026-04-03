import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceApi } from '../../api/invoiceApi';
import LoadingSpinner from '../../components/Shared/LoadingSpinner';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

export default function AddPaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    paymentAmount: '',
    paymentDate: today,
    paymentMethod: 'BankTransfer',
    referenceNumber: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    invoiceApi.getById(id).then(data => {
      setInvoice(data);
      setForm(prev => ({ ...prev, paymentAmount: data.outstandingBalance?.toString() || '' }));
    }).catch(() => setError('Failed to load invoice.')).finally(() => setLoading(false));
  }, [id]);

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    const amount = parseFloat(form.paymentAmount);
    if (!form.paymentAmount || isNaN(amount) || amount <= 0) {
      errs.paymentAmount = 'Payment amount must be positive';
    }
    if (invoice && amount > invoice.outstandingBalance) {
      errs.paymentAmount = `Amount cannot exceed outstanding balance of ${fmt(invoice.outstandingBalance)}`;
    }
    if (!form.paymentDate) errs.paymentDate = 'Payment date is required';
    if (!form.paymentMethod) errs.paymentMethod = 'Payment method is required';
    if (!form.referenceNumber) errs.referenceNumber = 'Reference number is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setError('');
    try {
      await invoiceApi.addPayment(id, {
        ...form,
        paymentAmount: parseFloat(form.paymentAmount),
      });
      setSuccess('Payment recorded successfully!');
      setTimeout(() => navigate(`/invoices/${id}`), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading invoice..." />;

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          <h1 style={{ fontSize: '1rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/invoices/${id}`)} style={{ marginRight: '0.5rem' }}>
              ← Invoice
            </button>
            / Add Payment
          </h1>
        </div>
      </div>

      <div className="page-container" style={{ maxWidth: 640 }}>
        {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}
        {success && <div className="alert alert-success"><span>✓</span> {success}</div>}

        {/* Invoice Summary */}
        {invoice && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: '1rem', fontWeight: 600 }}>
                  {invoice.invoiceNumber}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Customer ID: {invoice.customerId}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Outstanding Balance</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-overdue)', letterSpacing: '-0.02em' }}>
                  {fmt(invoice.outstandingBalance)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>of {fmt(invoice.grandTotal)} total</div>
              </div>
            </div>

            <div className="progress-bar" style={{ marginTop: '1rem' }}>
              <div
                className="progress-fill partial"
                style={{ width: `${Math.min(100, ((invoice.grandTotal - invoice.outstandingBalance) / invoice.grandTotal) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Payment Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Payment Details</div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Payment Amount (₹) *</label>
              <input
                type="number"
                className="form-input"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={form.paymentAmount}
                onChange={e => setField('paymentAmount', e.target.value)}
                style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}
              />
              {errors.paymentAmount && <div className="form-error">⚠ {errors.paymentAmount}</div>}
              {invoice && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setField('paymentAmount', invoice.outstandingBalance.toString())}>
                    Full Amount ({fmt(invoice.outstandingBalance)})
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setField('paymentAmount', (invoice.outstandingBalance / 2).toFixed(2))}>
                    Half
                  </button>
                </div>
              )}
            </div>

            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Payment Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.paymentDate}
                  onChange={e => setField('paymentDate', e.target.value)}
                />
                {errors.paymentDate && <div className="form-error">⚠ {errors.paymentDate}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <select
                className="form-select"
                value={form.paymentMethod}
                onChange={e => setField('paymentMethod', e.target.value)}
              >
                <option value="BankTransfer">🏦 Bank Transfer</option>
                <option value="CreditCard">💳 Credit Card</option>
                <option value="Cash">💵 Cash</option>
              </select>
              {errors.paymentMethod && <div className="form-error">⚠ {errors.paymentMethod}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Reference Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="TXN-XXXXXXXX or cheque number"
                value={form.referenceNumber}
                onChange={e => setField('referenceNumber', e.target.value)}
                style={{ fontFamily: 'var(--font-mono)' }}
              />
              {errors.referenceNumber && <div className="form-error">⚠ {errors.referenceNumber}</div>}
              <div className="form-hint">Transaction ID, cheque number, or transfer reference</div>
            </div>

            <div className="divider" />

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate(`/invoices/${id}`)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    Recording…
                  </>
                ) : '✓ Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
