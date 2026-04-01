using System.ComponentModel.DataAnnotations;

public class CreateInvoiceDto
{
    [Required]
    public int CustomerId { get; set; }

    [Required]
    public DateTime InvoiceDate { get; set; }

    [Required]
    public DateTime DueDate { get; set; }

    public decimal DiscountAmount { get; set; }
}