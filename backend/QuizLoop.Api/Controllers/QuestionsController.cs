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
    public async Task<ActionResult<IReadOnlyList<QuestionDto>>> GetQuestions(
        [FromQuery] string? category = null,
        [FromQuery] string locale = "en",
        [FromQuery] int limit = 10)
    {
        await EnsureSeedDataAsync();

        var take = Math.Clamp(limit, 1, 25);
        var normalizedCategory = NormalizeCategory(category);
        var normalizedLocale = locale.Trim().ToLowerInvariant();

        IQueryable<Question> query = _dbContext.Questions
            .Include(q => q.Translations)
            .AsNoTracking();

        if (normalizedCategory is not null)
        {
            query = query.Where(q => q.Category.ToLower() == normalizedCategory);
        }

        var questions = await query.ToListAsync();

        // Fallback to all questions if category filter returned nothing
        if (questions.Count == 0 && normalizedCategory is not null)
        {
            questions = await _dbContext.Questions
                .Include(q => q.Translations)
                .AsNoTracking()
                .ToListAsync();
        }

        var randomized = questions
            .OrderBy(_ => Guid.NewGuid())
            .Take(take)
            .Select(q => MapToDto(q, normalizedLocale))
            .ToList();

        return Ok(randomized);
    }

    private static QuestionDto MapToDto(Question q, string locale)
    {
        // Try requested locale, fallback to "en"
        var translation = q.Translations.FirstOrDefault(t => t.Locale == locale)
            ?? q.Translations.FirstOrDefault(t => t.Locale == "en")
            ?? q.Translations.FirstOrDefault();

        return new QuestionDto(
            q.Id,
            q.Category,
            translation?.Text ?? "",
            translation?.Options ?? [],
            q.CorrectIndex,
            q.Difficulty,
            translation?.Explanation);
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

        var questions = new List<Question>();

        foreach (var (seed, index) in SeedQuestions.Select((s, i) => (s, i)))
        {
            var question = new Question
            {
                Id = $"seed-{index + 1}",
                Category = seed.Category,
                CorrectIndex = seed.CorrectIndex,
                Difficulty = seed.Difficulty,
                Translations = new List<QuestionTranslation>
                {
                    new()
                    {
                        Locale = "en",
                        Text = seed.TextEn,
                        Options = seed.OptionsEn,
                        Explanation = seed.ExplanationEn
                    },
                    new()
                    {
                        Locale = "pt-br",
                        Text = seed.TextPtBr,
                        Options = seed.OptionsPtBr,
                        Explanation = seed.ExplanationPtBr
                    }
                }
            };
            questions.Add(question);
        }

        _dbContext.Questions.AddRange(questions);
        await _dbContext.SaveChangesAsync();
    }

    private static readonly IReadOnlyList<SeedQuestion> SeedQuestions =
    [
        new("Science",
            "Which planet is known as the Red Planet?", ["Venus", "Jupiter", "Mars", "Saturn"],
            "Mars appears red because of iron oxide on its surface.",
            "Qual planeta é conhecido como Planeta Vermelho?", ["Vênus", "Júpiter", "Marte", "Saturno"],
            "Marte parece vermelho por causa do óxido de ferro em sua superfície.",
            2, "Easy"),

        new("History",
            "In which year did World War II end?", ["1943", "1944", "1945", "1946"],
            "The formal surrender happened in September 1945.",
            "Em que ano a Segunda Guerra Mundial terminou?", ["1943", "1944", "1945", "1946"],
            "A rendição formal aconteceu em setembro de 1945.",
            2, "Medium"),

        new("Sports",
            "Which country won the FIFA World Cup in 2022?", ["France", "Argentina", "Brazil", "Germany"],
            "Argentina won the title in Qatar.",
            "Qual país venceu a Copa do Mundo FIFA em 2022?", ["França", "Argentina", "Brasil", "Alemanha"],
            "A Argentina venceu o título no Catar.",
            1, "Easy"),

        new("Geography",
            "What is the smallest country in the world?", ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
            "Vatican City is about 0.44 square kilometers.",
            "Qual é o menor país do mundo?", ["Mônaco", "Cidade do Vaticano", "San Marino", "Liechtenstein"],
            "A Cidade do Vaticano tem cerca de 0,44 quilômetros quadrados.",
            1, "Easy"),

        new("Science",
            "What is the chemical symbol for gold?", ["Go", "Gd", "Au", "Ag"],
            "Au comes from the Latin word aurum.",
            "Qual é o símbolo químico do ouro?", ["Go", "Gd", "Au", "Ag"],
            "Au vem da palavra latina aurum.",
            2, "Easy"),

        new("History",
            "Who painted the Mona Lisa?", ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"],
            "Leonardo da Vinci painted the Mona Lisa.",
            "Quem pintou a Mona Lisa?", ["Michelangelo", "Rafael", "Leonardo da Vinci", "Donatello"],
            "Leonardo da Vinci pintou a Mona Lisa.",
            2, "Easy"),

        new("Science",
            "What is the hardest natural substance on Earth?", ["Titanium", "Diamond", "Quartz", "Obsidian"],
            "Diamond ranks highest on the Mohs scale.",
            "Qual é a substância natural mais dura da Terra?", ["Titânio", "Diamante", "Quartzo", "Obsidiana"],
            "O diamante ocupa a posição mais alta na escala de Mohs.",
            1, "Medium"),

        new("Geography",
            "Which river is the longest in the world?", ["Amazon", "Nile", "Yangtze", "Mississippi"],
            "The Nile is traditionally listed as the longest river.",
            "Qual é o rio mais longo do mundo?", ["Amazonas", "Nilo", "Yangtzé", "Mississippi"],
            "O Nilo é tradicionalmente listado como o rio mais longo.",
            1, "Medium"),

        new("Technology",
            "Who co-founded Apple Inc.?", ["Bill Gates", "Mark Zuckerberg", "Steve Jobs", "Jeff Bezos"],
            "Apple was founded by Steve Jobs, Steve Wozniak, and Ronald Wayne.",
            "Quem cofundou a Apple Inc.?", ["Bill Gates", "Mark Zuckerberg", "Steve Jobs", "Jeff Bezos"],
            "A Apple foi fundada por Steve Jobs, Steve Wozniak e Ronald Wayne.",
            2, "Easy"),

        new("Science",
            "What gas do plants primarily absorb from the atmosphere?", ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
            "Plants absorb carbon dioxide for photosynthesis.",
            "Qual gás as plantas absorvem principalmente da atmosfera?", ["Oxigênio", "Nitrogênio", "Dióxido de Carbono", "Hidrogênio"],
            "As plantas absorvem dióxido de carbono para a fotossíntese.",
            2, "Easy"),

        new("Entertainment",
            "Which movie won the Oscar for Best Picture in 2020?", ["1917", "Joker", "Parasite", "Ford v Ferrari"],
            "Parasite became the first non-English language winner.",
            "Qual filme ganhou o Oscar de Melhor Filme em 2020?", ["1917", "Coringa", "Parasita", "Ford vs Ferrari"],
            "Parasita se tornou o primeiro vencedor em idioma não inglês.",
            2, "Medium"),

        new("Math",
            "What is the value of pi rounded to two decimal places?", ["3.12", "3.14", "3.16", "3.18"],
            "Pi is approximately 3.14159.",
            "Qual é o valor de pi arredondado para duas casas decimais?", ["3,12", "3,14", "3,16", "3,18"],
            "Pi é aproximadamente 3,14159.",
            1, "Easy")
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
    string TextEn,
    List<string> OptionsEn,
    string? ExplanationEn,
    string TextPtBr,
    List<string> OptionsPtBr,
    string? ExplanationPtBr,
    int CorrectIndex,
    string Difficulty);
