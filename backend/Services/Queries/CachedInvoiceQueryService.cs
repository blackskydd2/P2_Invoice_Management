using INVOICEMANAGEMENT.Models;
using Microsoft.EntityFrameworkCore;

namespace INVOICEMANAGEMENT.Services.Queries;

public class CachedInvoiceQueryService : IInvoiceQueryService
{
    private readonly InvoiceQueryService _baseQueryService;
    private readonly ICacheService _cacheService;

    public CachedInvoiceQueryService(InvoiceQueryService baseQueryService, ICacheService cacheService)
    {
        _baseQueryService = baseQueryService;
        _cacheService = cacheService;
    }

    public async Task<Invoice?> GetInvoiceByIdAsync(int invoiceId)
    {
        string cacheKey = $"invoice:{invoiceId}";
        var cachedInvoice = await _cacheService.GetAsync<Invoice>(cacheKey);
        
        if (cachedInvoice != null)
            return cachedInvoice;

        var invoice = await _baseQueryService.GetInvoiceByIdAsync(invoiceId);
        if (invoice != null)
        {
            await _cacheService.SetAsync(cacheKey, invoice, TimeSpan.FromMinutes(30));
        }

        return invoice;
    }

    public async Task<IEnumerable<Invoice>> GetAllInvoicesAsync()
    {
        const string cacheKey = "invoices:all";
        var cachedInvoices = await _cacheService.GetAsync<IEnumerable<Invoice>>(cacheKey);
        
        if (cachedInvoices != null)
            return cachedInvoices;

        var invoices = await _baseQueryService.GetAllInvoicesAsync();
        await _cacheService.SetAsync(cacheKey, invoices, TimeSpan.FromMinutes(15));
        
        return invoices;
    }

    public async Task<IEnumerable<Invoice>> GetInvoicesByStatusAsync(string status)
    {
        string cacheKey = $"invoices:status:{status}";
        var cachedInvoices = await _cacheService.GetAsync<IEnumerable<Invoice>>(cacheKey);
        
        if (cachedInvoices != null)
            return cachedInvoices;

        var invoices = await _baseQueryService.GetInvoicesByStatusAsync(status);
        await _cacheService.SetAsync(cacheKey, invoices, TimeSpan.FromMinutes(20));
        
        return invoices;
    }

    public async Task<IEnumerable<Invoice>> GetInvoicesByCustomerIdAsync(int customerId)
    {
        string cacheKey = $"invoices:customer:{customerId}";
        var cachedInvoices = await _cacheService.GetAsync<IEnumerable<Invoice>>(cacheKey);
        
        if (cachedInvoices != null)
            return cachedInvoices;

        var invoices = await _baseQueryService.GetInvoicesByCustomerIdAsync(customerId);
        await _cacheService.SetAsync(cacheKey, invoices, TimeSpan.FromMinutes(20));
        
        return invoices;
    }

    public async Task<InvoiceLineItem?> GetLineItemByIdAsync(int lineItemId)
    {
        string cacheKey = $"lineitem:{lineItemId}";
        var cachedLineItem = await _cacheService.GetAsync<InvoiceLineItem>(cacheKey);
        
        if (cachedLineItem != null)
            return cachedLineItem;

        var lineItem = await _baseQueryService.GetLineItemByIdAsync(lineItemId);
        if (lineItem != null)
        {
            await _cacheService.SetAsync(cacheKey, lineItem, TimeSpan.FromMinutes(30));
        }

        return lineItem;
    }

    public async Task<IEnumerable<InvoiceLineItem>> GetLineItemsByInvoiceIdAsync(int invoiceId)
    {
        string cacheKey = $"invoice:{invoiceId}:lineitems";
        var cachedLineItems = await _cacheService.GetAsync<IEnumerable<InvoiceLineItem>>(cacheKey);
        
        if (cachedLineItems != null)
            return cachedLineItems;

        var lineItems = await _baseQueryService.GetLineItemsByInvoiceIdAsync(invoiceId);
        await _cacheService.SetAsync(cacheKey, lineItems, TimeSpan.FromMinutes(25));
        
        return lineItems;
    }

    public async Task<Payment?> GetPaymentByIdAsync(int paymentId)
    {
        string cacheKey = $"payment:{paymentId}";
        var cachedPayment = await _cacheService.GetAsync<Payment>(cacheKey);
        
        if (cachedPayment != null)
            return cachedPayment;

        var payment = await _baseQueryService.GetPaymentByIdAsync(paymentId);
        if (payment != null)
        {
            await _cacheService.SetAsync(cacheKey, payment, TimeSpan.FromMinutes(30));
        }

        return payment;
    }

    public async Task<IEnumerable<Payment>> GetPaymentsByInvoiceIdAsync(int invoiceId)
    {
        string cacheKey = $"invoice:{invoiceId}:payments";
        var cachedPayments = await _cacheService.GetAsync<IEnumerable<Payment>>(cacheKey);
        
        if (cachedPayments != null)
            return cachedPayments;

        var payments = await _baseQueryService.GetPaymentsByInvoiceIdAsync(invoiceId);
        await _cacheService.SetAsync(cacheKey, payments, TimeSpan.FromMinutes(25));
        
        return payments;
    }

    public async Task<decimal> GetTotalOutstandingBalanceAsync()
    {
        const string cacheKey = "totals:outstanding";
        var cachedTotal = await _cacheService.GetAsync<decimal>(cacheKey);
        
        if (cachedTotal != 0)
            return cachedTotal;

        var total = await _baseQueryService.GetTotalOutstandingBalanceAsync();
        await _cacheService.SetAsync(cacheKey, total, TimeSpan.FromMinutes(10));
        
        return total;
    }

    public async Task<int> GetInvoiceCountByStatusAsync(string status)
    {
        string cacheKey = $"counts:invoices:{status}";
        var cachedCount = await _cacheService.GetAsync<int>(cacheKey);
        
        if (cachedCount != 0)
            return cachedCount;

        var count = await _baseQueryService.GetInvoiceCountByStatusAsync(status);
        await _cacheService.SetAsync(cacheKey, count, TimeSpan.FromMinutes(15));
        
        return count;
    }

    public async Task<IEnumerable<object>> GetInvoiceSummaryAsync()
    {
        const string cacheKey = "summary:invoices";
        var cachedSummary = await _cacheService.GetAsync<IEnumerable<object>>(cacheKey);
        
        if (cachedSummary != null)
            return cachedSummary;

        var summary = await _baseQueryService.GetInvoiceSummaryAsync();
        await _cacheService.SetAsync(cacheKey, summary, TimeSpan.FromMinutes(5));
        
        return summary;
    }
}

// Interface for the base query service
public interface IInvoiceQueryService
{
    Task<Invoice?> GetInvoiceByIdAsync(int invoiceId);
    Task<IEnumerable<Invoice>> GetAllInvoicesAsync();
    Task<IEnumerable<Invoice>> GetInvoicesByStatusAsync(string status);
    Task<IEnumerable<Invoice>> GetInvoicesByCustomerIdAsync(int customerId);
    Task<InvoiceLineItem?> GetLineItemByIdAsync(int lineItemId);
    Task<IEnumerable<InvoiceLineItem>> GetLineItemsByInvoiceIdAsync(int invoiceId);
    Task<Payment?> GetPaymentByIdAsync(int paymentId);
    Task<IEnumerable<Payment>> GetPaymentsByInvoiceIdAsync(int invoiceId);
    Task<decimal> GetTotalOutstandingBalanceAsync();
    Task<int> GetInvoiceCountByStatusAsync(string status);
    Task<IEnumerable<object>> GetInvoiceSummaryAsync();
}
