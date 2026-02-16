using Microsoft.EntityFrameworkCore;
using QuizLoop.Domain.Entities;

namespace QuizLoop.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<UserProfile> Users => Set<UserProfile>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<QuestionTranslation> QuestionTranslations => Set<QuestionTranslation>();
    public DbSet<Round> Rounds => Set<Round>();
    public DbSet<AdEvent> AdEvents => Set<AdEvent>();
    public DbSet<Purchase> Purchases => Set<Purchase>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Question>(entity =>
        {
            entity.HasMany(q => q.Translations)
                .WithOne(t => t.Question)
                .HasForeignKey(t => t.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QuestionTranslation>(entity =>
        {
            entity.HasIndex(t => new { t.QuestionId, t.Locale }).IsUnique();

            entity.Property(t => t.Options)
                .HasConversion(
                    v => string.Join('|', v),
                    v => v.Split('|', StringSplitOptions.RemoveEmptyEntries).ToList());
        });
    }
}
