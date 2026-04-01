using INVOICEMANAGEMENT.Data;
using INVOICEMANAGEMENT.Models;
using INVOICEMANAGEMENT.Services;
using Microsoft.EntityFrameworkCore;

namespace INVOICEMANAGEMENT.Services.Commands;

public class InvoiceCommandService : IInvoiceCommandService
{
    private readonly AppDbContext _context;
    private readonly IInvoiceNumberService _invoiceNumberService;

    public InvoiceCommandService(AppDbContext context, IInvoiceNumberService invoiceNumberService)
    {
        _context = context;
        _invoiceNumberService = invoiceNumberService;
    }

    public async Task<Invoice> CreateInvoiceAsync(CreateInvoiceDto dto)
    {
        // Start Transaction
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // 1. Validate Dates
            if (dto.DueDate <= dto.InvoiceDate)
            {
                throw new Exception("DueDate must be greater than InvoiceDate");
            }

            // 2. Generate Unique Invoice Number
            var invoiceNumber = await _invoiceNumberService.GenerateUniqueInvoiceNumberAsync();

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

            // 4. Add Line Items if provided
            if (dto.LineItems != null && dto.LineItems.Any())
            {
                foreach (var lineItemDto in dto.LineItems)
                {
                    // Validate line item data
                    if (lineItemDto.Quantity <= 0)
                        throw new Exception("Line item quantity must be greater than 0");
                    
                    if (lineItemDto.UnitPrice < 0)
                        throw new Exception("Line item unit price cannot be negative");

                    // Calculate line total
                    var lineTotal = (lineItemDto.Quantity * lineItemDto.UnitPrice) - lineItemDto.Discount + lineItemDto.Tax;

                    var lineItem = new InvoiceLineItem
                    {
                        Description = lineItemDto.Description,
                        Quantity = (int)lineItemDto.Quantity,
                        UnitPrice = lineItemDto.UnitPrice,
                        Discount = lineItemDto.Discount,
                        Tax = lineItemDto.Tax,
                        LineTotal = lineTotal,
                        Invoice = invoice // Set the navigation property
                    };

                    invoice.LineItems.Add(lineItem);
                    invoice.SubTotal += lineTotal;
                }

                // Calculate totals
                invoice.TaxAmount = invoice.LineItems.Sum(li => li.Tax);
                invoice.GrandTotal = invoice.SubTotal + invoice.TaxAmount - invoice.DiscountAmount;
                invoice.OutstandingBalance = invoice.GrandTotal;
            }

            // 5. Save to DB
            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            // Commit transaction
            await transaction.CommitAsync();

            return invoice;
        }
        catch (Exception)
        {
            // Rollback transaction on error
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<Invoice> AddLineItemAsync(int invoiceId, AddLineItemDto dto)
    {
        // Start Transaction
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
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

            // 8. Commit Transaction
            await transaction.CommitAsync();

            return invoice;
        }
        catch
        {
            // 9. Rollback if error
            await transaction.RollbackAsync();
            throw;
        }
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

    public async Task<Invoice> UpdateInvoiceAsync(int invoiceId, UpdateInvoiceDto dto)
    {
        var invoice = await _context.Invoices
            .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);

        if (invoice == null)
            throw new Exception("Invoice not found");

        if (invoice.Status == "Paid")
            throw new Exception("Cannot modify a paid invoice");

        if (dto.DueDate <= dto.InvoiceDate)
            throw new Exception("DueDate must be greater than InvoiceDate");

        if (dto.DiscountAmount < 0)
            throw new Exception("Discount cannot be negative");

        invoice.CustomerId = dto.CustomerId;
        invoice.InvoiceDate = dto.InvoiceDate;
        invoice.DueDate = dto.DueDate;
        invoice.DiscountAmount = dto.DiscountAmount;
        invoice.GrandTotal = invoice.SubTotal - invoice.DiscountAmount;

        if (invoice.GrandTotal < 0)
            throw new Exception("GrandTotal cannot be negative");

        var totalPayments = await _context.Payments
            .Where(p => p.InvoiceId == invoiceId)
            .SumAsync(p => p.PaymentAmount);

        invoice.OutstandingBalance = invoice.GrandTotal - totalPayments;
        if (invoice.OutstandingBalance < 0)
            throw new Exception("Outstanding balance cannot be negative");

        await _context.SaveChangesAsync();
        return invoice;
    }

    public async Task<Invoice> ChangeInvoiceStatusAsync(int invoiceId, string status)
    {
        var validStatuses = new[] { "Draft", "Sent", "Overdue", "PartiallyPaid", "Paid", "Cancelled" };
        if (!validStatuses.Contains(status))
            throw new Exception("Invalid status");

        var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);
        if (invoice == null)
            throw new Exception("Invoice not found");

        invoice.Status = status;
        await _context.SaveChangesAsync();
        return invoice;
    }

    public async Task<Invoice> UpdateLineItemAsync(int invoiceId, int itemId, UpdateLineItemDto dto)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var invoice = await _context.Invoices
                .Include(i => i.LineItems)
                .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);

            if (invoice == null)
                throw new Exception("Invoice not found");

            if (invoice.Status == "Paid")
                throw new Exception("Cannot modify a paid invoice");

            var lineItem = invoice.LineItems.FirstOrDefault(li => li.LineItemId == itemId);
            if (lineItem == null)
                throw new Exception("Line item not found");

            if (dto.Discount < 0)
                throw new Exception("Line item discount cannot be negative");

            lineItem.Description = dto.Description;
            lineItem.Quantity = dto.Quantity;
            lineItem.UnitPrice = dto.UnitPrice;
            lineItem.Discount = dto.Discount;
            lineItem.Tax = dto.Tax;
            lineItem.LineTotal = (dto.Quantity * dto.UnitPrice) - dto.Discount + dto.Tax;

            invoice.SubTotal = invoice.LineItems.Sum(li => li.LineTotal);
            invoice.GrandTotal = invoice.SubTotal - invoice.DiscountAmount;
            if (invoice.GrandTotal < 0)
                throw new Exception("GrandTotal cannot be negative");

            var totalPayments = await _context.Payments
                .Where(p => p.InvoiceId == invoiceId)
                .SumAsync(p => p.PaymentAmount);
            invoice.OutstandingBalance = invoice.GrandTotal - totalPayments;
            if (invoice.OutstandingBalance < 0)
                throw new Exception("Outstanding balance cannot be negative");

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return invoice;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<Invoice> DeleteLineItemAsync(int invoiceId, int itemId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var invoice = await _context.Invoices
                .Include(i => i.LineItems)
                .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);

            if (invoice == null)
                throw new Exception("Invoice not found");

            if (invoice.Status == "Paid")
                throw new Exception("Cannot modify a paid invoice");

            var lineItem = invoice.LineItems.FirstOrDefault(li => li.LineItemId == itemId);
            if (lineItem == null)
                throw new Exception("Line item not found");

            _context.InvoiceLineItems.Remove(lineItem);

            invoice.SubTotal = invoice.LineItems.Where(li => li.LineItemId != itemId).Sum(li => li.LineTotal);
            invoice.GrandTotal = invoice.SubTotal - invoice.DiscountAmount;
            if (invoice.GrandTotal < 0)
                throw new Exception("GrandTotal cannot be negative");

            var totalPayments = await _context.Payments
                .Where(p => p.InvoiceId == invoiceId)
                .SumAsync(p => p.PaymentAmount);
            invoice.OutstandingBalance = invoice.GrandTotal - totalPayments;
            if (invoice.OutstandingBalance < 0)
                throw new Exception("Outstanding balance cannot be negative");

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return invoice;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
