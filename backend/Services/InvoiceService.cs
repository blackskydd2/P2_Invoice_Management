using INVOICEMANAGEMENT.Data;
using INVOICEMANAGEMENT.Models;
using Microsoft.EntityFrameworkCore;

public class InvoiceService
{
    private readonly AppDbContext _context;

    public InvoiceService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Invoice> CreateInvoiceAsync(CreateInvoiceDto dto)
    {
        // 1. Validate Dates
        if (dto.DueDate <= dto.InvoiceDate)
        {
            throw new Exception("DueDate must be greater than InvoiceDate");
        }

        // 2. Generate Invoice Number
        var year = DateTime.Now.Year;
        var count = _context.Invoices.Count() + 1;
        var invoiceNumber = $"INV-{year}-{count:D4}";

        // 3. Create Invoice Object
        var invoice = new Invoice
        {
            InvoiceNumber = invoiceNumber,
            CustomerId = dto.CustomerId,
            InvoiceDate = dto.InvoiceDate,
            DueDate = dto.DueDate,
            Status = "Draft",
            SubTotal = 0,
            TaxAmount = 0,
            DiscountAmount = dto.DiscountAmount,
            GrandTotal = 0,
            OutstandingBalance = 0,
            CreatedDate = DateTime.UtcNow
        };

        // 4. Save to DB
        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        return invoice;
    }

    public async Task<Invoice> AddLineItemAsync(int invoiceId, AddLineItemDto dto)
    {
        // 1. Get Invoice
        var invoice = await _context.Invoices
            .Include(i => i.LineItems)
            .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);

        if (invoice == null)
            throw new Exception("Invoice not found");

        // 2. Restriction: Cannot modify paid invoice
        if (invoice.Status == "Paid")
            throw new Exception("Cannot modify a paid invoice");

        // 3. Calculate LineTotal
        var lineTotal = (dto.Quantity * dto.UnitPrice) - dto.Discount + dto.Tax;

        // 4. Create Line Item
        var lineItem = new InvoiceLineItem
        {
            InvoiceId = invoiceId,
            Description = dto.Description,
            Quantity = dto.Quantity,
            UnitPrice = dto.UnitPrice,
            Discount = dto.Discount,
            Tax = dto.Tax,
            LineTotal = lineTotal,
            Invoice = invoice
        };

        if (dto.Discount < 0)
        {
            throw new Exception("Line item discount cannot be negative");
        }

        // 5. Add to DB
        _context.InvoiceLineItems.Add(lineItem);

        // 6. Update Invoice Calculations

        // Update subtotal
        invoice.SubTotal += lineTotal;
 
        // VALIDATION (IMPORTANT)
        if (invoice.DiscountAmount > invoice.SubTotal)
        {
            throw new Exception("Discount cannot exceed SubTotal");
        }

        // Safe calculation
        invoice.GrandTotal = invoice.SubTotal - invoice.DiscountAmount;

        // Ensure non-negative
        if (invoice.GrandTotal < 0)
        {
            throw new Exception("GrandTotal cannot be negative");
        }

        invoice.OutstandingBalance = invoice.GrandTotal;

        // 7. Save
        await _context.SaveChangesAsync();

        return invoice;
    }


    public async Task<Invoice> AddPaymentAsync(int invoiceId, AddPaymentDto dto)
    {
        // Start Transaction
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // 1. Get Invoice
            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);

            if (invoice == null)
                throw new Exception("Invoice not found");

            // 2. Validation
            if (dto.PaymentAmount <= 0)
                throw new Exception("Payment must be greater than zero");

            if (dto.PaymentAmount > invoice.OutstandingBalance)
                throw new Exception("Payment exceeds outstanding balance");

            // 3. Create Payment
            var payment = new Payment
            {
                InvoiceId = invoiceId,
                PaymentAmount = dto.PaymentAmount,
                PaymentDate = dto.PaymentDate,
                PaymentMethod = dto.PaymentMethod,
                ReferenceNumber = dto.ReferenceNumber,
                ReceivedDate = DateTime.Now,
                Invoice = invoice
            };

            _context.Payments.Add(payment);

            // 4. Update Invoice
            invoice.OutstandingBalance -= dto.PaymentAmount;

            if (invoice.OutstandingBalance == 0)
                invoice.Status = "Paid";
            else
                invoice.Status = "PartiallyPaid";

            // 5. Save Changes
            await _context.SaveChangesAsync();

            // 6. Commit Transaction
            await transaction.CommitAsync();

            return invoice;
        }
        catch
        {
            // 7. Rollback if error
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task DeleteInvoiceAsync(int invoiceId)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);

        if (invoice == null)
            throw new Exception("Invoice not found");

        if (invoice.Payments.Any())
            throw new Exception("Cannot delete invoice with existing payments");

        _context.Invoices.Remove(invoice);
        await _context.SaveChangesAsync();
    }
}