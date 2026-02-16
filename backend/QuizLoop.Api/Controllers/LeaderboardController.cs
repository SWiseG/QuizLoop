using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizLoop.Domain.Entities;
using QuizLoop.Infrastructure.Persistence;

namespace QuizLoop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaderboardController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public LeaderboardController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<LeaderboardEntryDto>>> GetLeaderboard([FromQuery] string period = "alltime")
    {
        var normalizedPeriod = period.Trim().ToLowerInvariant();
        IQueryable<Round> query = _dbContext.Rounds.AsNoTracking();

        if (normalizedPeriod == "daily")
        {
            var dailyStartUtc = DateTime.UtcNow.Date;
            query = query.Where(r => r.StartedAt >= dailyStartUtc);
        }
        else if (normalizedPeriod == "weekly")
        {
            var weeklyStartUtc = DateTime.UtcNow.AddDays(-7);
            query = query.Where(r => r.StartedAt >= weeklyStartUtc);
        }
        else if (normalizedPeriod != "alltime")
        {
            return BadRequest("period must be one of: daily, weekly, alltime.");
        }

        var aggregated = await query
            .GroupBy(r => r.UserId)
            .Select(group => new
            {
                UserId = group.Key,
                TotalScore = group.Sum(round => round.Score),
                GamesPlayed = group.Count()
            })
            .OrderByDescending(entry => entry.TotalScore)
            .ThenBy(entry => entry.UserId)
            .Take(50)
            .ToListAsync();

        var leaderboard = aggregated
            .Select((entry, index) => new LeaderboardEntryDto(
                index + 1,
                entry.UserId,
                entry.TotalScore,
                entry.GamesPlayed))
            .ToList();

        return Ok(leaderboard);
    }

    [HttpPost("submit")]
    [Authorize]
    public async Task<ActionResult<Round>> Submit([FromBody] SubmitScoreDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var nowUtc = DateTime.UtcNow;
        var round = new Round
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            Mode = dto.Mode,
            Score = dto.Score,
            CorrectCount = dto.CorrectCount,
            StartedAt = nowUtc,
            EndedAt = nowUtc
        };

        _dbContext.Rounds.Add(round);
        await _dbContext.SaveChangesAsync();

        return Ok(round);
    }
}

public record SubmitScoreDto(string Mode, int Score, int CorrectCount);
public record LeaderboardEntryDto(int Rank, string UserId, int TotalScore, int GamesPlayed);
