using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using schiessmeister_csharp.API.Extensions;
using schiessmeister_csharp.Domain.Models;
using schiessmeister_csharp.Domain.Repositories;

namespace schiessmeister_csharp.API.Controllers;

[ApiController]
[Route("api/competitions")]
public class CompetitionController : ControllerBase {
    private readonly ICompetitionRepository _competitions;
    private readonly IParticipationGroupRepository _participationGroups;
    private readonly IDisciplineRepository _disciplines;

    public CompetitionController(ICompetitionRepository competitions, IParticipationGroupRepository participationGroups, IDisciplineRepository disciplines) {
        _competitions = competitions;
        _participationGroups = participationGroups;
        _disciplines = disciplines;
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
        var comp = await _competitions.FindByIdWithFullParticipationsAsync(id);

        if (comp == null)
            return NotFound();

        List<Leaderboard> leaderboards = [];

        var participationsByDiscipline = comp.Participations
            .GroupBy(p => p.DisciplineId)
            .ToDictionary(g => g.Key, g => g.ToList());

        foreach (var discipline in comp.Disciplines) {
            if (!participationsByDiscipline.TryGetValue(discipline.Id, out var disciplineParticipations))
                continue;

            // Class-based leaderboards
            foreach (var shootingClass in comp.AvailableClasses) {
                var classLeaderboard = new Leaderboard($"{discipline.Name} - {shootingClass}");

                var classParticipations = disciplineParticipations
                    .Where(p => p.ShooterClass == shootingClass)
                    .OrderByDescending(p => p.Result?.TotalPoints)
                    .ToArray();

                foreach (var participation in classParticipations) {
                    classLeaderboard.Entries.Add(new LeaderboardShooterEntry {
                        Name = participation.Shooter!.Fullname,
                        ShooterClass = participation.ShooterClass,
                        Team = participation.Team,
                        DqStatus = participation.DqStatus,
                        TotalScore = participation.Result.TotalPoints
                    });
                }

                leaderboards.Add(classLeaderboard);
            }

            // Team-based leaderboard for the discipline
            var teamLeaderboard = new Leaderboard($"{discipline.Name} - Mannschaften");

            foreach (var team in comp.Teams) {
                var teamScores = disciplineParticipations
                    .Where(p => p.Team == team)
                    .Select(p => p.Result?.TotalPoints ?? 0)
                    .ToArray();

                teamLeaderboard.Entries.Add(new LeaderboardTeamEntry {
                    Name = team,
                    ShooterTotals = teamScores,
                    TotalScore = teamScores.Sum()
                });
            }

            leaderboards.Add(teamLeaderboard);
        }

        return Ok(leaderboards);
    }

    [HttpGet("{id}/subscribe")]
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
            eventName = "CompetitionUpdated"
        });
    }
}