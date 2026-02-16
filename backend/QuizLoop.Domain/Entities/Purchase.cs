namespace QuizLoop.Domain.Entities;

public class Purchase
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string Status { get; set; } = "Completed";
    public DateTime PurchasedAt { get; set; } = DateTime.UtcNow;
}
