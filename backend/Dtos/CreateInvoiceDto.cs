using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

public class CreateInvoiceDto
{
    [Required]
    public int CustomerId { get; set; }

    [Required]
    public DateTime InvoiceDate { get; set; }

    [Required]
    public DateTime DueDate { get; set; }

    public decimal DiscountAmount { get; set; }

    public List<CreateLineItemDto> LineItems { get; set; } = new List<CreateLineItemDto>();

    // Note: InvoiceNumber is auto-generated and should not be provided in create request
}

public class CreateLineItemDto
{
    [Required]
    public string Description { get; set; }

    [Required]
    public decimal Quantity { get; set; }

    [Required]
    public decimal UnitPrice { get; set; }

    public decimal Discount { get; set; } = 0;

    public decimal Tax { get; set; } = 0;
}