using FluentAssertions;
using Moq;
using schiessmeister_csharp.API.Services;
using schiessmeister_csharp.Domain.Models;
using schiessmeister_csharp.Domain.Repositories;

namespace schiessmeister_csharp_tests.Service
{
    public class LeaderboardServiceTests
    {
        private readonly Mock<ICompetitionRepository> _repoMock;
        private readonly LeaderboardService _service;

        public LeaderboardServiceTests()
        {
            _repoMock = new Mock<ICompetitionRepository>();
            _service = new LeaderboardService(_repoMock.Object);
        }

        // Helper to create ShootingResult
        private static ShootingResult CreateResult(double totalPoints)
        {
            return new ShootingResult
            {
                Series = new[]
                {
                    new ShootingSeries
                    {
                        Points = new[] { totalPoints }
                    }
                }
            };
        }

        [Fact]
        public async Task GenerateLeaderboards_ShouldReturnClassAndTeamLeaderboards()
        {
            var competition = new Competition
            {
                Id = 1,
                Disciplines = new[] { new Discipline { Id = 10, Name = "Pistol" } }.ToList(),
                AvailableClasses = ["A"],
                Participations = new[]
                {
                    new Participation
                    {
                        DisciplineId = 10,
                        ShooterClass = "A",
                        Shooter = new AppUser { Firstname = "Alice", Lastname = "Smith" },
                        Team = "TeamX",
                        Result = CreateResult(95)
                    },
                    new Participation
                    {
                        DisciplineId = 10,
                        ShooterClass = "A",
                        Shooter = new AppUser { Firstname = "Bob", Lastname = "Johnson" },
                        Team = "TeamX",
                        Result = CreateResult(90)
                    }
                }.ToList()
            };

            var leaderboards = await _service.GetLeaderboardsAsync(competition);

            leaderboards.Should().HaveCount(2);

            var classLb = leaderboards.First(lb => lb.Name.Contains("A"));
            classLb.Entries.Should().HaveCount(2);
            classLb.Entries.First().Name.Should().Be("Alice Smith");
            classLb.Entries.First().TotalScore.Should().Be(95);

            var teamLb = leaderboards.First(lb => lb.Name.Contains("Mannschaften"));
            teamLb.Entries.First().TotalScore.Should().Be(185);
        }

        [Fact]
        public async Task GenerateLeaderboards_SingleShooter_ReturnsClassAndEmptyTeamLeaderboard()
        {
            var competition = new Competition
            {
                Id = 2,
                Disciplines = new[] { new Discipline { Id = 20, Name = "Rifle" } }.ToList(),
                AvailableClasses = new[] { "B" },
                Participations = new[]
                {
                    new Participation
                    {
                        DisciplineId = 20,
                        ShooterClass = "B",
                        Shooter = new AppUser { Firstname = "Alice", Lastname = "Smith" },
                        Team = null,
                        Result = CreateResult(88)
                    }
                }.ToList()
            };

            var leaderboards = await _service.GetLeaderboardsAsync(competition);

            leaderboards.Should().HaveCount(2); // class leaderboard + empty team leaderboard
            var classLb = leaderboards.First(lb => lb.Name.Contains("B"));
            classLb.Entries.First().Name.Should().Be("Alice Smith");
            classLb.Entries.First().TotalScore.Should().Be(88);

            var teamLb = leaderboards.First(lb => lb.Name.Contains("Mannschaften"));
            teamLb.Entries.Should().BeEmpty(); // no shooters in a team
        }

        [Fact]
        public async Task GenerateLeaderboards_MultipleClassesAndTeams_ShouldSplitCorrectly()
        {
            var competition = new Competition
            {
                Id = 3,
                Disciplines = new[] { new Discipline { Id = 30, Name = "Shotgun" } }.ToList(),
                AvailableClasses = new[] { "A", "B" },
                Participations = new[]
                {
                    new Participation
                    {
                        DisciplineId = 30,
                        ShooterClass = "A",
                        Shooter = new AppUser { Firstname = "Alice", Lastname = "Smith" },
                        Team = "Team1",
                        Result = CreateResult(95)
                    },
                    new Participation
                    {
                        DisciplineId = 30,
                        ShooterClass = "A",
                        Shooter = new AppUser { Firstname = "Bob", Lastname = "Johnson" },
                        Team = "Team1",
                        Result = CreateResult(90)
                    },
                    new Participation
                    {
                        DisciplineId = 30,
                        ShooterClass = "B",
                        Shooter = new AppUser { Firstname = "Charlie", Lastname = "Brown" },
                        Team = "Team2",
                        Result = CreateResult(85)
                    }
                }.ToList()
            };

            var leaderboards = await _service.GetLeaderboardsAsync(competition);

            leaderboards.Should().HaveCount(3); // Class A, Class B, and Team leaderboard

            var classA = leaderboards.First(lb => lb.Name.Contains("A"));
            classA.Entries.Should().HaveCount(2);

            var classB = leaderboards.First(lb => lb.Name.Contains("B"));
            classB.Entries.Should().HaveCount(1);

            var teamLb = leaderboards.First(lb => lb.Name.Contains("Mannschaften"));
            teamLb.Entries.First().TotalScore.Should().Be(185); // Team1 sum: 95 + 90
        }
    }
}
