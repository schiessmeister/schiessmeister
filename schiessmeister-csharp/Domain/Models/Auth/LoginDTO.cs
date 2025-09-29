using System.ComponentModel.DataAnnotations;

namespace schiessmeister_csharp.Domain.Models.Auth;

public class LoginDTO {

    [Required(ErrorMessage = "Username is required")]
    public string Username { get; set; }

    [Required(ErrorMessage = "Password is required")]
    public string Password { get; set; }
}