using schiessmeister_csharp.Domain.Models;

namespace schiessmeister_csharp.Domain.Services;

public interface ILeaderboardService {

    Task<List<Leaderboard>> GetLeaderboardsAsync(int competitionId);

    Task<List<Leaderboard>> GetLeaderboardsAsync(Competition competition);
}