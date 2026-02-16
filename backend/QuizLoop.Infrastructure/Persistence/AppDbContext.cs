using Microsoft.EntityFrameworkCore;
using QuizLoop.Domain.Entities;

namespace QuizLoop.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<UserProfile> Users => Set<UserProfile>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<Round> Rounds => Set<Round>();
    public DbSet<AdEvent> AdEvents => Set<AdEvent>();
    public DbSet<Purchase> Purchases => Set<Purchase>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configuration for complex types or naming if needed
        modelBuilder.Entity<Question>().Property(q => q.Options)
            .HasConversion(
                v => string.Join('|', v),
                v => v.Split('|', StringSplitOptions.RemoveEmptyEntries).ToList());
    }
}
