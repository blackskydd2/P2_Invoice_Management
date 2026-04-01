export default function StatusBadge({ status }) {
  const map = {
    Draft: 'draft',
    Sent: 'sent',
    Overdue: 'overdue',
    PartiallyPaid: 'partial',
    Paid: 'paid',
    Cancelled: 'cancelled',
  };

  const cls = map[status] || 'draft';
  const labels = {
    PartiallyPaid: 'Partial',
  };

  return (
    <span className={`badge badge-${cls}`}>
      <span className="badge-dot" />
      {labels[status] || status}
    </span>
  );
}
