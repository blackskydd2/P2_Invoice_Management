using INVOICEMANAGEMENT.Models;
using Microsoft.EntityFrameworkCore;

namespace INVOICEMANAGEMENT.Services.Commands;

public class CachedInvoiceCommandService : IInvoiceCommandService
{
    private readonly InvoiceCommandService _baseCommandService;
    private readonly ICacheService _cacheService;

    public CachedInvoiceCommandService(InvoiceCommandService baseCommandService, ICacheService cacheService)
    {
        _baseCommandService = baseCommandService;
        _cacheService = cacheService;
    }

    public async Task<Invoice> CreateInvoiceAsync(CreateInvoiceDto dto)
    {
        // Invalidate relevant cache entries
        await _cacheService.RemoveAsync("invoices:all");
        await _cacheService.RemoveAsync("summary:invoices");
        await _cacheService.RemoveAsync("totals:outstanding");

        var result = await _baseCommandService.CreateInvoiceAsync(dto);
        
        // Cache the new invoice
        await _cacheService.SetAsync($"invoice:{result.InvoiceId}", result, TimeSpan.FromMinutes(30));
        
        return result;
    }

    public async Task<Invoice> AddLineItemAsync(int invoiceId, AddLineItemDto dto)
    {
        var result = await _baseCommandService.AddLineItemAsync(invoiceId, dto);
        
        // Invalidate cache entries for this invoice and related data
        await _cacheService.RemoveAsync($"invoice:{invoiceId}");
        await _cacheService.RemoveAsync($"invoice:{invoiceId}:lineitems");
        await _cacheService.RemoveAsync($"invoice:{invoiceId}:payments");
        await _cacheService.RemoveAsync("invoices:all");
        await _cacheService.RemoveAsync("summary:invoices");
        await _cacheService.RemoveAsync("totals:outstanding");
        
        // Cache the updated invoice
        await _cacheService.SetAsync($"invoice:{invoiceId}", result, TimeSpan.FromMinutes(30));
        
        return result;
    }

    public async Task<Invoice> AddPaymentAsync(int invoiceId, AddPaymentDto dto)
    {
        var result = await _baseCommandService.AddPaymentAsync(invoiceId, dto);
        
        // Invalidate cache entries for this invoice and related data
        await _cacheService.RemoveAsync($"invoice:{invoiceId}");
        await _cacheService.RemoveAsync($"invoice:{invoiceId}:lineitems");
        await _cacheService.RemoveAsync($"invoice:{invoiceId}:payments");
        await _cacheService.RemoveAsync("invoices:all");
        await _cacheService.RemoveAsync("summary:invoices");
        await _cacheService.RemoveAsync("totals:outstanding");
        
        // Cache the updated invoice
        await _cacheService.SetAsync($"invoice:{invoiceId}", result, TimeSpan.FromMinutes(30));
        
        return result;
    }

    public async Task DeleteInvoiceAsync(int invoiceId)
    {
        await _baseCommandService.DeleteInvoiceAsync(invoiceId);
        
        // Invalidate all cache entries related to this invoice
        await _cacheService.RemoveAsync($"invoice:{invoiceId}");
        await _cacheService.RemoveAsync($"invoice:{invoiceId}:lineitems");
        await _cacheService.RemoveAsync($"invoice:{invoiceId}:payments");
        await _cacheService.RemoveAsync("invoices:all");
        await _cacheService.RemoveAsync("summary:invoices");
        await _cacheService.RemoveAsync("totals:outstanding");
    }
}

// Interface for the base command service
public interface IInvoiceCommandService
{
    Task<Invoice> CreateInvoiceAsync(CreateInvoiceDto dto);
    Task<Invoice> AddLineItemAsync(int invoiceId, AddLineItemDto dto);
    Task<Invoice> AddPaymentAsync(int invoiceId, AddPaymentDto dto);
    Task DeleteInvoiceAsync(int invoiceId);
}
