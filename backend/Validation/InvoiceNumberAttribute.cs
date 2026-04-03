using System.ComponentModel.DataAnnotations;

namespace INVOICEMANAGEMENT.Validation;

public class InvoiceNumberAttribute : ValidationAttribute
{
    private const string InvoiceNumberPattern = @"^INV-\d{4}-\d{4}$";

    public override string FormatErrorMessage(string name)
    {
        return "Invoice number must be in format INV-YYYY-NNNN (e.g., INV-2024-0001)";
    }

    protected override ValidationResult IsValid(object value, ValidationContext validationContext)
    {
        if (value == null)
        {
            return ValidationResult.Success; // Null values are handled by [Required] attribute
        }

        if (value is string invoiceNumber)
        {
            if (System.Text.RegularExpressions.Regex.IsMatch(invoiceNumber, InvoiceNumberPattern))
            {
                return ValidationResult.Success;
            }
        }

        return new ValidationResult(FormatErrorMessage(validationContext.DisplayName));
    }
}
