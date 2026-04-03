using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using INVOICEMANAGEMENT.Data;
using INVOICEMANAGEMENT.Models;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly AppDbContext _context;

    public UserController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterUserDto dto)
    {
        try
        {
            // Check if user already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == dto.Username);

            if (existingUser != null)
                return BadRequest("Username already exists");

            // Validate role
            var validRoles = new[] { "Admin", "FinanceManager", "FinanceUser", "User" };
            if (!validRoles.Contains(dto.Role))
                return BadRequest("Invalid role. Valid roles: Admin, FinanceManager, FinanceUser, User");

            // HASH PASSWORD HERE
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            // Create new user
            var user = new User
            {
                Username = dto.Username,
                Password = hashedPassword, // hashed password
                Role = dto.Role
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "User created successfully",
                userId = user.Id,
                username = user.Username,
                role = user.Role
            });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        try
        {
            var users = await _context.Users
                .Select(u => new { u.Id, u.Username, u.Role })
                .ToListAsync();

            return Ok(users);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
