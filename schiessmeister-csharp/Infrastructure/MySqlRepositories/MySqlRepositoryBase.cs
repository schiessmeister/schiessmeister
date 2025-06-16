using Microsoft.EntityFrameworkCore;
using schiessmeister_csharp.Domain.Repositories;

namespace schiessmeister_csharp.Infrastructure.MySqlRepositories;

public abstract class MySqlRepositoryBase<TEntity> : IRepository<TEntity> where TEntity : class, IEntity {
    protected readonly MySqlDbContext _db;
    private readonly DbSet<TEntity> _dbSet;

    protected MySqlRepositoryBase(MySqlDbContext dbContext, DbSet<TEntity> dbSet) {
        _db = dbContext;
        _dbSet = dbSet;
    }

    public virtual async Task<List<TEntity>> FindAllAsync() {
        return await _dbSet.ToListAsync();
    }

    public virtual async Task<TEntity?> FindByIdAsync(int id) {
        return await _dbSet.FindAsync(id);
    }

    public virtual async Task<TEntity> AddAsync(TEntity entity) {
        await _dbSet.AddAsync(entity);
        await _db.SaveChangesAsync();

        return entity;
    }

    public virtual async Task<TEntity> UpdateAsync(TEntity entity) {
        _dbSet.Update(entity);
        await _db.SaveChangesAsync();

        return entity;
    }

    public virtual async Task<List<TEntity>> UpdateRangeAsync(IEnumerable<TEntity> entities) {
        _dbSet.UpdateRange(entities);
        await _db.SaveChangesAsync();

        return entities.ToList();
    }

    public virtual async Task DeleteAsync(TEntity entity) {
        _dbSet.Remove(entity);
        await _db.SaveChangesAsync();
    }

    public virtual async Task DeleteRangeAsync(IEnumerable<TEntity> entities) {
        _dbSet.RemoveRange(entities);
        await _db.SaveChangesAsync();
    }
}