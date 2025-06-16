using Microsoft.EntityFrameworkCore;
using schiessmeister_csharp.Domain.Models;
using schiessmeister_csharp.Domain.Repositories;
using schiessmeister_csharp.Domain.Services;

namespace schiessmeister_csharp.Infrastructure.MySqlRepositories;

public class MySqlCompetitionRepository(MySqlDbContext dbContext) : MySqlRepositoryBase<Competition>(dbContext, dbContext.Competitions), ICompetitionRepository {

    public async Task<Competition?> FindByIdFullTreeAsync(int id) {
        return await _db.Competitions
            .Include(c => c.Participations.OrderBy(p => p.ShooterClass).ThenBy(p => p.Shooter!.Lastname).ThenBy(p => p.Shooter!.Firstname))
            .Include(c => c.Disciplines)
            .Include(c => c.Recorders)
            .Include(c => c.Groups.Where(g => g.ParentGroupId == null)) // Only top-level groups.
            .ThenInclude(g => g.SubGroups) // This should include all subgroups recursively.
            .ThenInclude(sg => sg.Participations)
            .Include(c => c.Groups.Where(g => g.ParentGroupId == null))
            .ThenInclude(g => g.Participations)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Competition?> FindByIdWithOrgAsync(int id) {
        return await _db.Competitions
            .Include(c => c.Organizer)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Competition?> FindByIdWithParticipationsAsync(int id) {
        return await _db.Competitions
            .Include(c => c.Participations)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Competition?> FindByIdWithFullParticipationsAsync(int id) {
        return await _db.Competitions
            .Include(c => c.Participations)
            .ThenInclude(p => p.Shooter)
            .Include(c => c.Participations)
            .ThenInclude(p => p.Discipline)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public override async Task DeleteAsync(Competition comp) {
        var existingComp = await _db.Competitions
            .Include(c => c.Participations)
            .Include(c => c.Groups)
            .Include(c => c.Disciplines)
            .FirstOrDefaultAsync(c => c.Id == comp.Id);

        if (existingComp == null)
            throw new InvalidOperationException("Competition does not exist");

        _db.Participations.RemoveRange(existingComp.Participations);
        _db.ParticipationGroups.RemoveRange(existingComp.Groups);
        _db.Disciplines.RemoveRange(existingComp.Disciplines);

        _db.Competitions.Remove(existingComp);

        await _db.SaveChangesAsync();
    }
}