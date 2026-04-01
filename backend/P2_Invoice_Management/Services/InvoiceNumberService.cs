using INVOICEMANAGEMENT.Data;
using Microsoft.EntityFrameworkCore;

namespace INVOICEMANAGEMENT.Services;

public interface IInvoiceNumberService
{
    Task<string> GenerateUniqueInvoiceNumberAsync();
    Task<bool> IsValidInvoiceNumberFormatAsync(string invoiceNumber);
    Task<bool> InvoiceNumberExistsAsync(string invoiceNumber);
}

public class InvoiceNumberService : IInvoiceNumberService
{
    private readonly AppDbContext _context;
    private readonly ILogger<InvoiceNumberService> _logger;

    public InvoiceNumberService(AppDbContext context, ILogger<InvoiceNumberService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<string> GenerateUniqueInvoiceNumberAsync()
    {
        const int maxRetries = 5;
        var year = DateTime.Now.Year;
        
        for (int attempt = 0; attempt < maxRetries; attempt++)
        {
            // Get the highest invoice number for current year
            var lastInvoiceNumber = await _context.Invoices
                .Where(i => i.InvoiceNumber.StartsWith($"INV-{year}-"))
                .OrderByDescending(i => i.InvoiceNumber)
                .Select(i => i.InvoiceNumber)
                .FirstOrDefaultAsync();

            int nextSequence = 1;
            
            if (!string.IsNullOrEmpty(lastInvoiceNumber))
            {
                // Extract sequence number from last invoice (e.g., INV-2024-0001 -> 1)
                var parts = lastInvoiceNumber.Split('-');
                if (parts.Length == 3 && int.TryParse(parts[2], out int lastSequence))
                {
                    nextSequence = lastSequence + 1;
                }
            }

            var newInvoiceNumber = $"INV-{year}-{nextSequence:D4}";

            // Double-check this number doesn't exist (handle concurrency)
            if (!await InvoiceNumberExistsAsync(newInvoiceNumber))
            {
                _logger.LogInformation($"Generated invoice number: {newInvoiceNumber}");
                return newInvoiceNumber;
            }

            _logger.LogWarning($"Invoice number {newInvoiceNumber} already exists, retrying... Attempt {attempt + 1}");
        }

        throw new InvalidOperationException($"Failed to generate unique invoice number after {maxRetries} attempts");
    }

    public async Task<bool> IsValidInvoiceNumberFormatAsync(string invoiceNumber)
    {
        if (string.IsNullOrWhiteSpace(invoiceNumber))
            return false;

        // Must match format: INV-YYYY-NNNN where NNNN is 4 digits
        var pattern = @"^INV-\d{4}-\d{4}$";
        return System.Text.RegularExpressions.Regex.IsMatch(invoiceNumber, pattern);
    }

    public async Task<bool> InvoiceNumberExistsAsync(string invoiceNumber)
    {
        return await _context.Invoices
            .AnyAsync(i => i.InvoiceNumber == invoiceNumber);
    }
}
