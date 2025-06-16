using schiessmeister_csharp.Domain.Models;

namespace schiessmeister_csharp.Domain.Services;

public interface ICompetitionNotificationService {

    // Notifies all clients subscribed to a specific competition about updates of the leaderboard.
    Task NotifyLeaderboardUpdated(Competition competition);
}