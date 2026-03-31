using System.ComponentModel.DataAnnotations;

public class RegisterUserDto
{
    [Required]
    public string Username { get; set; }

    [Required]
    [MinLength(6)]
    public string Password { get; set; }

    [Required]
    public string Role { get; set; }
}
