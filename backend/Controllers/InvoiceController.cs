using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using INVOICEMANAGEMENT.Services.Commands;
using INVOICEMANAGEMENT.Services.Queries;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InvoiceController : ControllerBase
{
    private readonly CachedInvoiceCommandService _commandService;
    private readonly CachedInvoiceQueryService _queryService;

    public InvoiceController(CachedInvoiceCommandService commandService, CachedInvoiceQueryService queryService)
    {
        _commandService = commandService;
        _queryService = queryService;
    }

    // QUERY ENDPOINTS (GET methods)
    [HttpGet]
    public async Task<IActionResult> GetAllInvoices()
    {
        try
        {
            var invoices = await _queryService.GetAllInvoicesAsync();
            return Ok(invoices);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{invoiceId}")]
    public async Task<IActionResult> GetInvoiceById(int invoiceId)
    {
        try
        {
            var invoice = await _queryService.GetInvoiceByIdAsync(invoiceId);
            if (invoice == null)
                return NotFound("Invoice not found");
            return Ok(invoice);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("status/{status}")]
    public async Task<IActionResult> GetInvoicesByStatus(string status)
    {
        try
        {
            var invoices = await _queryService.GetInvoicesByStatusAsync(status);
            return Ok(invoices);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("customer/{customerId}")]
    public async Task<IActionResult> GetInvoicesByCustomerId(int customerId)
    {
        try
        {
            var invoices = await _queryService.GetInvoicesByCustomerIdAsync(customerId);
            return Ok(invoices);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{invoiceId}/items")]
    public async Task<IActionResult> GetLineItemsByInvoiceId(int invoiceId)
    {
        try
        {
            var lineItems = await _queryService.GetLineItemsByInvoiceIdAsync(invoiceId);
            return Ok(lineItems);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{invoiceId}/payments")]
    public async Task<IActionResult> GetPaymentsByInvoiceId(int invoiceId)
    {
        try
        {
            var payments = await _queryService.GetPaymentsByInvoiceIdAsync(invoiceId);
            return Ok(payments);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetInvoiceSummary()
    {
        try
        {
            var summary = await _queryService.GetInvoiceSummaryAsync();
            return Ok(summary);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("outstanding-total")]
    public async Task<IActionResult> GetTotalOutstandingBalance()
    {
        try
        {
            var total = await _queryService.GetTotalOutstandingBalanceAsync();
            return Ok(new { TotalOutstandingBalance = total });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // COMMAND ENDPOINTS (POST, PUT, DELETE methods)
    [Authorize(Roles = "FinanceUser,Admin")]
    [HttpPost]
    public async Task<IActionResult> CreateInvoice(CreateInvoiceDto dto)
    {
        try
        {
            var result = await _commandService.CreateInvoiceAsync(dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{invoiceId}/items")]
    public async Task<IActionResult> AddLineItem(int invoiceId, AddLineItemDto dto)
    {
        try
        {
            var result = await _commandService.AddLineItemAsync(invoiceId, dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [Authorize(Roles = "FinanceUser,Admin")]
    [HttpPost("{invoiceId}/payments")]
    public async Task<IActionResult> AddPayment(int invoiceId, AddPaymentDto dto)
    {
        try
        {
            var result = await _commandService.AddPaymentAsync(invoiceId, dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{invoiceId}")]
    public async Task<IActionResult> DeleteInvoice(int invoiceId)
    {
        try
        {
            await _commandService.DeleteInvoiceAsync(invoiceId);
            return Ok("Invoice deleted successfully");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}