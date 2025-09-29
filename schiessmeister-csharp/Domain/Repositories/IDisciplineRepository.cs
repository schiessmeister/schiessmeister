using schiessmeister_csharp.Domain.Models;

namespace schiessmeister_csharp.Domain.Repositories;

public interface IDisciplineRepository : IRepository<Discipline> {

    public Task<Discipline?> FindByIdWithCompOrgAsync(int id);
}