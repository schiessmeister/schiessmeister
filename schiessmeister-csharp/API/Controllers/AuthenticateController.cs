using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using schiessmeister_csharp.Domain.Models.Auth;
using schiessmeister_csharp.Domain.Models;
using schiessmeister_csharp.Domain.Services;

namespace schiessmeister_csharp.API.Controllers;

[ApiController]
[Route("api/authenticate")]
public class AuthenticateController : ControllerBase {
    private readonly UserManager<AppUser> userManager;
    private readonly ITokenService tokenService;
    private readonly ILogger<AuthenticateController> _logger;

    public AuthenticateController(UserManager<AppUser> userManager, IConfiguration _, ITokenService tokenService) {
        this.userManager = userManager;
        this.tokenService = tokenService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<TokenDTO>> Login([FromBody] LoginDTO model) {
        var user = await userManager.FindByNameAsync(model.Username);

        if (user != null && await userManager.CheckPasswordAsync(user, model.Password)) {
            return Ok(await tokenService.CreateTokenAsync(user));
        }

        return Unauthorized();
    }

    [HttpPost("register")]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterDTO model) {
        var userExists = await userManager.FindByNameAsync(model.Username);
        if (userExists != null)
            return BadRequest("User already exists!");

        AppUser user = new AppUser() {
            Email = model.Email,
            SecurityStamp = Guid.NewGuid().ToString(),
            UserName = model.Username,
            Firstname = model.Firstname,
            Lastname = model.Lastname,
            Gender = model.Gender
        };

        IdentityResult result = await userManager.CreateAsync(user, model.Password);

        if (!result.Succeeded) {
            _logger.LogWarning("User creation failed for {Username}: {Errors}",
                model.Username,
                string.Join(", ", result.Errors.Select(e => e.Description)));

            return BadRequest("User creation failed! Please check user details and try again.");
        }

        await userManager.AddToRoleAsync(user, "User");

        return Ok("User created successfully!");
    }
}