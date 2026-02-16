namespace QuizLoop.Domain.Entities;

public class Question
{
    public string Id { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
    public int CorrectIndex { get; set; }
    public string Difficulty { get; set; } = "Medium";
    public string? Explanation { get; set; }
}
