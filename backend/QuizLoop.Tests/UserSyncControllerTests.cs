using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using QuizLoop.Domain.Entities;
using QuizLoop.Infrastructure.Persistence;

namespace QuizLoop.Tests;

public class UserSyncControllerTests
{
    [Fact]
    public async Task GetProfile_AutoCreatesProfile_ForFirstTimeUser()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = CreateAuthenticatedClient(factory);

        var response = await client.GetAsync("/api/user/profile");
        var profile = await response.Content.ReadFromJsonAsync<UserProfile>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(profile);
        Assert.Equal("test-user-123", profile.Id);
        Assert.Equal("en-US", profile.Locale);
        Assert.Equal(0, profile.StreakCurrent);
        Assert.Equal(0, profile.StreakBest);
        Assert.Equal(0, profile.TotalGames);
        Assert.Equal(0, profile.Coins);
        Assert.False(profile.HasPremium);
    }

    [Fact]
    public async Task GetProfile_ReturnsExistingProfile_ForKnownUser()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = CreateAuthenticatedClient(factory);

        await SeedUserAsync(factory, new UserProfile
        {
            Id = "test-user-123",
            CreatedAt = DateTime.UtcNow.AddDays(-3),
            Locale = "en-US",
            StreakCurrent = 2,
            StreakBest = 4,
            TotalGames = 10,
            AccuracyPct = 72.1,
            Coins = 500,
            HasPremium = false
        });

        var response = await client.GetAsync("/api/user/profile");
        var profile = await response.Content.ReadFromJsonAsync<UserProfile>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(profile);
        Assert.Equal("test-user-123", profile.Id);
        Assert.Equal("en-US", profile.Locale);
        Assert.Equal(2, profile.StreakCurrent);
        Assert.Equal(4, profile.StreakBest);
        Assert.Equal(10, profile.TotalGames);
        Assert.Equal(72.1, profile.AccuracyPct);
        Assert.Equal(500, profile.Coins);
        Assert.False(profile.HasPremium);
    }

    [Fact]
    public async Task SyncProfile_MergesUsingMathMax_ForBestGamesAndCoins()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = CreateAuthenticatedClient(factory);

        await SeedUserAsync(factory, new UserProfile
        {
            Id = "test-user-123",
            CreatedAt = DateTime.UtcNow,
            Locale = "en-US",
            StreakCurrent = 1,
            StreakBest = 10,
            TotalGames = 50,
            AccuracyPct = 40.0,
            Coins = 1000,
            HasPremium = false
        });

        var request = new SyncProfileRequest(
            StreakCurrent: 3,
            StreakBest: 7,
            TotalGames: 48,
            AccuracyPct: 85.5,
            Coins: 800);

        var response = await client.PostAsJsonAsync("/api/user/sync", request);
        var profile = await response.Content.ReadFromJsonAsync<UserProfile>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(profile);
        Assert.Equal(3, profile.StreakCurrent);
        Assert.Equal(10, profile.StreakBest);
        Assert.Equal(50, profile.TotalGames);
        Assert.Equal(85.5, profile.AccuracyPct);
        Assert.Equal(1000, profile.Coins);
    }

    [Fact]
    public async Task SyncProfile_UsesClientHigherValues_WhenTheyExceedServerValues()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = CreateAuthenticatedClient(factory);

        await SeedUserAsync(factory, new UserProfile
        {
            Id = "test-user-123",
            CreatedAt = DateTime.UtcNow,
            Locale = "en-US",
            StreakCurrent = 0,
            StreakBest = 5,
            TotalGames = 20,
            AccuracyPct = 25.0,
            Coins = 100,
            HasPremium = false
        });

        var request = new SyncProfileRequest(
            StreakCurrent: 4,
            StreakBest: 15,
            TotalGames: 30,
            AccuracyPct: 77.7,
            Coins: 500);
        var response = await client.PostAsJsonAsync("/api/user/sync", request);
        var profile = await response.Content.ReadFromJsonAsync<UserProfile>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(profile);
        Assert.Equal(4, profile.StreakCurrent);
        Assert.Equal(15, profile.StreakBest);
        Assert.Equal(30, profile.TotalGames);
        Assert.Equal(77.7, profile.AccuracyPct);
        Assert.Equal(500, profile.Coins);
    }

    [Fact]
    public async Task SyncProfile_WithoutAuth_ReturnsUnauthorized()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var request = new SyncProfileRequest(1, 1, 1, 50, 10);

        var response = await client.PostAsJsonAsync("/api/user/sync", request);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private static HttpClient CreateAuthenticatedClient(TestWebApplicationFactory factory)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(TestAuthHandler.SchemeName);
        return client;
    }

    private static async Task SeedUserAsync(TestWebApplicationFactory factory, UserProfile user)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Users.Add(user);
        await db.SaveChangesAsync();
    }

    private sealed record SyncProfileRequest(
        int StreakCurrent,
        int StreakBest,
        int TotalGames,
        double AccuracyPct,
        int Coins);
}
