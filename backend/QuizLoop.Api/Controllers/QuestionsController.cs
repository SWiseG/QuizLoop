using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizLoop.Domain.Entities;
using QuizLoop.Infrastructure.Persistence;

namespace QuizLoop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuestionsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public QuestionsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<QuestionDto>>> GetQuestions([FromQuery] string? category = null, [FromQuery] int limit = 10)
    {
        await EnsureSeedDataAsync();

        var take = Math.Clamp(limit, 1, 25);
        var normalizedCategory = NormalizeCategory(category);

        IQueryable<Question> query = _dbContext.Questions.AsNoTracking();
        if (normalizedCategory is not null)
        {
            query = query.Where(q => q.Category.ToLower() == normalizedCategory);
        }

        var questions = await query.ToListAsync();
        if (questions.Count == 0 && normalizedCategory is not null)
        {
            questions = await _dbContext.Questions.AsNoTracking().ToListAsync();
        }

        var randomized = questions
            .OrderBy(_ => Guid.NewGuid())
            .Take(take)
            .Select(q => new QuestionDto(
                q.Id,
                q.Category,
                q.Text,
                q.Options,
                q.CorrectIndex,
                q.Difficulty,
                q.Explanation))
            .ToList();

        return Ok(randomized);
    }

    private static string? NormalizeCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category))
        {
            return null;
        }

        var normalized = category.Trim().ToLowerInvariant();
        if (normalized is "daily" or "classic")
        {
            return null;
        }

        return normalized;
    }

    private async Task EnsureSeedDataAsync()
    {
        if (await _dbContext.Questions.AnyAsync())
        {
            return;
        }

        var seeded = SeedQuestions
            .Select((question, index) => new Question
            {
                Id = $"seed-{index + 1}",
                Category = question.Category,
                Text = question.Text,
                Options = question.Options,
                CorrectIndex = question.CorrectIndex,
                Difficulty = question.Difficulty,
                Explanation = question.Explanation
            })
            .ToList();

        _dbContext.Questions.AddRange(seeded);
        await _dbContext.SaveChangesAsync();
    }

    private static readonly IReadOnlyList<SeedQuestion> SeedQuestions =
    [
        new("Science", "Which planet is known as the Red Planet?", ["Venus", "Jupiter", "Mars", "Saturn"], 2, "Easy", "Mars appears red because of iron oxide on its surface."),
        new("History", "In which year did World War II end?", ["1943", "1944", "1945", "1946"], 2, "Medium", "The formal surrender happened in September 1945."),
        new("Sports", "Which country won the FIFA World Cup in 2022?", ["France", "Argentina", "Brazil", "Germany"], 1, "Easy", "Argentina won the title in Qatar."),
        new("Geography", "What is the smallest country in the world?", ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], 1, "Easy", "Vatican City is about 0.44 square kilometers."),
        new("Science", "What is the chemical symbol for gold?", ["Go", "Gd", "Au", "Ag"], 2, "Easy", "Au comes from the Latin word aurum."),
        new("History", "Who painted the Mona Lisa?", ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"], 2, "Easy", "Leonardo da Vinci painted the Mona Lisa."),
        new("Science", "What is the hardest natural substance on Earth?", ["Titanium", "Diamond", "Quartz", "Obsidian"], 1, "Medium", "Diamond ranks highest on the Mohs scale."),
        new("Geography", "Which river is the longest in the world?", ["Amazon", "Nile", "Yangtze", "Mississippi"], 1, "Medium", "The Nile is traditionally listed as the longest river."),
        new("Technology", "Who co-founded Apple Inc.?", ["Bill Gates", "Mark Zuckerberg", "Steve Jobs", "Jeff Bezos"], 2, "Easy", "Apple was founded by Steve Jobs, Steve Wozniak, and Ronald Wayne."),
        new("Science", "What gas do plants primarily absorb from the atmosphere?", ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], 2, "Easy", "Plants absorb carbon dioxide for photosynthesis."),
        new("Entertainment", "Which movie won the Oscar for Best Picture in 2020?", ["1917", "Joker", "Parasite", "Ford v Ferrari"], 2, "Medium", "Parasite became the first non-English language winner."),
        new("Math", "What is the value of pi rounded to two decimal places?", ["3.12", "3.14", "3.16", "3.18"], 1, "Easy", "Pi is approximately 3.14159.")
    ];
}

public record QuestionDto(
    string Id,
    string Category,
    string Text,
    IReadOnlyList<string> Options,
    int CorrectIndex,
    string Difficulty,
    string? Explanation);

public record SeedQuestion(
    string Category,
    string Text,
    List<string> Options,
    int CorrectIndex,
    string Difficulty,
    string? Explanation);
