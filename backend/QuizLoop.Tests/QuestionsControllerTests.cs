using System.Net;
using System.Net.Http.Json;

namespace QuizLoop.Tests;

public class QuestionsControllerTests
{
    [Fact]
    public async Task GetQuestions_ReturnsSeededQuestions_WithDefaultLimit()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/questions");
        var payload = await response.Content.ReadFromJsonAsync<List<QuestionResponse>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(payload);
        Assert.Equal(10, payload.Count);
        Assert.All(payload, question => Assert.NotEmpty(question.Options));
    }

    [Fact]
    public async Task GetQuestions_WithCategoryFilter_ReturnsMatchingQuestions()
    {
        await using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/questions?category=history&limit=20");
        var payload = await response.Content.ReadFromJsonAsync<List<QuestionResponse>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(payload);
        Assert.NotEmpty(payload);
        Assert.All(payload, question => Assert.Equal("History", question.Category));
    }

    private sealed record QuestionResponse(
        string Id,
        string Category,
        string Text,
        IReadOnlyList<string> Options,
        int CorrectIndex,
        string Difficulty,
        string? Explanation);
}
