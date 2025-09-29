using schiessmeister_csharp.Domain.Repositories;

namespace schiessmeister_csharp.Domain.Models;

public class Discipline : IEntity {
    public int Id { get; set; }
    public string Name { get; set; }
    public int SeriesCount { get; set; }
    public int ShotsPerSeries { get; set; }

    public int CompetitionId { get; set; }
    public Competition? Competition { get; set; }

    public List<Participation> Participations { get; set; } = [];
}