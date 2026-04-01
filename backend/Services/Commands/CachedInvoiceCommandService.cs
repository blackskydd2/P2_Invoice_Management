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
        await _cacheService.RemoveByPrefixAsync("analytics:");

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
        await _cacheService.RemoveByPrefixAsync("analytics:");
        
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
        await _cacheService.RemoveByPrefixAsync("analytics:");
        
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
        await _cacheService.RemoveByPrefixAsync("analytics:");
    }

    public async Task<Invoice> UpdateInvoiceAsync(int invoiceId, UpdateInvoiceDto dto)
    {
        var result = await _baseCommandService.UpdateInvoiceAsync(invoiceId, dto);

        await _cacheService.RemoveAsync($"invoice:{invoiceId}");
        await _cacheService.RemoveAsync("invoices:all");
        await _cacheService.RemoveAsync("summary:invoices");
        await _cacheService.RemoveAsync("totals:outstanding");
        await _cacheService.RemoveByPrefixAsync("analytics:");
        await _cacheService.SetAsync($"invoice:{invoiceId}", result, TimeSpan.FromMinutes(30));
        return result;
    }

    public async Task<Invoice> ChangeInvoiceStatusAsync(int invoiceId, string status)
    {
        var result = await _baseCommandService.ChangeInvoiceStatusAsync(invoiceId, status);

        await _cacheService.RemoveAsync($"invoice:{invoiceId}");
        await _cacheService.RemoveAsync("invoices:all");
        await _cacheService.RemoveAsync("summary:invoices");
        await _cacheService.RemoveAsync("totals:outstanding");
        await _cacheService.RemoveByPrefixAsync("analytics:");
        await _cacheService.SetAsync($"invoice:{invoiceId}", result, TimeSpan.FromMinutes(30));
        return result;
    }

    public async Task<Invoice> UpdateLineItemAsync(int invoiceId, int itemId, UpdateLineItemDto dto)
    {
        var result = await _baseCommandService.UpdateLineItemAsync(invoiceId, itemId, dto);

        await _cacheService.RemoveAsync($"invoice:{invoiceId}");
        await _cacheService.RemoveAsync($"invoice:{invoiceId}:lineitems");
        await _cacheService.RemoveAsync("invoices:all");
        await _cacheService.RemoveAsync("summary:invoices");
        await _cacheService.RemoveAsync("totals:outstanding");
        await _cacheService.RemoveByPrefixAsync("analytics:");
        await _cacheService.SetAsync($"invoice:{invoiceId}", result, TimeSpan.FromMinutes(30));
        return result;
    }

    public async Task<Invoice> DeleteLineItemAsync(int invoiceId, int itemId)
    {
        var result = await _baseCommandService.DeleteLineItemAsync(invoiceId, itemId);

        await _cacheService.RemoveAsync($"invoice:{invoiceId}");
        await _cacheService.RemoveAsync($"invoice:{invoiceId}:lineitems");
        await _cacheService.RemoveAsync("invoices:all");
        await _cacheService.RemoveAsync("summary:invoices");
        await _cacheService.RemoveAsync("totals:outstanding");
        await _cacheService.RemoveByPrefixAsync("analytics:");
        await _cacheService.SetAsync($"invoice:{invoiceId}", result, TimeSpan.FromMinutes(30));
        return result;
    }
}

// Interface for the base command service
public interface IInvoiceCommandService
{
    Task<Invoice> CreateInvoiceAsync(CreateInvoiceDto dto);
    Task<Invoice> UpdateInvoiceAsync(int invoiceId, UpdateInvoiceDto dto);
    Task<Invoice> ChangeInvoiceStatusAsync(int invoiceId, string status);
    Task<Invoice> AddLineItemAsync(int invoiceId, AddLineItemDto dto);
    Task<Invoice> UpdateLineItemAsync(int invoiceId, int itemId, UpdateLineItemDto dto);
    Task<Invoice> DeleteLineItemAsync(int invoiceId, int itemId);
    Task<Invoice> AddPaymentAsync(int invoiceId, AddPaymentDto dto);
    Task DeleteInvoiceAsync(int invoiceId);
}
