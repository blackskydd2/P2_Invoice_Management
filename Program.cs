using INVOICEMANAGEMENT.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using INVOICEMANAGEMENT.Services.Commands;
using INVOICEMANAGEMENT.Services.Queries;
using INVOICEMANAGEMENT.Services;
using Microsoft.Extensions.Caching.StackExchangeRedis;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container

// 0. Add Caching (Memory + Redis with Fallback)
builder.Services.AddMemoryCache();

try
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = builder.Configuration.GetConnectionString("Redis");
        options.ConfigurationOptions = StackExchange.Redis.ConfigurationOptions.Parse(builder.Configuration.GetConnectionString("Redis") + ",connectRetry=3,connectTimeout=5000");
    });
    Console.WriteLine("Redis caching enabled");
}
catch (Exception ex)
{
    Console.WriteLine($"Redis connection failed: {ex.Message}");
    Console.WriteLine("Application will use memory cache fallback...");
}

// 1. Add Controllers (IMPORTANT)
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// 2. Register DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("InvoiceConnectionWithDb")));

// 3. Swagger (for testing)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// 4. CQRS Services
builder.Services.AddScoped<InvoiceCommandService>();
builder.Services.AddScoped<InvoiceQueryService>();
builder.Services.AddScoped<CachedInvoiceCommandService>();
builder.Services.AddScoped<CachedInvoiceQueryService>();

// 5. Cache Service
builder.Services.AddScoped<ICacheService, FallbackCacheService>();

// 6. Auth Service
builder.Services.AddScoped<AuthService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var key = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]);

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key)
        };
    });

var app = builder.Build();
// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

//Auth middleware
app.UseAuthentication();
app.UseAuthorization();

// Map Controllers
app.MapControllers();

app.Run();