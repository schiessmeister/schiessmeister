using Microsoft.EntityFrameworkCore;
using schiessmeister_csharp.Domain.Models;
using schiessmeister_csharp.Domain.Repositories;

namespace schiessmeister_csharp.Infrastructure.MySqlRepositories;

public class DisciplineRepository(MySqlDbContext dbContext) : MySqlRepositoryBase<Discipline>(dbContext, dbContext.Disciplines), IDisciplineRepository {

    public async Task<Discipline?> FindByIdWithCompOrgAsync(int id) {
        return await _db.Disciplines
            .Include(d => d.Competition)
            .ThenInclude(c => c!.Organizer)
            .FirstOrDefaultAsync(d => d.Id == id);
    }
}