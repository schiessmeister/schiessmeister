using Microsoft.EntityFrameworkCore;
using schiessmeister_csharp.Domain.Models;
using schiessmeister_csharp.Domain.Repositories;

namespace schiessmeister_csharp.Infrastructure.MySqlRepositories;

public class MySqlOrganizationRepository(MySqlDbContext dbContext) : MySqlRepositoryBase<Organization>(dbContext, dbContext.Organizations), IOrganizationRepository {

    public async Task<Organization?> FindByIdWithCompetitionsAsync(int id) {
        return await _db.Organizations
            .Include(o => o.Competitions)
            .FirstOrDefaultAsync(o => o.Id == id);
    }
}