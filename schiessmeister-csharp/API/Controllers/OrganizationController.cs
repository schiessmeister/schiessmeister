using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using schiessmeister_csharp.API.Extensions;
using schiessmeister_csharp.Domain.Models;
using schiessmeister_csharp.Domain.Repositories;

namespace schiessmeister_csharp.API.Controllers;

[ApiController]
[Route("api/organizations")]
[Authorize(Roles = "User")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public class OrganizationController : ControllerBase {
    private readonly IOrganizationRepository _organizations;
    private readonly ICompetitionRepository _competitions;

    public OrganizationController(
        IOrganizationRepository organizations,
        ICompetitionRepository competitions) {
        _organizations = organizations;
        _competitions = competitions;
    }

    [HttpGet("{id}/competitions")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IEnumerable<Competition>>> GetCompetitions(int id) {
        var organization = await _organizations.FindByIdWithCompetitionsAsync(id);

        if (organization == null)
            return NotFound();

        if (User.GetUserId() != organization.OwnerId)
            return Forbid();

        return Ok(organization.Competitions);
    }

    [HttpPost("{id}/competitions")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<Competition>> CreateCompetition(int id, Competition comp) {
        var organization = await _organizations.FindByIdAsync(id);

        if (organization == null)
            return NotFound();

        if (User.GetUserId() != organization.OwnerId)
            return Forbid();

        if (comp.Disciplines.Count == 0)
            return BadRequest("At least one discipline is required.");

        comp.OrganizerId = id;
        comp.Groups.Add(new ParticipationGroup {
            Title = "Default Group",
            StartDateTime = comp.StartDateTime,
            EndDateTime = comp.EndDateTime
        });

        var createdCompetition = await _competitions.AddAsync(comp);

        return CreatedAtAction(
            nameof(CompetitionController.GetCompetition),
            new { id = createdCompetition.Id },
            createdCompetition);
    }
}