using schiessmeister_csharp.Domain.Models;

namespace schiessmeister_csharp.Domain.Repositories;

public interface IParticipationRepository : IRepository<Participation> {

    public Task<Participation?> FindByIdWithCompOrgAsync(int id);

    public Task<Participation?> FindByIdWithCompOrgRecDisAsync(int id);
}