namespace schiessmeister_csharp.Domain.Models;

public class Leaderboard(string name) {
    public string Name { get; set; } = name;
    public List<LeaderboardEntry> Entries { get; set; } = [];
}

public abstract class LeaderboardEntry {
    public string Name { get; set; }
    public double TotalScore { get; set; }
}

public class LeaderboardShooterEntry : LeaderboardEntry {
    public string ShooterClass { get; set; }
    public string? Team { get; set; }
    public string? DqStatus { get; set; }
}

public class LeaderboardTeamEntry : LeaderboardEntry {
    public double[] ShooterTotals { get; set; }
}