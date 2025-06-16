using Microsoft.EntityFrameworkCore;
using schiessmeister_csharp.Domain.Models;
using schiessmeister_csharp.Domain.Repositories;

namespace schiessmeister_csharp.Infrastructure.MySqlRepositories;

public class ParticipationGroupRepository(MySqlDbContext dbContext) : MySqlRepositoryBase<ParticipationGroup>(dbContext, dbContext.ParticipationGroups), IParticipationGroupRepository {

    public async Task<ParticipationGroup?> FindByIdWithOrgAsync(int id) {
        return await _db.ParticipationGroups
            .Include(pg => pg.Competition)
            .ThenInclude(c => c!.Organizer)
            .FirstOrDefaultAsync(pg => pg.Id == id);
    }

    public async Task<ParticipationGroup?> FindByIdWithChildsOrgAsync(int id) {
        return await _db.ParticipationGroups
            .Include(pg => pg.Competition)
            .ThenInclude(c => c.Organizer)
            .Include(pg => pg.SubGroups)
            .FirstOrDefaultAsync(pg => pg.Id == id);
    }
}