using Microsoft.EntityFrameworkCore;
using schiessmeister_csharp.Domain.Models;
using schiessmeister_csharp.Domain.Repositories;

namespace schiessmeister_csharp.Infrastructure.MySqlRepositories;

public class MySqlAppUserRepository(MySqlDbContext dbContext) : MySqlRepositoryBase<AppUser>(dbContext, dbContext.AppUsers), IAppUserRepository {

    public async Task<AppUser?> FindByIdWithOrgsAsync(int id) {
        return await _db.AppUsers
            .Include(u => u.OwnedOrganizations)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<AppUser?> FindByIdWithRecordedCompsAsync(int id) {
        return await _db.AppUsers
            .Include(u => u.RecordedCompetitions)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<List<AppUser>> SearchAsync(string? searchTerm) {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return await FindAllAsync();

        var compType = StringComparison.CurrentCultureIgnoreCase;

        return await _db.AppUsers
            .Where(u =>
                u.Fullname.Contains(searchTerm, compType) ||
                u.UserName!.Contains(searchTerm, compType))
            .ToListAsync();
    }
}