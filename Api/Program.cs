using System.Text;
using Api.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------
// Data — Neon Postgres only (UseNpgsql). No SQL Server.
// ---------------------------------------------------------------------------
var connectionString = builder.Configuration.GetConnectionString("Default");
if (string.IsNullOrWhiteSpace(connectionString))
{
    // Placeholder until a real Neon pooled URL is wired via
    // ConnectionStrings__Default (see .env.example). No connection is opened at startup.
    connectionString = "Host=__NEON_HOST__;Database=gigood;Username=__NEON_USER__;Password=__NEON_PASSWORD__;SSL Mode=Require";
}

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

// ---------------------------------------------------------------------------
// Auth — JWT bearer. SignalR hubs receive the token via `access_token` query.
// ---------------------------------------------------------------------------
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || Encoding.UTF8.GetByteCount(jwtKey) < 32)
{
    // Dev-only fallback so /health + /swagger run before secrets land (task 01 owns real config).
    jwtKey = "gigood-dev-only-signing-key-32bytes!";
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "gigood",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "gigood",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromSeconds(30),
            NameClaimType = "sub",
            RoleClaimType = "role",
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(accessToken) &&
                    context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            },
        };
    });

builder.Services.AddAuthorization();

// ---------------------------------------------------------------------------
// SignalR (in-box). Hubs are mapped in task 04/05.
// ---------------------------------------------------------------------------
builder.Services.AddSignalR();

// ---------------------------------------------------------------------------
// CORS — Expo + web origins, credentials for SignalR.
// ---------------------------------------------------------------------------
const string CorsPolicy = "AllowExpoWeb";
var allowedOrigins = new[]
{
    builder.Configuration["Cors:ExpoOrigin"] ?? "http://localhost:8081",
    builder.Configuration["Cors:WebOrigin"] ?? "http://localhost:5173",
};

builder.Services.AddCors(options =>
    options.AddPolicy(CorsPolicy, policy =>
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()));

// ---------------------------------------------------------------------------
// Swagger (Swashbuckle) — /swagger
// ---------------------------------------------------------------------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "GiGood API", Version = "v0.0.1" });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" },
            },
            Array.Empty<string>()
        },
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles(); // wwwroot/uploads (task 02)

app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();

// ---------------------------------------------------------------------------
// Phase 0 endpoints
// ---------------------------------------------------------------------------
app.MapGet("/health", () => TypedResults.Ok(new
{
    status = "ok",
    version = "0.0.1",
    time = DateTime.UtcNow,
}));

var meta = app.MapGroup("/api/meta");
meta.MapGet("/categories", () => TypedResults.Ok(new[]
{
    new { key = "repair", label = "Sửa chữa vặt", icon = "wrench" },
    new { key = "cleaning", label = "Dọn dẹp nhà cửa", icon = "trash" },
    new { key = "delivery", label = "Vận chuyển/Giao hàng", icon = "motorcycle" },
    new { key = "helper", label = "Hỗ trợ/Nhờ việc vặt", icon = "handshake-o" },
}));

// Guard stub: proves the auth pipeline; real jobs slice lands in task 02.
app.MapGet("/api/jobs", () => TypedResults.Ok(Array.Empty<object>()))
    .RequireAuthorization();

// TODO task 04/05: app.MapHub<ChatHub>("/hubs/chat"); app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();

public partial class Program;
