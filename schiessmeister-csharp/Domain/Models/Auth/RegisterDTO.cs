using System.ComponentModel.DataAnnotations;

namespace schiessmeister_csharp.Domain.Models.Auth;

public class RegisterDTO {

    [Required(ErrorMessage = "Username is required")]
    public string Username { get; set; }
    
    [Required(ErrorMessage = "Firstname is required")]
    public string Firstname { get; set; }
    
    [Required(ErrorMessage = "Lastname is required")]
    public string Lastname { get; set; }
    
    [Required(ErrorMessage = "Gender is required")]
    public string Gender { get; set; }


    [Required(ErrorMessage = "Email is required")]
    public string Email { get; set; }

    [Required(ErrorMessage = "Password is required")]
    public string Password { get; set; }
}