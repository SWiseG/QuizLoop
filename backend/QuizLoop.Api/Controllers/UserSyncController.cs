using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizLoop.Domain.Entities;
using QuizLoop.Infrastructure.Persistence;

namespace QuizLoop.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/user")]
public class UserSyncController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public UserSyncController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("profile")]
    public async Task<ActionResult<UserProfile>> GetProfile()
    {
        var userId = GetFirebaseUid();
        if (userId is null)
        {
            return Unauthorized();
        }

        var profile = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (profile is null)
        {
            profile = new UserProfile
            {
                Id = userId,
                CreatedAt = DateTime.UtcNow,
                Locale = "en-US",
                StreakCurrent = 0,
                StreakBest = 0,
                TotalGames = 0,
                AccuracyPct = 0,
                Coins = 0,
                HasPremium = false
            };

            _dbContext.Users.Add(profile);
            await _dbContext.SaveChangesAsync();
        }

        return Ok(profile);
    }

    [HttpPost("sync")]
    public async Task<ActionResult<UserProfile>> SyncProfile([FromBody] SyncProfileDto dto)
    {
        var userId = GetFirebaseUid();
        if (userId is null)
        {
            return Unauthorized();
        }

        var profile = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (profile is null)
        {
            profile = new UserProfile
            {
                Id = userId,
                CreatedAt = DateTime.UtcNow,
                Locale = "en-US",
                HasPremium = false
            };
            _dbContext.Users.Add(profile);
        }

        profile.StreakCurrent = dto.StreakCurrent;
        profile.StreakBest = Math.Max(profile.StreakBest, dto.StreakBest);
        profile.TotalGames = Math.Max(profile.TotalGames, dto.TotalGames);
        profile.AccuracyPct = dto.AccuracyPct;
        profile.Coins = Math.Max(profile.Coins, dto.Coins);

        await _dbContext.SaveChangesAsync();

        return Ok(profile);
    }

    private string? GetFirebaseUid()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }
}

public record SyncProfileDto(int StreakCurrent, int StreakBest, int TotalGames, double AccuracyPct, int Coins);
