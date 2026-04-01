using System.ComponentModel.DataAnnotations;
using INVOICEMANAGEMENT.Validation;

namespace INVOICEMANAGEMENT.Models;
public class Invoice
{
    [Key]
    public int InvoiceId { get; set; }

    [Required]
    [InvoiceNumber]
    public required string InvoiceNumber { get; set; }

    [Required]
    public int CustomerId { get; set; }

    [Required]
    public DateTime InvoiceDate { get; set; }

    [Required]
    public DateTime DueDate { get; set; }

    [Required]
    public required string Status { get; set; } 

    public decimal SubTotal { get; set; }

    public decimal TaxAmount { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal GrandTotal { get; set; }

    public decimal OutstandingBalance { get; set; }

    public DateTime CreatedDate { get; set; }

    // Navigation Properties 
    public ICollection<InvoiceLineItem> LineItems { get; set; } = new List<InvoiceLineItem>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}