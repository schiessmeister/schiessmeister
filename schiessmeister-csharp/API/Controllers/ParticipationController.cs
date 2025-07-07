using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using schiessmeister_csharp.API.Extensions;
using schiessmeister_csharp.Domain.Models;
using schiessmeister_csharp.Domain.Repositories;

namespace schiessmeister_csharp.API.Controllers;

[ApiController]
[Route("api/participations")]
[Authorize(Roles = "User")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public class ParticipationController : ControllerBase {
    private readonly IParticipationRepository _participation;

    public ParticipationController(IParticipationRepository participation) {
        _participation = participation;
    }

    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<Competition>> UpdateParticipation(int id, Participation newParticipation) {
        var participation = await _participation.FindByIdWithCompOrgRecDisAsync(id);

        if (participation == null)
            return NotFound();

        // Forbid if not either owner of the org of the competition or a recorder of the competition.
        if (!((int[])[
            participation.Competition!.Organizer!.OwnerId,
            ..participation.Competition.Recorders.Select(r => r.Id).ToArray()
        ]).Contains(User.GetUserId()))
            return Forbid();

        if (newParticipation.CompetitionId != participation.CompetitionId)
            return BadRequest("Cannot change the competition of a participation.");

        if (newParticipation.ShooterId != participation.ShooterId)
            return BadRequest("Cannot change the shooter of a participation.");

        if (participation.Discipline?.CompetitionId != participation.CompetitionId)
            return BadRequest("A participation can only have a discipline of the attended competition.");

        if (participation.ShooterId == participation.RecorderId)
            return BadRequest("The shooter is not allowed to record himself.");
        
        participation.ShooterClass = newParticipation.ShooterClass;
        participation.PositionNb = newParticipation.PositionNb;
        participation.Result = newParticipation.Result;
        participation.Team = newParticipation.Team;
        participation.DqStatus = newParticipation.DqStatus;
        participation.DisciplineId = newParticipation.DisciplineId;
        participation.RecorderId = newParticipation.RecorderId;
        participation.ParticipationGroupId = newParticipation.ParticipationGroupId;
        
        return Ok(await _participation.UpdateAsync(participation));
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteParticipation(int id) {
        var participation = await _participation.FindByIdWithCompOrgAsync(id);

        if (participation == null)
            return NotFound();

        if (User.GetUserId() != participation.Competition!.Organizer!.OwnerId)
            return Forbid();

        await _participation.DeleteAsync(participation);

        return NoContent();
    }
}