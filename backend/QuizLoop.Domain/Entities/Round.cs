namespace QuizLoop.Domain.Entities;

public class Round
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Mode { get; set; } = "Classic";
    public int Score { get; set; }
    public int CorrectCount { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime EndedAt { get; set; }
}
