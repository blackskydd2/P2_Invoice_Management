using System.ComponentModel.DataAnnotations;

public class AddPaymentDto
{
    [Required]
    public decimal PaymentAmount { get; set; }

    [Required]
    public DateTime PaymentDate { get; set; }

    [Required]
    public required string PaymentMethod { get; set; }

    [Required]
    public required string ReferenceNumber { get; set; }
}
