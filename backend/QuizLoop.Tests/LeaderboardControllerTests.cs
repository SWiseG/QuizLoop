using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using QuizLoop.Domain.Entities;
using QuizLoop.Infrastructure.Persistence;

namespace QuizLoop.Tests;

public class LeaderboardControllerTests
{
    [Fact]
    public async Task GetLeaderboard_ReturnsEmptyList_WhenNoRoundsExist()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/leaderboard");
        var payload = await response.Content.ReadFromJsonAsync<List<LeaderboardEntryResponse>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(payload);
        Assert.Empty(payload);
    }

    [Fact]
    public async Task GetLeaderboard_Daily_ReturnsOnlyTodayRounds()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var now = DateTime.UtcNow;
        await SeedRoundsAsync(factory,
        [
            CreateRound("r-today", "user-1", 500, now),
            CreateRound("r-two-days-ago", "user-2", 300, now.AddDays(-2))
        ]);

        var response = await client.GetAsync("/api/leaderboard?period=daily");
        var payload = await response.Content.ReadFromJsonAsync<List<LeaderboardEntryResponse>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(payload);
        Assert.Single(payload);
        Assert.Equal("user-1", payload[0].UserId);
        Assert.Equal(500, payload[0].TotalScore);
    }

    [Fact]
    public async Task GetLeaderboard_Weekly_ReturnsRoundsFromLastSevenDays()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var now = DateTime.UtcNow;
        await SeedRoundsAsync(factory,
        [
            CreateRound("r-today", "user-1", 500, now),
            CreateRound("r-two-days-ago", "user-2", 300, now.AddDays(-2))
        ]);

        var response = await client.GetAsync("/api/leaderboard?period=weekly");
        var payload = await response.Content.ReadFromJsonAsync<List<LeaderboardEntryResponse>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(payload);
        Assert.Equal(2, payload.Count);
        Assert.Contains(payload, entry => entry.UserId == "user-1" && entry.TotalScore == 500);
        Assert.Contains(payload, entry => entry.UserId == "user-2" && entry.TotalScore == 300);
    }

    [Fact]
    public async Task GetLeaderboard_InvalidPeriod_ReturnsBadRequest()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/leaderboard?period=invalid");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Submit_WithValidBodyAndAuth_ReturnsCreatedRound()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = CreateAuthenticatedClient(factory);

        var request = new SubmitScoreRequest("classic", 800, 8);
        var response = await client.PostAsJsonAsync("/api/leaderboard/submit", request);
        var round = await response.Content.ReadFromJsonAsync<RoundResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(round);
        Assert.Equal("test-user-123", round.UserId);
        Assert.Equal("classic", round.Mode);
        Assert.Equal(800, round.Score);
        Assert.Equal(8, round.CorrectCount);
    }

    [Fact]
    public async Task Submit_WithInvalidScoreAboveRoundMax_ReturnsBadRequest()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = CreateAuthenticatedClient(factory);

        var request = new SubmitScoreRequest("classic", 5000, 10);
        var response = await client.PostAsJsonAsync("/api/leaderboard/submit", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Submit_WithImpossibleScoreForCorrectCount_ReturnsBadRequest()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = CreateAuthenticatedClient(factory);

        var request = new SubmitScoreRequest("daily", 600, 2);
        var response = await client.PostAsJsonAsync("/api/leaderboard/submit", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Submit_WithInvalidCorrectCount_ReturnsBadRequest()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = CreateAuthenticatedClient(factory);

        var request = new SubmitScoreRequest("classic", 100, 15);
        var response = await client.PostAsJsonAsync("/api/leaderboard/submit", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Submit_WithInvalidMode_ReturnsBadRequest()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = CreateAuthenticatedClient(factory);

        var request = new SubmitScoreRequest("category", 500, 5);
        var response = await client.PostAsJsonAsync("/api/leaderboard/submit", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Submit_WithoutAuth_ReturnsUnauthorized()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var request = new SubmitScoreRequest("Classic", 321, 3);
        var response = await client.PostAsJsonAsync("/api/leaderboard/submit", request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetLeaderboard_IsSortedByTotalScore_WithExpectedRanks()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var now = DateTime.UtcNow;
        await SeedRoundsAsync(factory,
        [
            CreateRound("r-u1-1", "user-1", 200, now),
            CreateRound("r-u1-2", "user-1", 300, now.AddMinutes(1)),
            CreateRound("r-u2-1", "user-2", 600, now.AddMinutes(2))
        ]);

        var response = await client.GetAsync("/api/leaderboard?period=alltime");
        var payload = await response.Content.ReadFromJsonAsync<List<LeaderboardEntryResponse>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(payload);
        Assert.Equal(2, payload.Count);
        Assert.True(payload.Count <= 50);
        Assert.Equal("user-2", payload[0].UserId);
        Assert.Equal(600, payload[0].TotalScore);
        Assert.Equal(1, payload[0].Rank);
        Assert.Equal("user-1", payload[1].UserId);
        Assert.Equal(500, payload[1].TotalScore);
        Assert.Equal(2, payload[1].Rank);
    }

    private static HttpClient CreateAuthenticatedClient(TestWebApplicationFactory factory)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(TestAuthHandler.SchemeName);
        return client;
    }

    private static async Task SeedRoundsAsync(TestWebApplicationFactory factory, IEnumerable<Round> rounds)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Rounds.AddRange(rounds);
        await db.SaveChangesAsync();
    }

    private static Round CreateRound(string id, string userId, int score, DateTime startedAtUtc)
    {
        return new Round
        {
            Id = id,
            UserId = userId,
            Mode = "Classic",
            Score = score,
            CorrectCount = 1,
            StartedAt = startedAtUtc,
            EndedAt = startedAtUtc.AddMinutes(2)
        };
    }

    private sealed record SubmitScoreRequest(string Mode, int Score, int CorrectCount);
    private sealed record LeaderboardEntryResponse(int Rank, string UserId, int TotalScore, int GamesPlayed);
    private sealed record RoundResponse(
        string Id,
        string UserId,
        string Mode,
        int Score,
        int CorrectCount,
        DateTime StartedAt,
        DateTime EndedAt);
}
