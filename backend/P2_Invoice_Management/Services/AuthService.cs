using INVOICEMANAGEMENT.Data;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;

public class AuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public string Login(LoginDto dto)
    {
        // 1. Find User by Username
        var user = _context.Users
            .FirstOrDefault(u => u.Username == dto.Username);

        if (user == null)
            throw new Exception("Invalid username or password");

        // 2. Verify Password using BCrypt
        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
            throw new Exception("Invalid username or password");

        // 2. Create Claims
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role)
        };

        // 3. Generate Key
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"])
        );

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // 4. Create Token
        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.Now.AddHours(2),
            signingCredentials: creds
        );

        // 5. Return Token
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}