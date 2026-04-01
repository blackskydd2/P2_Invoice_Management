using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace INVOICEMANAGEMENT.Models;
public class InvoiceLineItem
{
    [Key]
    public int LineItemId { get; set; }

    [Required]
    public int InvoiceId { get; set; }

    [Required]
    public required string Description { get; set; }

    [Required]
    public int Quantity { get; set; }

    [Required]
    public decimal UnitPrice { get; set; }

    public decimal Discount { get; set; }

    public decimal Tax { get; set; }

    public decimal LineTotal { get; set; }

    // Navigation Property
    [ForeignKey("InvoiceId")]
    public required Invoice Invoice { get; set; }
}