using schiessmeister_csharp.Domain.Repositories;

namespace schiessmeister_csharp.Domain.Models;

public class Organization : IEntity {
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Website { get; set; }

    public int OwnerId { get; set; }
    public AppUser? Owner { get; set; }

    public List<Competition> Competitions { get; set; } = [];
}