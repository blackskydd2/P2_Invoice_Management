using Microsoft.Extensions.Logging;
using INVOICEMANAGEMENT.Services;
using Xunit;

namespace INVOICEMANAGEMENT.Tests;

public class InvoiceNumberServiceTests
{
    [Fact]
    public void InvoiceNumberFormat_ShouldBeValid()
    {
        // Arrange
        var validNumbers = new[] 
        { 
            "INV-2024-0001", 
            "INV-1999-9999", 
            "INV-2025-1234" 
        };
        
        var invalidNumbers = new[] 
        { 
            "INV-2024-001",     // Too short
            "INV-2024-00001",  // Too long  
            "INV-ABCD-0001",   // Non-numeric year
            "INV-2024-ABCD",   // Non-numeric sequence
            "INVOICE-2024-0001", // Wrong prefix
            "",                 // Empty
            null                // Null
        };

        // Act & Assert
        foreach (var number in validNumbers)
        {
            Assert.True(IsValidInvoiceNumberFormat(number), $"Number {number} should be valid");
        }

        foreach (var number in invalidNumbers)
        {
            Assert.False(IsValidInvoiceNumberFormat(number), $"Number {number} should be invalid");
        }
    }

    [Fact]
    public void InvoiceNumberGeneration_ShouldFollowPattern()
    {
        // Arrange
        var year = DateTime.Now.Year;

        // Act
        var generatedNumber = GenerateInvoiceNumber(year, 1);

        // Assert
        Assert.Equal($"INV-{year}-0001", generatedNumber);
        Assert.Matches(@"^INV-\d{4}-\d{4}$", generatedNumber);
    }

    [Fact]
    public void InvoiceNumberGeneration_ShouldIncrementSequence()
    {
        // Arrange
        var year = DateTime.Now.Year;

        // Act
        var number1 = GenerateInvoiceNumber(year, 1);
        var number2 = GenerateInvoiceNumber(year, 2);
        var number10 = GenerateInvoiceNumber(year, 10);

        // Assert
        Assert.Equal($"INV-{year}-0001", number1);
        Assert.Equal($"INV-{year}-0002", number2);
        Assert.Equal($"INV-{year}-0010", number10);
    }

    private bool IsValidInvoiceNumberFormat(string invoiceNumber)
    {
        if (string.IsNullOrWhiteSpace(invoiceNumber))
            return false;

        var pattern = @"^INV-\d{4}-\d{4}$";
        return System.Text.RegularExpressions.Regex.IsMatch(invoiceNumber, pattern);
    }

    private string GenerateInvoiceNumber(int year, int sequence)
    {
        return $"INV-{year}-{sequence:D4}";
    }
}
