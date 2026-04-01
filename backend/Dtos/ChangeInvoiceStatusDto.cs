using System.ComponentModel.DataAnnotations;

public class ChangeInvoiceStatusDto
{
    [Required]
    public required string Status { get; set; }
}
