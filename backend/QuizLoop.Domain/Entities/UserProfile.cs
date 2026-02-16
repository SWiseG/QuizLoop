namespace QuizLoop.Domain.Entities;

public class UserProfile
{
    public string Id { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Locale { get; set; } = "en-US";
    public int StreakCurrent { get; set; }
    public int StreakBest { get; set; }
    public int TotalGames { get; set; }
    public double AccuracyPct { get; set; }
    public int Coins { get; set; }
    public bool HasPremium { get; set; }
}
