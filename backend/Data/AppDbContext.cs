using Microsoft.EntityFrameworkCore;

using INVOICEMANAGEMENT.Models;

namespace INVOICEMANAGEMENT.Data;

public class AppDbContext : DbContext
{
    //This constructor is required for Dependency Injection and EF Core to work properly
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    //A bridge between C# code and database table
    public DbSet<User> Users { get; set; }
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<InvoiceLineItem> InvoiceLineItems { get; set; }
    public DbSet<Payment> Payments { get; set; }
}