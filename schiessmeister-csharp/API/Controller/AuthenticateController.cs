using schiessmeister_csharp.API.Services;
using schiessmeister_csharp.Domain.Models;
using schiessmeister_csharp.Identity;

namespace schiessmeister_csharp.API.Controller;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;

using System.Threading.Tasks;

[Route("api/[controller]")]
[ApiController]
public class AuthenticateController : ControllerBase
{
    private readonly UserManager<ApplicationUser> userManager;
    private readonly IConfiguration configuration;
    private readonly ITokenService tokenService;

    public AuthenticateController(UserManager<ApplicationUser> userManager, IConfiguration configuration, ITokenService tokenService)
    {
        this.userManager = userManager;
        this.configuration = configuration;
        this.tokenService = tokenService;
    }

    [HttpPost]
    [Route("login")]
    public async Task<ActionResult<TokenDTO>> Login([FromBody] LoginDTO model)
    {
        var user = await userManager.FindByNameAsync(model.Username);
        if (user != null && await userManager.CheckPasswordAsync(user, model.Password))
        {
            return Ok(await tokenService.CreateTokenAsync(user));
        }
        return Unauthorized();
    }

    [HttpPost]
    [Route("register")]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterDTO model)
    {
        var userExists = await userManager.FindByNameAsync(model.Username);
        if (userExists != null)
            return StatusCode(StatusCodes.Status400BadRequest, new ResponseDTO { Status = "Error", Message = "User already exists!" });

        ApplicationUser user = new ApplicationUser()
        {
            Email = model.Email,
            SecurityStamp = Guid.NewGuid().ToString(),
            UserName = model.Username
        };
        IdentityResult result = await userManager.CreateAsync(user, model.Password);

        foreach (var er in result.Errors)
        {
            Console.WriteLine(er);
        }
    
        if (!result.Succeeded)
            return StatusCode(StatusCodes.Status400BadRequest, new ResponseDTO { Status = "Error", Message = "User creation failed! Please check user details and try again." });

        await userManager.AddToRoleAsync(user, "User");

        return Ok(new ResponseDTO { Status = "Success", Message = "User created successfully!" });
    }

}
