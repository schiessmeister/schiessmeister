using Microsoft.AspNetCore.SignalR;
using schiessmeister_csharp.API.Hubs;
using schiessmeister_csharp.Domain.Models;
using schiessmeister_csharp.Domain.Services;

namespace schiessmeister_csharp.API.Services {

    public class CompetitionNotificationService : ICompetitionNotificationService {
        private readonly IHubContext<CompetitionHub> _hubContext;
        private readonly ILeaderboardService _leaderboardService;

        public CompetitionNotificationService(IHubContext<CompetitionHub> hubContext, ILeaderboardService leaderboardService) {
            _hubContext = hubContext;
            _leaderboardService = leaderboardService;
        }

        public async Task NotifyLeaderboardUpdated(Competition competition) {
            string groupName = CompetitionHub.GetGroupName(competition.Id);

            var leaderboards = await _leaderboardService.GetLeaderboardsAsync(competition);

            await _hubContext.Clients.Group(groupName).SendAsync("LeaderboardUpdated", leaderboards);
        }
    }
}