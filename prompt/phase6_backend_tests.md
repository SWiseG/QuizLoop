# Prompt: Backend — Corrigir Solution + Criar Projeto de Testes

You are working on the **QuizLoop** backend (.NET 10 / ASP.NET Core 10). Your job is to fix the empty solution file and create an integration test project. Read the entire prompt before running any command.

---

## Project Context

| Item | Value |
|---|---|
| **Directory** | `c:\Projects\QuizLoop\backend` |
| **Framework** | .NET 10, ASP.NET Core 10 |
| **Solution file** | `QuizLoop.slnx` — EXISTS but is EMPTY (no projects referenced) |
| **Projects** | `QuizLoop.Api`, `QuizLoop.Application`, `QuizLoop.Domain`, `QuizLoop.Infrastructure` |
| **Database** | SQLite via EF Core (`AppDbContext`) |
| **Auth** | JWT Bearer (Firebase token validation) — already configured in `Program.cs` |
| **Controllers** | `LeaderboardController` (GET leaderboard + POST submit) and `UserSyncController` (GET profile + POST sync) |
| **`Program.cs`** | Uses top-level statements. Already has `public partial class Program { }` at the bottom. |

### AppDbContext (in `QuizLoop.Infrastructure/Persistence/`)

```csharp
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<UserProfile> Users => Set<UserProfile>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<Round> Rounds => Set<Round>();
    public DbSet<AdEvent> AdEvents => Set<AdEvent>();
    public DbSet<Purchase> Purchases => Set<Purchase>();
}
```

### Domain Entities

```csharp
// UserProfile.cs
public class UserProfile {
    public string Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Locale { get; set; }
    public int StreakCurrent { get; set; }
    public int StreakBest { get; set; }
    public int TotalGames { get; set; }
    public double AccuracyPct { get; set; }
    public int Coins { get; set; }
    public bool HasPremium { get; set; }
}

// Round.cs
public class Round {
    public string Id { get; set; }
    public string UserId { get; set; }
    public string Mode { get; set; }
    public int Score { get; set; }
    public int CorrectCount { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime EndedAt { get; set; }
}
```

### DTOs (defined in controller files)

```csharp
public record SubmitScoreDto(string Mode, int Score, int CorrectCount);
public record LeaderboardEntryDto(int Rank, string UserId, int TotalScore, int GamesPlayed);
public record SyncProfileDto(int StreakCurrent, int StreakBest, int TotalGames, double AccuracyPct, int Coins);
```

---

## Task 1: Fix the Solution File

Run from `c:\Projects\QuizLoop\backend`:

```powershell
dotnet sln QuizLoop.slnx add QuizLoop.Api\QuizLoop.Api.csproj
dotnet sln QuizLoop.slnx add QuizLoop.Application\QuizLoop.Application.csproj
dotnet sln QuizLoop.slnx add QuizLoop.Domain\QuizLoop.Domain.csproj
dotnet sln QuizLoop.slnx add QuizLoop.Infrastructure\QuizLoop.Infrastructure.csproj
```

Verify with `dotnet build` — should build all 4 projects with zero errors.

---

## Task 2: Create Test Project

Run from `c:\Projects\QuizLoop\backend`:

```powershell
dotnet new xunit -n QuizLoop.Tests -o QuizLoop.Tests
dotnet sln QuizLoop.slnx add QuizLoop.Tests\QuizLoop.Tests.csproj
dotnet add QuizLoop.Tests\QuizLoop.Tests.csproj reference QuizLoop.Api\QuizLoop.Api.csproj
dotnet add QuizLoop.Tests\QuizLoop.Tests.csproj reference QuizLoop.Infrastructure\QuizLoop.Infrastructure.csproj
dotnet add QuizLoop.Tests\QuizLoop.Tests.csproj reference QuizLoop.Domain\QuizLoop.Domain.csproj
dotnet add QuizLoop.Tests\QuizLoop.Tests.csproj package Microsoft.AspNetCore.Mvc.Testing
dotnet add QuizLoop.Tests\QuizLoop.Tests.csproj package Microsoft.EntityFrameworkCore.InMemory
```

Delete the generated `UnitTest1.cs` — we'll create proper test files.

---

## Task 3: Create `TestWebApplicationFactory.cs`

**File:** `backend/QuizLoop.Tests/TestWebApplicationFactory.cs`

This factory must:

1. Replace `AppDbContext` with InMemory database (unique name per test class to avoid collisions)
2. Add a **fake authentication handler** so `[Authorize]` endpoints accept requests
3. Set the fake user's `ClaimTypes.NameIdentifier` to `"test-user-123"`

```csharp
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using QuizLoop.Infrastructure.Persistence;

namespace QuizLoop.Tests;

public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove the real AppDbContext registration
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (descriptor != null) services.Remove(descriptor);

            // Add InMemory database
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase($"TestDb_{Guid.NewGuid()}"));

            // Replace authentication with a fake test scheme
            services.AddAuthentication(defaultScheme: "TestScheme")
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                    "TestScheme", _ => { });
        });
    }
}

public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder) { }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "test-user-123"),
            new Claim(ClaimTypes.Name, "TestUser"),
        };
        var identity = new ClaimsIdentity(claims, "TestScheme");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "TestScheme");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
```

---

## Task 4: Create `LeaderboardControllerTests.cs`

**File:** `backend/QuizLoop.Tests/LeaderboardControllerTests.cs`

Test all these scenarios:

### 4A. GET `/api/leaderboard` — Empty database

- Send `GET /api/leaderboard`
- Assert: 200 OK, body is an empty JSON array `[]`

### 4B. GET `/api/leaderboard?period=daily` — Daily filter

- Seed the InMemory DB through `AppDbContext` with:
  - Round A: `UserId = "user-1"`, `Score = 500`, `StartedAt = DateTime.UtcNow` (today)
  - Round B: `UserId = "user-2"`, `Score = 300`, `StartedAt = DateTime.UtcNow.AddDays(-2)` (2 days ago)
- Send `GET /api/leaderboard?period=daily`
- Assert: Only Round A appears, Round B is excluded

### 4C. GET `/api/leaderboard?period=weekly` — Weekly filter

- Same seed as above
- Send `GET /api/leaderboard?period=weekly`
- Assert: Both rounds appear (both within 7 days)

### 4D. GET `/api/leaderboard?period=invalid` — Invalid period

- Send `GET /api/leaderboard?period=invalid`
- Assert: 400 BadRequest

### 4E. GET `/api/leaderboard` — Sorted by total score, max 50

- Seed 3 rounds: user-1 with scores 200+300 (total 500), user-2 with score 600
- Assert: user-2 is rank 1, user-1 is rank 2

### 4F. POST `/api/leaderboard/submit` — Authenticated

- Send `POST /api/leaderboard/submit` with body `{ "mode": "classic", "score": 800, "correctCount": 8 }`
- Assert: 200 OK, returned round has `UserId = "test-user-123"`, `Score = 800`

### 4G. POST `/api/leaderboard/submit` — No auth

- Create a separate `HttpClient` WITHOUT the test auth handler (use `CreateClient()` from a factory that doesn't add auth, or remove the auth header)
- Assert: 401 Unauthorized

**Implementation note for seeding:** Get `AppDbContext` from the factory's service scope:

```csharp
using var scope = factory.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
db.Rounds.Add(new Round { ... });
await db.SaveChangesAsync();
```

---

## Task 5: Create `UserSyncControllerTests.cs`

**File:** `backend/QuizLoop.Tests/UserSyncControllerTests.cs`

### 5A. GET `/api/user/profile` — New user (auto-create)

- Send `GET /api/user/profile` (authenticated as `test-user-123`)
- Assert: 200 OK, profile has `Id = "test-user-123"`, all stats at 0

### 5B. GET `/api/user/profile` — Existing user

- Seed a `UserProfile` with `Id = "test-user-123"`, `Coins = 500`, `TotalGames = 10`
- Send `GET /api/user/profile`
- Assert: Returns the seeded profile values

### 5C. POST `/api/user/sync` — Merge logic

- Seed a `UserProfile` with `Id = "test-user-123"`, `StreakBest = 10`, `TotalGames = 50`, `Coins = 1000`
- Send `POST /api/user/sync` with body: `{ "streakCurrent": 3, "streakBest": 7, "totalGames": 48, "accuracyPct": 85.5, "coins": 800 }`
- Assert the merge result:
  - `StreakCurrent = 3` (client value used directly)
  - `StreakBest = 10` (server had higher: `Math.Max(10, 7)`)
  - `TotalGames = 50` (server had higher: `Math.Max(50, 48)`)
  - `AccuracyPct = 85.5` (client value used directly)
  - `Coins = 1000` (server had higher: `Math.Max(1000, 800)`)

### 5D. POST `/api/user/sync` — Merge when client is higher

- Seed profile with `StreakBest = 5`, `TotalGames = 20`, `Coins = 100`
- Sync with `StreakBest = 15`, `TotalGames = 30`, `Coins = 500`
- Assert: all values updated to client's higher values

### 5E. POST `/api/user/sync` — Unauthenticated

- Send without auth → Assert 401

---

## Execution Order

1. Fix `QuizLoop.slnx` (add all 4 existing projects)
2. Run `dotnet build` — verify all 4 projects build
3. Create xUnit test project + add references + NuGet packages
4. Delete `UnitTest1.cs`
5. Create `TestWebApplicationFactory.cs`
6. Create `LeaderboardControllerTests.cs` (7 tests)
7. Create `UserSyncControllerTests.cs` (5 tests)
8. Run `dotnet test` — all 12 tests must pass
9. Run `dotnet build` — verify no regressions

---

## Verification

```powershell
cd c:\Projects\QuizLoop\backend
dotnet build
dotnet test --verbosity normal
```

Expected output for `dotnet test`:

- **12 tests passed**, 0 failed, 0 skipped

> [!CAUTION]
>
> - Do NOT modify `Program.cs` — it already has `public partial class Program { }` at the bottom
> - Do NOT modify any controller or service code
> - Do NOT change the database from SQLite to anything else in the main project — only the test project uses InMemory
> - The `TestAuthHandler` fakes auth with `ClaimTypes.NameIdentifier = "test-user-123"` — this is the user ID that `[Authorize]` endpoints will see
