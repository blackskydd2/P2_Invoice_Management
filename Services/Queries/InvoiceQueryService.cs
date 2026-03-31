using INVOICEMANAGEMENT.Data;
using INVOICEMANAGEMENT.Models;
using Microsoft.EntityFrameworkCore;

namespace INVOICEMANAGEMENT.Services.Queries;

public class InvoiceQueryService : IInvoiceQueryService
{
    private readonly AppDbContext _context;

    public InvoiceQueryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Invoice?> GetInvoiceByIdAsync(int invoiceId)
    {
        return await _context.Invoices
            .Include(i => i.LineItems)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);
    }

    public async Task<IEnumerable<Invoice>> GetAllInvoicesAsync()
    {
        return await _context.Invoices
            .Include(i => i.LineItems)
            .Include(i => i.Payments)
            .OrderByDescending(i => i.CreatedDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<Invoice>> GetInvoicesByStatusAsync(string status)
    {
        return await _context.Invoices
            .Include(i => i.LineItems)
            .Include(i => i.Payments)
            .Where(i => i.Status == status)
            .OrderByDescending(i => i.CreatedDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<Invoice>> GetInvoicesByCustomerIdAsync(int customerId)
    {
        return await _context.Invoices
            .Include(i => i.LineItems)
            .Include(i => i.Payments)
            .Where(i => i.CustomerId == customerId)
            .OrderByDescending(i => i.CreatedDate)
            .ToListAsync();
    }

    public async Task<InvoiceLineItem?> GetLineItemByIdAsync(int lineItemId)
    {
        return await _context.InvoiceLineItems
            .Include(li => li.Invoice)
            .FirstOrDefaultAsync(li => li.LineItemId == lineItemId);
    }

    public async Task<IEnumerable<InvoiceLineItem>> GetLineItemsByInvoiceIdAsync(int invoiceId)
    {
        return await _context.InvoiceLineItems
            .Include(li => li.Invoice)
            .Where(li => li.InvoiceId == invoiceId)
            .ToListAsync();
    }

    public async Task<Payment?> GetPaymentByIdAsync(int paymentId)
    {
        return await _context.Payments
            .Include(p => p.Invoice)
            .FirstOrDefaultAsync(p => p.PaymentId == paymentId);
    }

    public async Task<IEnumerable<Payment>> GetPaymentsByInvoiceIdAsync(int invoiceId)
    {
        return await _context.Payments
            .Include(p => p.Invoice)
            .Where(p => p.InvoiceId == invoiceId)
            .OrderByDescending(p => p.ReceivedDate)
            .ToListAsync();
    }

    public async Task<decimal> GetTotalOutstandingBalanceAsync()
    {
        return await _context.Invoices
            .Where(i => i.Status != "Paid")
            .SumAsync(i => i.OutstandingBalance);
    }

    public async Task<int> GetInvoiceCountByStatusAsync(string status)
    {
        return await _context.Invoices
            .CountAsync(i => i.Status == status);
    }

    public async Task<IEnumerable<object>> GetInvoiceSummaryAsync()
    {
        var summary = await _context.Invoices
            .GroupBy(i => i.Status)
            .Select(g => new
            {
                Status = g.Key,
                Count = g.Count(),
                TotalAmount = g.Sum(i => i.GrandTotal),
                OutstandingBalance = g.Sum(i => i.OutstandingBalance)
            })
            .ToListAsync();

        return summary;
    }
}
