namespace QuizLoop.Domain.Entities;

public class Question
{
    public string Id { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int CorrectIndex { get; set; }
    public string Difficulty { get; set; } = "Medium";

    public ICollection<QuestionTranslation> Translations { get; set; } = new List<QuestionTranslation>();
}
