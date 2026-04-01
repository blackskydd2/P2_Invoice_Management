using System.ComponentModel.DataAnnotations;

public class AddLineItemDto
{
    [Required]
    public required string Description { get; set; }

    [Required]
    public int Quantity { get; set; }

    [Required]
    public decimal UnitPrice { get; set; }

    public decimal Discount { get; set; }

    public decimal Tax { get; set; }
}