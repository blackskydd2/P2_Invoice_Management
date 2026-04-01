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
            .AsNoTracking()
            .Include(i => i.LineItems)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);
    }

    public async Task<IEnumerable<Invoice>> GetAllInvoicesAsync(int page = 1, int pageSize = 20)
    {
        var safePage = page <= 0 ? 1 : page;
        var safePageSize = pageSize <= 0 ? 20 : Math.Min(pageSize, 100);

        return await _context.Invoices
            .AsNoTracking()
            .Include(i => i.LineItems)
            .Include(i => i.Payments)
            .OrderByDescending(i => i.CreatedDate)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync();
    }

    public async Task<IEnumerable<Invoice>> GetInvoicesByStatusAsync(string status)
    {
        return await _context.Invoices
            .AsNoTracking()
            .Include(i => i.LineItems)
            .Include(i => i.Payments)
            .Where(i => i.Status == status)
            .OrderByDescending(i => i.CreatedDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<Invoice>> GetInvoicesByCustomerIdAsync(int customerId)
    {
        return await _context.Invoices
            .AsNoTracking()
            .Include(i => i.LineItems)
            .Include(i => i.Payments)
            .Where(i => i.CustomerId == customerId)
            .OrderByDescending(i => i.CreatedDate)
            .ToListAsync();
    }

    public async Task<InvoiceLineItem?> GetLineItemByIdAsync(int lineItemId)
    {
        return await _context.InvoiceLineItems
            .AsNoTracking()
            .Include(li => li.Invoice)
            .FirstOrDefaultAsync(li => li.LineItemId == lineItemId);
    }

    public async Task<IEnumerable<InvoiceLineItem>> GetLineItemsByInvoiceIdAsync(int invoiceId)
    {
        return await _context.InvoiceLineItems
            .AsNoTracking()
            .Include(li => li.Invoice)
            .Where(li => li.InvoiceId == invoiceId)
            .ToListAsync();
    }

    public async Task<Payment?> GetPaymentByIdAsync(int paymentId)
    {
        return await _context.Payments
            .AsNoTracking()
            .Include(p => p.Invoice)
            .FirstOrDefaultAsync(p => p.PaymentId == paymentId);
    }

    public async Task<IEnumerable<Payment>> GetPaymentsByInvoiceIdAsync(int invoiceId)
    {
        return await _context.Payments
            .AsNoTracking()
            .Include(p => p.Invoice)
            .Where(p => p.InvoiceId == invoiceId)
            .OrderByDescending(p => p.ReceivedDate)
            .ToListAsync();
    }

    public async Task<decimal> GetTotalOutstandingBalanceAsync()
    {
        return await _context.Invoices
            .AsNoTracking()
            .Where(i => i.Status != "Paid")
            .SumAsync(i => i.OutstandingBalance);
    }

    public async Task<int> GetInvoiceCountByStatusAsync(string status)
    {
        return await _context.Invoices
            .AsNoTracking()
            .CountAsync(i => i.Status == status);
    }

    public async Task<IEnumerable<object>> GetInvoiceSummaryAsync()
    {
        var summary = await _context.Invoices
            .AsNoTracking()
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

    public async Task<object> GetAgingReportAsync()
    {
        var today = DateTime.UtcNow.Date;
        var data = await _context.Invoices
            .AsNoTracking()
            .Where(i => i.OutstandingBalance > 0)
            .Select(i => new { i.DueDate, i.OutstandingBalance })
            .ToListAsync();

        decimal current = 0, days1To30 = 0, days31To60 = 0, days60Plus = 0;
        foreach (var item in data)
        {
            var overdueDays = (today - item.DueDate.Date).Days;
            if (overdueDays <= 0) current += item.OutstandingBalance;
            else if (overdueDays <= 30) days1To30 += item.OutstandingBalance;
            else if (overdueDays <= 60) days31To60 += item.OutstandingBalance;
            else days60Plus += item.OutstandingBalance;
        }

        return new
        {
            current = current,
            oneToThirtyDays = days1To30,
            thirtyOneToSixtyDays = days31To60,
            overSixtyDays = days60Plus
        };
    }

    public async Task<object> GetRevenueSummaryAsync()
    {
        return await _context.Invoices
            .AsNoTracking()
            .GroupBy(i => 1)
            .Select(g => new
            {
                TotalRevenue = g.Sum(x => x.GrandTotal),
                TotalCollected = g.Sum(x => x.GrandTotal - x.OutstandingBalance),
                TotalOutstanding = g.Sum(x => x.OutstandingBalance),
                InvoiceCount = g.Count()
            })
            .FirstOrDefaultAsync() ?? new { TotalRevenue = 0m, TotalCollected = 0m, TotalOutstanding = 0m, InvoiceCount = 0 };
    }

    public async Task<object> GetDsoAsync(int days = 30)
    {
        var totalOutstanding = await _context.Invoices
            .AsNoTracking()
            .SumAsync(i => i.OutstandingBalance);

        var totalCreditSales = await _context.Invoices
            .AsNoTracking()
            .SumAsync(i => i.GrandTotal);

        var dso = totalCreditSales == 0 ? 0 : (totalOutstanding / totalCreditSales) * days;
        return new { Days = days, Dso = dso };
    }

    public async Task<object> GetOutstandingAnalyticsAsync()
    {
        var outstanding = await GetTotalOutstandingBalanceAsync();
        var openInvoiceCount = await _context.Invoices
            .AsNoTracking()
            .CountAsync(i => i.OutstandingBalance > 0);

        return new
        {
            TotalOutstanding = outstanding,
            OpenInvoiceCount = openInvoiceCount
        };
    }
}
