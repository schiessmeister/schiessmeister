using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using schiessmeister_csharp.API.Extensions;
using schiessmeister_csharp.Domain.Models;
using schiessmeister_csharp.Domain.Repositories;

namespace schiessmeister_csharp.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "User")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public class AppUserController : ControllerBase {
    private readonly IAppUserRepository _users;

    public AppUserController(IAppUserRepository users) {
        _users = users;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AppUser>>> GetUsers([FromQuery] string? searchTerm = null) {
        return Ok(await _users.SearchAsync(searchTerm));
    }

    [HttpGet("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AppUser>> GetUser(int id) {
        int currentUserId = User.GetUserId();
        if (currentUserId != id)
            return Forbid();

        var user = await _users.FindByIdAsync(id);
        if (user == null)
            return NotFound();

        return Ok(user);
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AppUser>> DeleteUser(int id) {
        int currentUserId = User.GetUserId();
        if (currentUserId != id)
            return Forbid();

        var user = await _users.FindByIdAsync(id);
        if (user == null)
            return NotFound();

        await _users.DeleteAsync(user);

        return NoContent();
    }

    [HttpGet("{id}/owned-organizations")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<List<Organization>>> GetOwnedOrganizations(int id) {
        int currentUserId = User.GetUserId();
        if (currentUserId != id)
            return Forbid();

        var user = await _users.FindByIdWithOrgsAsync(id);
        if (user == null)
            return NotFound();

        return Ok(user.OwnedOrganizations);
    }

    [HttpGet("{id}/recorded-competitions")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<List<Organization>>> GetRecordedCompetitions(int id) {
        int currentUserId = User.GetUserId();
        if (currentUserId != id)
            return Forbid();

        var user = await _users.FindByIdWithRecordedCompsAsync(id);
        if (user == null)
            return NotFound();

        return Ok(user.RecordedCompetitions);
    }
}