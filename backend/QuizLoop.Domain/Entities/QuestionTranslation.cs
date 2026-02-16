namespace QuizLoop.Domain.Entities;

public class QuestionTranslation
{
    public int Id { get; set; }
    public string QuestionId { get; set; } = string.Empty;
    public string Locale { get; set; } = "en";
    public string Text { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
    public string? Explanation { get; set; }

    public Question Question { get; set; } = null!;
}
