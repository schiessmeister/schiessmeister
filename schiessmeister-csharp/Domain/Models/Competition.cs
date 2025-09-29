using schiessmeister_csharp.Domain.Repositories;

namespace schiessmeister_csharp.Domain.Models;

public class Competition : IEntity {
    public int Id { get; set; }
    public string Title { get; set; }
    public string Location { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public string[] AvailableClasses { get; set; } // This array will get converted to JSON by EF Core.
    public string? AnnouncementUrl { get; set; }

    public int OrganizerId { get; set; }
    public Organization? Organizer { get; set; }

    public List<Discipline> Disciplines { get; set; } = []; // At least one.
    public List<AppUser> Recorders { get; set; } = [];
    public List<Participation> Participations { get; set; } = [];
    public List<ParticipationGroup> Groups { get; set; } = []; // At least one.

    // Get all unique teams from participations.
    public string[] Teams => Participations
        .Where(p => p.Team is not null)
        .Select(p => p.Team!)
        .Distinct()
        .ToArray();
}