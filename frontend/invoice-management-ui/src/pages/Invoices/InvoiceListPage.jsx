import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '../../api/invoiceApi';
import StatusBadge from '../../components/Shared/StatusBadge';
import LoadingSpinner from '../../components/Shared/LoadingSpinner';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUSES = ['All', 'Draft', 'Sent', 'Overdue', 'PartiallyPaid', 'Paid', 'Cancelled'];

export default function InvoiceListPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    loadInvoices();
  }, [page, statusFilter]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (statusFilter !== 'All') params.status = statusFilter;
      if (search) params.search = search;
      const data = await invoiceApi.getAll(params);
      setInvoices(data.items || data || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || (data.items || data || []).length);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadInvoices();
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          <h1>Invoices</h1>
          <p>{totalCount} invoices total</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => navigate('/invoices/create')}>
            + New Invoice
          </button>
        </div>
      </div>

      <div className="page-container">
        {/* Filter Bar */}
        <div className="filter-bar">
          <form onSubmit={handleSearch} className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="form-input"
              placeholder="Search by invoice # or customer…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </form>

          <select
            className="form-select"
            style={{ width: 160 }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>

          <button className="btn btn-secondary" onClick={() => { setSearch(''); setStatusFilter('All'); setPage(1); }}>
            Reset
          </button>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <LoadingSpinner />
          ) : invoices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧾</div>
              <h3>No invoices found</h3>
              <p style={{ fontSize: '0.83rem' }}>Try adjusting your filters or create a new invoice</p>
              <button className="btn btn-primary" style={{ marginTop: '0.5rem' }} onClick={() => navigate('/invoices/create')}>
                + Create Invoice
              </button>
            </div>
          ) : (
            <>
              <div className="table-wrapper" style={{ borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', border: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Invoice Date</th>
                      <th>Due Date</th>
                      <th>Grand Total</th>
                      <th>Outstanding</th>
                      <th>Status</th>
                      <th></th>
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
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{inv.customerName || inv.customerId}</td>
                        <td>{fmtDate(inv.invoiceDate)}</td>
                        <td style={{ color: inv.status === 'Overdue' ? 'var(--status-overdue)' : 'inherit' }}>
                          {fmtDate(inv.dueDate)}
                        </td>
                        <td><span className="table-amount">{fmt(inv.grandTotal)}</span></td>
                        <td>
                          <span className={`table-amount ${inv.outstandingBalance > 0 ? 'outstanding' : ''}`}>
                            {fmt(inv.outstandingBalance)}
                          </span>
                        </td>
                        <td><StatusBadge status={inv.status} /></td>
                        <td onClick={e => e.stopPropagation()}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/invoices/${inv.invoiceId}`)}
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <span>Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}</span>
                <div className="pagination-controls">
                  <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      className={`page-btn${p === page ? ' active' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
