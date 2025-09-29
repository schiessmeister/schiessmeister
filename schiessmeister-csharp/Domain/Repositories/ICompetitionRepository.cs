using schiessmeister_csharp.Domain.Models;

namespace schiessmeister_csharp.Domain.Repositories;

public interface ICompetitionRepository : IRepository<Competition> {

    public Task<Competition?> FindByIdFullTreeAsync(int id);

    public Task<Competition?> FindByIdWithOrgAsync(int id);

    public Task<Competition?> FindByIdWithParticipationsAsync(int id);

    public Task<Competition?> FindByIdWithFullParticipationsAsync(int id);
}