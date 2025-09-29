using schiessmeister_csharp.Domain.Models;

namespace schiessmeister_csharp.Domain.Repositories;

public interface IOrganizationRepository : IRepository<Organization> {

    Task<Organization?> FindByIdWithCompetitionsAsync(int id);
}