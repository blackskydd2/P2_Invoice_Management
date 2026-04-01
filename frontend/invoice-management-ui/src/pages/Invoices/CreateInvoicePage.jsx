import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '../../api/invoiceApi';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

const emptyItem = () => ({
  _id: Math.random().toString(36).slice(2),
  description: '',
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  tax: 0,
});

const calcLineTotal = (item) => {
  const qty = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.unitPrice) || 0;
  const disc = parseFloat(item.discount) || 0;
  const tax = parseFloat(item.tax) || 0;
  return (qty * price - disc)  * (1 + tax/100);
};

export default function CreateInvoicePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const due = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    customerId: '',
    quoteId: '',
    invoiceDate: today,
    dueDate: due,
    discountAmount: 0,
    notes: '',
  });

  const [items, setItems] = useState([emptyItem()]);
  const [errors, setErrors] = useState({});

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const setItemField = (id, field, value) => {
    setItems(prev => prev.map(item => item._id === id ? { ...item, [field]: value } : item));
  };

  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (id) => setItems(prev => prev.filter(item => item._id !== id));

  const subTotal = items.reduce((sum, item) => sum + calcLineTotal(item), 0);
  const grandTotal = Math.max(0, subTotal - (parseFloat(form.discountAmount) || 0));

  const validate = () => {
    const errs = {};
    if (!form.customerId.trim()) errs.customerId = 'Customer ID is required';
    if (!form.invoiceDate) errs.invoiceDate = 'Invoice date is required';
    if (!form.dueDate) errs.dueDate = 'Due date is required';
    if (form.dueDate && form.invoiceDate && form.dueDate <= form.invoiceDate) {
      errs.dueDate = 'Due date must be after invoice date';
    }
    if (items.some(i => !i.description.trim())) errs.items = 'All line items must have a description';
    if (items.some(i => parseFloat(i.quantity) <= 0)) errs.items = 'Quantity must be positive';
    if (items.some(i => parseFloat(i.unitPrice) < 0)) errs.items = 'Unit price cannot be negative';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        customerId: parseInt(form.customerId) || form.customerId,
        discountAmount: parseFloat(form.discountAmount) || 0,
        lineItems: items.map(({ _id, ...item }) => ({
          ...item,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          discount: parseFloat(item.discount) || 0,
          tax: parseFloat(item.tax) || 0,
        })),
      };
      const created = await invoiceApi.create(payload);
      setSuccess(`Invoice ${created.invoiceNumber} created successfully!`);
      setTimeout(() => navigate(`/invoices/${created.invoiceId}`), 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.title || 'Failed to create invoice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          <h1>New Invoice</h1>
          <p>Create a new invoice with line items</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/invoices')}>Cancel</button>
        </div>
      </div>

      <div className="page-container">
        {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}
        {success && <div className="alert alert-success"><span>✓</span> {success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Invoice Details */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div className="card-title">Invoice Details</div>
            </div>

            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Customer ID *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 1001"
                  value={form.customerId}
                  onChange={e => setField('customerId', e.target.value)}
                />
                {errors.customerId && <div className="form-error">⚠ {errors.customerId}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Quote ID (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. QUO-2024-0001"
                  value={form.quoteId}
                  onChange={e => setField('quoteId', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Invoice Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.invoiceDate}
                  onChange={e => setField('invoiceDate', e.target.value)}
                />
                {errors.invoiceDate && <div className="form-error">⚠ {errors.invoiceDate}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Due Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.dueDate}
                  onChange={e => setField('dueDate', e.target.value)}
                />
                {errors.dueDate && <div className="form-error">⚠ {errors.dueDate}</div>}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div className="card-title">Line Items</div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
                + Add Item
              </button>
            </div>

            {errors.items && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠ {errors.items}</div>}

            <div style={{ overflowX: 'auto' }}>
              <table className="line-items-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 220 }}>Description</th>
                    <th style={{ width: 90 }}>Qty</th>
                    <th style={{ width: 120 }}>Unit Price</th>
                    <th style={{ width: 100 }}>Discount</th>
                    <th style={{ width: 100 }}>Tax</th>
                    <th style={{ width: 120 }}>Line Total</th>
                    <th style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item._id}>
                      <td>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Item description"
                          value={item.description}
                          onChange={e => setItemField(item._id, 'description', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={e => setItemField(item._id, 'quantity', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.unitPrice}
                          onChange={e => setItemField(item._id, 'unitPrice', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.discount}
                          onChange={e => setItemField(item._id, 'discount', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.tax}
                          onChange={e => setItemField(item._id, 'tax', e.target.value)}
                        />
                      </td>
                      <td>
                        <span className="table-amount" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                          {fmt(calcLineTotal(item))}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeItem(item._id)}
                          disabled={items.length === 1}
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <div className="totals-box" style={{ minWidth: 320 }}>
                <div className="totals-row">
                  <span style={{ color: 'var(--text-secondary)' }}>Sub Total</span>
                  <span className="amount mono">{fmt(subTotal)}</span>
                </div>

                <div className="totals-row">
                  <span style={{ color: 'var(--text-secondary)' }}>Invoice Discount</span>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    step="0.01"
                    value={form.discountAmount}
                    onChange={e => setField('discountAmount', e.target.value)}
                    style={{ width: 120, textAlign: 'right', padding: '0.3rem 0.5rem' }}
                  />
                </div>

                <div className="totals-row total">
                  <span>Grand Total</span>
                  <span className="amount" style={{ color: 'var(--accent)' }}>{fmt(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div className="card-title">Notes (optional)</div>
            </div>
            <textarea
              className="form-textarea"
              placeholder="Add any notes or payment terms..."
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
            />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate('/invoices')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Creating…
                </>
              ) : '✓ Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
