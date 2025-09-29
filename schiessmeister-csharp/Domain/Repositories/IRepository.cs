namespace schiessmeister_csharp.Domain.Repositories;

public interface IRepository<TEntity> where TEntity : IEntity {

    public Task<List<TEntity>> FindAllAsync();

    public Task<TEntity?> FindByIdAsync(int id);

    public Task<TEntity> AddAsync(TEntity entity);

    public Task<TEntity> UpdateAsync(TEntity entity);

    public Task<List<TEntity>> UpdateRangeAsync(IEnumerable<TEntity> entities);

    public Task DeleteAsync(TEntity entity);

    public Task DeleteRangeAsync(IEnumerable<TEntity> entities);
}

public interface IEntity {
    public int Id { get; set; }
}