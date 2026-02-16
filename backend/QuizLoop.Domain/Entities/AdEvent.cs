namespace QuizLoop.Domain.Entities;

public class AdEvent
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // Interstitial, Rewarded, Banner
    public string Placement { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public long? RevenueMicros { get; set; }
}
