using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using schiessmeister_csharp.API.Controllers;
using schiessmeister_csharp.Domain.Models;
using schiessmeister_csharp.Domain.Repositories;

namespace schiessmeister_csharp_tests.Controller
{
    public class OrganizationControllerTests
    {
        private Mock<IOrganizationRepository> _orgRepoMock;
        private Mock<ICompetitionRepository> _compRepoMock;
        private OrganizationController _controller;

        public OrganizationControllerTests()
        {
            _orgRepoMock = new Mock<IOrganizationRepository>();
            _compRepoMock = new Mock<ICompetitionRepository>();

            _controller = new OrganizationController(_orgRepoMock.Object, _compRepoMock.Object);
        }

        private void SetUserId(int userId)
        {
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, userId.ToString())
                    }))
                }
            };
        }

        [Fact]
        public async Task GetCompetitions_ReturnsOk_WhenUserIsOwner()
        {
            // Arrange
            var organizationId = 1;
            var ownerId = 42;
            var competitions = new List<Competition> { new Competition { Id = 10 } };

            _orgRepoMock
                .Setup(r => r.FindByIdWithCompetitionsAsync(organizationId))
                .ReturnsAsync(new Organization
                {
                    Id = organizationId,
                    OwnerId = ownerId,
                    Competitions = competitions
                });

            SetUserId(ownerId);

            // Act
            var result = await _controller.GetCompetitions(organizationId);

            // Assert
            var okResult = result.Result as OkObjectResult;
            okResult.Should().NotBeNull();
            okResult!.Value.Should().BeEquivalentTo(competitions);
        }

        [Fact]
        public async Task GetCompetitions_ReturnsNotFound_WhenOrganizationDoesNotExist()
        {
            // Arrange
            _orgRepoMock
                .Setup(r => r.FindByIdWithCompetitionsAsync(It.IsAny<int>()))
                .ReturnsAsync((Organization)null);

            SetUserId(42);

            // Act
            var result = await _controller.GetCompetitions(1);

            // Assert
            result.Result.Should().BeOfType<NotFoundResult>();
        }

        [Fact]
        public async Task CreateCompetition_ReturnsCreated_WhenValid()
        {
            var ownerId = 42;
            var newCompetition = new Competition
            {
                Id = 0,
                Disciplines = new List<Discipline> { new Discipline { Id = 1 } },
                StartDateTime = DateTime.Now,
                EndDateTime = DateTime.Now.AddHours(2)
            };

            _orgRepoMock.Setup(r => r.FindByIdAsync(It.IsAny<int>()))
                .ReturnsAsync(new Organization { Id = 1, OwnerId = ownerId });

            _compRepoMock.Setup(r => r.AddAsync(It.IsAny<Competition>()))
                .ReturnsAsync((Competition c) => { c.Id = 123; return c; });

            SetUserId(ownerId);

            var result = await _controller.CreateCompetition(1, newCompetition);

            var createdResult = result.Result as CreatedAtActionResult;
            createdResult.Should().NotBeNull();
            createdResult!.RouteValues!["id"].Should().Be(123);
            ((Competition)createdResult.Value!).Id.Should().Be(123);
        }

        [Fact]
        public async Task CreateCompetition_ReturnsBadRequest_WhenNoDisciplines()
        {
            // Arrange
            var ownerId = 42;
            _orgRepoMock.Setup(r => r.FindByIdAsync(It.IsAny<int>()))
                        .ReturnsAsync(new Organization { Id = 1, OwnerId = ownerId });

            SetUserId(ownerId);

            var comp = new Competition
            {
                Id = 1,
                Disciplines = new List<Discipline>(), // empty
                StartDateTime = DateTime.Now,
                EndDateTime = DateTime.Now.AddHours(1)
            };

            // Act
            var result = await _controller.CreateCompetition(1, comp);

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
            ((BadRequestObjectResult)result.Result!).Value.Should().Be("At least one discipline is required.");
        }

        [Fact]
        public async Task GetCompetitions_ReturnsForbid_WhenUserIsNotOwner()
        {
            var organizationId = 1;
            var ownerId = 42;

            _orgRepoMock.Setup(r => r.FindByIdWithCompetitionsAsync(organizationId))
                .ReturnsAsync(new Organization { Id = organizationId, OwnerId = ownerId });

            SetUserId(99); // different user

            var result = await _controller.GetCompetitions(organizationId);

            result.Result.Should().BeOfType<ForbidResult>();
        }

        [Fact]
        public async Task CreateCompetition_ReturnsForbid_WhenUserIsNotOwner()
        {
            var ownerId = 42;
            _orgRepoMock.Setup(r => r.FindByIdAsync(It.IsAny<int>()))
                        .ReturnsAsync(new Organization { Id = 1, OwnerId = ownerId });

            SetUserId(99); // different user

            var comp = new Competition
            {
                Id = 1,
                Disciplines = new List<Discipline> { new Discipline { Id = 1 } },
                StartDateTime = DateTime.Now,
                EndDateTime = DateTime.Now.AddHours(1)
            };

            var result = await _controller.CreateCompetition(1, comp);

            result.Result.Should().BeOfType<ForbidResult>();
        }
    }
}
