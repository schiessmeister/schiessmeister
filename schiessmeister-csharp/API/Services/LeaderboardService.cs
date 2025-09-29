using schiessmeister_csharp.Domain.Models;
using schiessmeister_csharp.Domain.Repositories;
using schiessmeister_csharp.Domain.Services;

namespace schiessmeister_csharp.API.Services;

public class LeaderboardService : ILeaderboardService {
    private readonly ICompetitionRepository _competitions;

    public LeaderboardService(ICompetitionRepository competitions) {
        _competitions = competitions;
    }

    public async Task<List<Leaderboard>> GetLeaderboardsAsync(int competitionId) {
        var competition = await _competitions.FindByIdWithFullParticipationsAsync(competitionId);
        if (competition == null) return [];

        return GenerateLeaderboards(competition);
    }

    public async Task<List<Leaderboard>> GetLeaderboardsAsync(Competition competition) {
        // Wenn die Competition nicht alle notwendigen Daten enthält, laden wir sie nach
        if (competition.Participations.Count == 0 ||
            competition.Disciplines.Count == 0 ||
            competition.Participations.Any(p => p.Shooter == null)) {
            return await GetLeaderboardsAsync(competition.Id);
        }

        return GenerateLeaderboards(competition);
    }

    private List<Leaderboard> GenerateLeaderboards(Competition competition) {
        List<Leaderboard> leaderboards = [];

        var participationsByDiscipline = competition.Participations
            .GroupBy(p => p.DisciplineId)
            .ToDictionary(g => g.Key, g => g.ToList());

        foreach (var discipline in competition.Disciplines) {
            if (!participationsByDiscipline.TryGetValue(discipline.Id, out var disciplineParticipations))
                continue;

            // Class-based leaderboards
            foreach (var shootingClass in competition.AvailableClasses) {
                var classLeaderboard = new Leaderboard($"{discipline.Name} - {shootingClass}");

                var classParticipations = disciplineParticipations
                    .Where(p => p.ShooterClass == shootingClass)
                    .OrderByDescending(p => p.Result?.TotalPoints)
                    .ToArray();

                foreach (var participation in classParticipations) {
                    classLeaderboard.Entries.Add(new LeaderboardShooterEntry {
                        Name = participation.Shooter!.Fullname,
                        ShooterClass = participation.ShooterClass,
                        Team = participation.Team,
                        DqStatus = participation.DqStatus,
                        TotalScore = participation.Result.TotalPoints
                    });
                }

                leaderboards.Add(classLeaderboard);
            }

            // Team-based leaderboard for the discipline
            var teamLeaderboard = new Leaderboard($"{discipline.Name} - Mannschaften");

            foreach (var team in competition.Teams) {
                var teamScores = disciplineParticipations
                    .Where(p => p.Team == team)
                    .Select(p => p.Result?.TotalPoints ?? 0)
                    .ToArray();

                teamLeaderboard.Entries.Add(new LeaderboardTeamEntry {
                    Name = team,
                    ShooterTotals = teamScores,
                    TotalScore = teamScores.Sum()
                });
            }

            leaderboards.Add(teamLeaderboard);
        }

        return leaderboards;
    }
}