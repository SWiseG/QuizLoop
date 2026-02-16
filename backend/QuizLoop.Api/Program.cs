using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using QuizLoop.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure EF Core — PostgreSQL in production, SQLite in development
var usePostgres = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_URL"));

if (usePostgres)
{
    var pgConnectionString = Environment.GetEnvironmentVariable("DATABASE_URL")!;
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(pgConnectionString));
}
else
{
    var dbPath = Path.Combine(AppContext.BaseDirectory, "quizloop.db");
    var sqliteConnection = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? $"Data Source={dbPath}";
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlite(sqliteConnection));
}

// Configure CORS
builder.Services.AddCors(options =>
{
    // Production: only allow Capacitor/Ionic mobile origins + API domain
    options.AddPolicy("production", policy =>
        policy.WithOrigins(
                "capacitor://localhost",
                "ionic://localhost",
                "https://localhost",
                "https://api.quizloop.app"
            )
            .WithMethods("GET", "POST", "PUT", "DELETE")
            .WithHeaders("Authorization", "Content-Type", "Accept"));

    // Development: permissive for local testing
    options.AddPolicy("dev", policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

// Configure Firebase JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var firebaseProjectId = builder.Configuration["Firebase:ProjectId"] ?? "quizloop-prod";
        options.Authority = $"https://securetoken.google.com/{firebaseProjectId}";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = $"https://securetoken.google.com/{firebaseProjectId}",
            ValidateAudience = true,
            ValidAudience = firebaseProjectId,
            ValidateLifetime = true,
        };
    });

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Ensure database schema is created on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        var provider = db.Database.ProviderName ?? "Unknown";
        logger.LogInformation("Database provider: {Provider}", provider);
        var created = db.Database.EnsureCreated();
        logger.LogInformation("Database EnsureCreated: {Created}", created);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to initialize database");
    }
}

app.UseHttpsRedirection();
app.UseCors(app.Environment.IsDevelopment() ? "dev" : "production");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

public partial class Program { }
