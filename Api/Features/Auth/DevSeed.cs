using Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Api.Features.Auth;

// Development-only quick-login accounts (Khánh Vy / Minh Quân). Best-effort: an unreachable
// DB or missing migration must never stop the API from starting. Full seed is task 10.
public static class DevSeed
{
    private const string DemoPassword = "123456";

    public static async Task SeedDevAuthAsync(this WebApplication app)
    {
        if (!app.Environment.IsDevelopment())
        {
            return;
        }

        try
        {
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var hasher = scope.ServiceProvider.GetRequiredService<PasswordHasher>();
            var seeded = false;

            if (!await db.Users.AnyAsync(u => u.Phone == "0901234567"))
            {
                db.Users.Add(new User
                {
                    Phone = "0901234567",
                    Name = "Khánh Vy",
                    PasswordHash = hasher.Hash(DemoPassword),
                    CurrentRole = "seeker",
                    Location = "Quận 1, TP.HCM",
                });
                seeded = true;
            }

            if (!await db.Users.AnyAsync(u => u.Phone == "0912345678"))
            {
                db.Users.Add(new User
                {
                    Phone = "0912345678",
                    Name = "Minh Quân",
                    PasswordHash = hasher.Hash(DemoPassword),
                    CurrentRole = "tasker",
                    Location = "Quận Bình Thạnh, TP.HCM",
                    Skills = "[\"repair\", \"delivery\"]",
                    Bio = "Thợ sửa chữa vặt & giao hàng",
                    Availability = "all-day",
                    Vehicle = "motorbike",
                });
                seeded = true;
            }

            if (seeded)
            {
                await db.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            app.Logger.LogWarning(ex, "Dev auth seed skipped (database unavailable).");
        }
    }
}
