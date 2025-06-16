using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using schiessmeister_csharp.API.Extensions;
using schiessmeister_csharp.Domain.Models;
using schiessmeister_csharp.Domain.Repositories;

namespace schiessmeister_csharp.API.Controllers;

[ApiController]
[Route("api/disciplines")]
[Authorize(Roles = "User")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public class DisciplineController : ControllerBase {
    private readonly IDisciplineRepository _disciplines;

    public DisciplineController(IDisciplineRepository disciplines) {
        _disciplines = disciplines;
    }

    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<Competition>> UpdateDiscipline(int id, Discipline newDiscipline) {
        var discipline = await _disciplines.FindByIdWithCompOrgAsync(id);

        if (discipline == null)
            return NotFound();

        if (User.GetUserId() != discipline.Competition!.Organizer!.OwnerId)
            return Forbid();

        if (newDiscipline.CompetitionId != discipline.CompetitionId) {
            return BadRequest("Cannot change the competition of a discipline.");
        }

        newDiscipline.Id = id;
        return Ok(await _disciplines.UpdateAsync(newDiscipline));
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteDiscipline(int id) {
        var discipline = await _disciplines.FindByIdWithCompOrgAsync(id);

        if (discipline == null)
            return NotFound();

        if (User.GetUserId() != discipline.Competition!.Organizer!.OwnerId)
            return Forbid();

        await _disciplines.DeleteAsync(discipline);

        return NoContent();
    }
}