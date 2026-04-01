import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const renderWithRouter = (ui, { route = '/' } = {}) =>
  render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);

// ─── Line-total calculation (pure logic, no components needed) ─────────────

const calcLineTotal = (qty, price, discount, tax) =>
  qty * price - discount + tax;

describe('Invoice line-item calculation', () => {
  it('calculates a simple line total correctly', () => {
    expect(calcLineTotal(2, 500, 0, 0)).toBe(1000);
  });

  it('applies discount correctly', () => {
    expect(calcLineTotal(3, 100, 50, 0)).toBe(250);
  });

  it('adds tax correctly', () => {
    expect(calcLineTotal(1, 100, 0, 18)).toBe(118);
  });

  it('handles discount + tax together', () => {
    expect(calcLineTotal(2, 200, 50, 36)).toBe(386); // 400 - 50 + 36
  });

  it('returns 0 for zero quantity', () => {
    expect(calcLineTotal(0, 100, 0, 0)).toBe(0);
  });
});

// ─── Grand-total calculation ───────────────────────────────────────────────

const calcGrandTotal = (items, invoiceDiscount) => {
  const subTotal = items.reduce(
    (sum, i) => sum + calcLineTotal(i.quantity, i.unitPrice, i.discount, i.tax),
    0
  );
  return Math.max(0, subTotal - invoiceDiscount);
};

describe('Invoice grand-total calculation', () => {
  it('sums multiple line items', () => {
    const items = [
      { quantity: 2, unitPrice: 500, discount: 0, tax: 0 },
      { quantity: 1, unitPrice: 300, discount: 0, tax: 0 },
    ];
    expect(calcGrandTotal(items, 0)).toBe(1300);
  });

  it('applies invoice-level discount', () => {
    const items = [{ quantity: 1, unitPrice: 1000, discount: 0, tax: 0 }];
    expect(calcGrandTotal(items, 100)).toBe(900);
  });

  it('grand total never goes below 0', () => {
    const items = [{ quantity: 1, unitPrice: 50, discount: 0, tax: 0 }];
    expect(calcGrandTotal(items, 200)).toBe(0);
  });

  it('returns 0 for empty items list', () => {
    expect(calcGrandTotal([], 0)).toBe(0);
  });
});

// ─── Payment validation logic ─────────────────────────────────────────────

const validatePayment = (amount, outstandingBalance) => {
  const errs = [];
  if (!amount || isNaN(amount) || amount <= 0) errs.push('Payment amount must be positive');
  if (amount > outstandingBalance) errs.push('Amount cannot exceed outstanding balance');
  return errs;
};

describe('Payment validation', () => {
  it('rejects zero payment', () => {
    expect(validatePayment(0, 500)).toContain('Payment amount must be positive');
  });

  it('rejects negative payment', () => {
    expect(validatePayment(-100, 500)).toContain('Payment amount must be positive');
  });

  it('rejects overpayment', () => {
    expect(validatePayment(600, 500)).toContain('Amount cannot exceed outstanding balance');
  });

  it('accepts exact outstanding balance', () => {
    expect(validatePayment(500, 500)).toHaveLength(0);
  });

  it('accepts partial payment', () => {
    expect(validatePayment(200, 500)).toHaveLength(0);
  });
});

// ─── Outstanding balance calculation ──────────────────────────────────────

const calcOutstanding = (grandTotal, payments) => {
  const totalPaid = payments.reduce((sum, p) => sum + p.paymentAmount, 0);
  return Math.max(0, grandTotal - totalPaid);
};

describe('Outstanding balance calculation', () => {
  it('equals grand total when no payments made', () => {
    expect(calcOutstanding(1000, [])).toBe(1000);
  });

  it('reduces by each payment', () => {
    expect(calcOutstanding(1000, [{ paymentAmount: 400 }, { paymentAmount: 200 }])).toBe(400);
  });

  it('is 0 when fully paid', () => {
    expect(calcOutstanding(1000, [{ paymentAmount: 1000 }])).toBe(0);
  });

  it('never goes negative', () => {
    expect(calcOutstanding(1000, [{ paymentAmount: 1200 }])).toBe(0);
  });
});

// ─── Status auto-update logic ─────────────────────────────────────────────

const deriveStatus = (currentStatus, outstandingBalance, dueDate) => {
  if (currentStatus === 'Cancelled') return 'Cancelled';
  if (outstandingBalance === 0) return 'Paid';
  const isOverdue = new Date(dueDate) < new Date() && outstandingBalance > 0;
  if (isOverdue) return 'Overdue';
  return outstandingBalance > 0 ? 'PartiallyPaid' : currentStatus;
};

describe('Invoice status auto-update', () => {
  it('sets Paid when outstanding is 0', () => {
    expect(deriveStatus('Sent', 0, '2099-12-31')).toBe('Paid');
  });

  it('keeps Cancelled status unchanged', () => {
    expect(deriveStatus('Cancelled', 500, '2020-01-01')).toBe('Cancelled');
  });

  it('sets Overdue when past due date with balance', () => {
    expect(deriveStatus('Sent', 500, '2020-01-01')).toBe('Overdue');
  });

  it('sets PartiallyPaid when partial payment made and not overdue', () => {
    expect(deriveStatus('Sent', 200, '2099-12-31')).toBe('PartiallyPaid');
  });
});

// ─── DSO calculation ──────────────────────────────────────────────────────

const calcDso = (totalOutstanding, totalCreditSales, days) => {
  if (!totalCreditSales || totalCreditSales === 0) return 0;
  return (totalOutstanding / totalCreditSales) * days;
};

describe('DSO (Days Sales Outstanding) calculation', () => {
  it('calculates DSO correctly', () => {
    expect(calcDso(30000, 90000, 90)).toBeCloseTo(30, 1);
  });

  it('returns 0 when no credit sales', () => {
    expect(calcDso(1000, 0, 30)).toBe(0);
  });

  it('returns 0 when no outstanding balance', () => {
    expect(calcDso(0, 90000, 90)).toBe(0);
  });
});

// ─── Invoice number format validation ────────────────────────────────────

const isValidInvoiceNumber = (num) => /^INV-\d{4}-\d{4}$/.test(num);

describe('Invoice number format validation', () => {
  it('accepts valid format INV-YYYY-0001', () => {
    expect(isValidInvoiceNumber('INV-2024-0001')).toBe(true);
  });

  it('accepts another valid format', () => {
    expect(isValidInvoiceNumber('INV-2025-0099')).toBe(true);
  });

  it('rejects invalid format', () => {
    expect(isValidInvoiceNumber('INVOICE-001')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidInvoiceNumber('')).toBe(false);
  });
});

// ─── Date validation ──────────────────────────────────────────────────────

const isDueDateValid = (invoiceDate, dueDate) =>
  new Date(dueDate) > new Date(invoiceDate);

describe('Invoice date validation', () => {
  it('rejects due date same as invoice date', () => {
    expect(isDueDateValid('2024-01-01', '2024-01-01')).toBe(false);
  });

  it('rejects due date before invoice date', () => {
    expect(isDueDateValid('2024-01-10', '2024-01-05')).toBe(false);
  });

  it('accepts due date after invoice date', () => {
    expect(isDueDateValid('2024-01-01', '2024-02-01')).toBe(true);
  });
});

// ─── StatusBadge component ─────────────────────────────────────────────────

import StatusBadge from '../components/Shared/StatusBadge';

describe('StatusBadge component', () => {
  it('renders Paid badge', () => {
    render(<StatusBadge status="Paid" />);
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('renders Overdue badge', () => {
    render(<StatusBadge status="Overdue" />);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('renders PartiallyPaid as Partial', () => {
    render(<StatusBadge status="PartiallyPaid" />);
    expect(screen.getByText('Partial')).toBeInTheDocument();
  });

  it('applies correct CSS class for Paid', () => {
    const { container } = render(<StatusBadge status="Paid" />);
    expect(container.firstChild).toHaveClass('badge-paid');
  });

  it('applies correct CSS class for Overdue', () => {
    const { container } = render(<StatusBadge status="Overdue" />);
    expect(container.firstChild).toHaveClass('badge-overdue');
  });
});
