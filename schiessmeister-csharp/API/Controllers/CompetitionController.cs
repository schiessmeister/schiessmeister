using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using schiessmeister_csharp.API.Extensions;
using schiessmeister_csharp.Domain.Models;
using schiessmeister_csharp.Domain.Repositories;
using schiessmeister_csharp.Domain.Services;

namespace schiessmeister_csharp.API.Controllers;

[ApiController]
[Route("api/competitions")]
public class CompetitionController : ControllerBase {
    private readonly ICompetitionRepository _competitions;
    private readonly IParticipationGroupRepository _participationGroups;
    private readonly IDisciplineRepository _disciplines;
    private readonly ILeaderboardService _leaderboardService;

    public CompetitionController(
        ICompetitionRepository competitions,
        IParticipationGroupRepository participationGroups,
        IDisciplineRepository disciplines,
        ILeaderboardService leaderboardService
    ) {
        _competitions = competitions;
        _participationGroups = participationGroups;
        _disciplines = disciplines;
        _leaderboardService = leaderboardService;
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "User")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<Competition>> GetCompetition(int id) {
        var comp = await _competitions.FindByIdFullTreeAsync(id);

        if (comp == null)
            return NotFound();

        return Ok(comp);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "User")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<Competition>> UpdateCompetition(int id, Competition newComp) {
        var comp = await _competitions.FindByIdWithOrgAsync(id);

        if (comp == null)
            return NotFound();

        if (User.GetUserId() != comp.Organizer!.OwnerId)
            return Forbid();

        if (newComp.OrganizerId != comp.OrganizerId) {
            return BadRequest("Cannot change the organizer of a competition.");
        }

        newComp.Id = id;
        return Ok(await _competitions.UpdateAsync(newComp));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "User")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteCompetition(int id) {
        var comp = await _competitions.FindByIdWithOrgAsync(id);

        if (comp == null)
            return NotFound();

        if (User.GetUserId() != comp.Organizer!.OwnerId)
            return Forbid();

        await _competitions.DeleteAsync(comp);

        return NoContent();
    }

    [HttpPost("{id}/participation-groups")]
    [Authorize(Roles = "User")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateParticipationGroup(int id, ParticipationGroup group) {
        var comp = await _competitions.FindByIdWithOrgAsync(id);

        if (comp == null)
            return NotFound();

        if (User.GetUserId() != comp.Organizer!.OwnerId)
            return Forbid();

        if (group.ParentGroupId != null)
            return BadRequest("A participation group cannot have both a parent group and a competition.");

        if (group.SubGroups.Count > 0 && group.Participations.Count > 0)
            return BadRequest("A participation group cannot have both subgrous and participations.");

        group.CompetitionId = id;
        await _participationGroups.AddAsync(group);

        return CreatedAtAction(nameof(GetCompetition), new { id = comp.Id }, group);
    }

    [HttpPost("{id}/disciplines")]
    [Authorize(Roles = "User")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateDiscipline(int id, Discipline discipline) {
        var comp = await _competitions.FindByIdWithOrgAsync(id);

        if (comp == null)
            return NotFound();

        if (User.GetUserId() != comp.Organizer!.OwnerId)
            return Forbid();

        discipline.CompetitionId = id;
        await _disciplines.AddAsync(discipline);

        return CreatedAtAction(nameof(GetCompetition), new { id = comp.Id }, discipline);
    }

    [HttpGet("{id}/teams")]
    [Authorize(Roles = "User")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<string[]>> GetTeams(int id) {
        var comp = await _competitions.FindByIdWithParticipationsAsync(id);

        if (comp == null)
            return NotFound();

        return Ok(comp.Teams);
    }

    [HttpGet("{id}/leaderboards")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<Leaderboard>>> GetLeaderboards(int id) {
        var leaderboards = await _leaderboardService.GetLeaderboardsAsync(id);

        if (leaderboards.Count == 0)
            return NotFound();

        return Ok(leaderboards);
    }

    [HttpGet("{id}/leaderboards/subscribe")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetSubscriptionInfo(int id) {
        var comp = await _competitions.FindByIdAsync(id);

        if (comp == null)
            return NotFound();

        // Return connection info for the client
        return Ok(new {
            hubUrl = "/hubs/competition",
            competitionId = id,
            methodName = "SubscribeToCompetition",
            eventName = "LeaderboardUpdated"
        });
    }
}