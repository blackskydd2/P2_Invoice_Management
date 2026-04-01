using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace INVOICEMANAGEMENT.Models;
public class Payment
{
    [Key]
    public int PaymentId { get; set; }

    [Required]
    public int InvoiceId { get; set; }

    [Required]
    public decimal PaymentAmount { get; set; }

    [Required]
    public DateTime PaymentDate { get; set; }

    [Required]
    public required string PaymentMethod { get; set; }

    public required string ReferenceNumber { get; set; }

    public DateTime ReceivedDate { get; set; }

    // Navigation Property
    [ForeignKey("InvoiceId")]
    public required Invoice Invoice { get; set; }
}