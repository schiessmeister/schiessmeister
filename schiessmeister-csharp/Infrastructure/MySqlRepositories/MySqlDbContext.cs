using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using schiessmeister_csharp.Domain.Models;

namespace schiessmeister_csharp.Infrastructure.MySqlRepositories;

public class MySqlDbContext : IdentityDbContext<AppUser, IdentityRole<int>, int> {
    public DbSet<AppUser> AppUsers { get; set; }
    public DbSet<Organization> Organizations { get; set; }
    public DbSet<Competition> Competitions { get; set; }
    public DbSet<Discipline> Disciplines { get; set; }
    public DbSet<ParticipationGroup> ParticipationGroups { get; set; }
    public DbSet<Participation> Participations { get; set; }

    public MySqlDbContext(DbContextOptions<MySqlDbContext> options) : base(options) {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder) {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Participation>(entity =>
            entity.Property(p => p.Result).HasColumnType("json")
        );
    }
}