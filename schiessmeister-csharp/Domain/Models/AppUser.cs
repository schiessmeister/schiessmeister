using Microsoft.AspNetCore.Identity;
using schiessmeister_csharp.Domain.Models.ValueTypes;
using schiessmeister_csharp.Domain.Repositories;
using System.ComponentModel.DataAnnotations.Schema;

namespace schiessmeister_csharp.Domain.Models;

public class AppUser : IdentityUser<int>, IEntity {
    private string _gender;

    public string Firstname { get; set; }
    public string Lastname { get; set; }
    public string Fullname => $"{Firstname} {Lastname}";
    public DateOnly Birthdate { get; set; }

    public string Gender {
        get => _gender;
        set {
            (bool isValid, string gender) = GenderValues.IsValid(value);

            if (!isValid) {
                throw new ArgumentException($"Ungültiger Gender-Wert: {value}");
            }

            _gender = gender;
        }
    }

    public List<Participation> Participations { get; set; } = [];
    public List<Organization> OwnedOrganizations { get; set; } = [];
    public List<Competition> RecordedCompetitions { get; set; } = [];

    // Attribute needed since there are multiple relationships between AppUser and Participation.
    [InverseProperty("Recorder")]
    public List<Participation> RecordedParticipations { get; set; } = [];
}