using Microsoft.EntityFrameworkCore;
using schiessmeister_csharp.Domain.Models;
using schiessmeister_csharp.Domain.Repositories;
using schiessmeister_csharp.Domain.Services;

namespace schiessmeister_csharp.Infrastructure.MySqlRepositories;

public class ParticipationRepository : MySqlRepositoryBase<Participation>, IParticipationRepository {
    private readonly ICompetitionNotificationService _notificationService;

    public ParticipationRepository(MySqlDbContext dbContext, ICompetitionNotificationService notificationService) : base(dbContext, dbContext.Participations) {
        _notificationService = notificationService;
    }

    public override Task<Participation> UpdateAsync(Participation entity) {
        // TODO call notification and send leaderboard update
        //_notificationService.NotifyCompetitionUpdated(comp);

        return base.UpdateAsync(entity);
    }

    public async Task<Participation?> FindByIdWithCompOrgAsync(int id) {
        return await _db.Participations
            .Include(p => p.Competition)
            .ThenInclude(c => c!.Organizer)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Participation?> FindByIdWithCompOrgRecDisAsync(int id) {
        return await _db.Participations
            .Include(p => p.Competition)
            .ThenInclude(c => c!.Organizer)
            .Include(p => p.Competition)
            .ThenInclude(c => c!.Recorders)
            .Include(p => p.Discipline)
            .FirstOrDefaultAsync(p => p.Id == id);
    }
}