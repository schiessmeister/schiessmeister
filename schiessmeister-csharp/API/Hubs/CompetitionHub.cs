using Microsoft.AspNetCore.SignalR;

namespace schiessmeister_csharp.API.Hubs {

    public class CompetitionHub : Hub {
        private const string CompetitionGroupPrefix = "competition-";

        // Allows clients to subscribe to updates for a specific competition
        public async Task SubscribeToCompetition(int competitionId) {
            await Groups.AddToGroupAsync(Context.ConnectionId, GetGroupName(competitionId));
        }

        // Allows clients to unsubscribe from updates for a specific competition
        public async Task UnsubscribeFromCompetition(int competitionId) {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetGroupName(competitionId));
        }

        // Gets the unique group name for a competition
        public static string GetGroupName(int competitionId) {
            return $"{CompetitionGroupPrefix}{competitionId}";
        }
    }
}