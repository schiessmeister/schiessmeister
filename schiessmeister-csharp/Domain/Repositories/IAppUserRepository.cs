using schiessmeister_csharp.Domain.Models;

namespace schiessmeister_csharp.Domain.Repositories;

public interface IAppUserRepository : IRepository<AppUser> {

    public Task<AppUser?> FindByIdWithOrgsAsync(int id);

    public Task<AppUser?> FindByIdWithRecordedCompsAsync(int id);

    public Task<List<AppUser>> SearchAsync(string? searchTerm);
}