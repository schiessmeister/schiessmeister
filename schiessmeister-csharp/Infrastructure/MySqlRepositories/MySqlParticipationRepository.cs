using Microsoft.EntityFrameworkCore;
using schiessmeister_csharp.Domain.Models;
using schiessmeister_csharp.Domain.Repositories;
using schiessmeister_csharp.Domain.Services;

namespace schiessmeister_csharp.Infrastructure.MySqlRepositories;

public class ParticipationRepository : MySqlRepositoryBase<Participation>, IParticipationRepository {
    private readonly ICompetitionNotificationService _notificationService;
    private readonly ICompetitionRepository _competitionRepository;

    public ParticipationRepository(MySqlDbContext dbContext, ICompetitionNotificationService notificationService, ICompetitionRepository competitionRepository) : base(dbContext, dbContext.Participations) {
        _notificationService = notificationService;
        _competitionRepository = competitionRepository;
    }

    public override async Task<Participation> UpdateAsync(Participation entity) {
        var result = await base.UpdateAsync(entity);

        // Load full competition data for notification using existing repository method
        var competition = await _competitionRepository.FindByIdWithFullParticipationsAsync(entity.CompetitionId);

        if (competition != null) {
            await _notificationService.NotifyLeaderboardUpdated(competition);
        }

        return result;
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