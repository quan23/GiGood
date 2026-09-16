using Api.Common;
using Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Api.Features.Jobs;

// Development-only seed for the jobs slice (task 02): category lookup + 2 demo jobs for
// the seeded seeker (Khánh Vy). Best-effort like DevSeed; only fills empty tables.
public static class JobSeed
{
    public static async Task SeedJobsAsync(this WebApplication app)
    {
        if (!app.Environment.IsDevelopment())
        {
            return;
        }

        try
        {
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            if (!await db.Categories.AnyAsync())
            {
                db.Categories.AddRange(
                    new Category { Key = "repair", Label = "Sửa chữa", Icon = "wrench" },
                    new Category { Key = "cleaning", Label = "Dọn dẹp", Icon = "trash" },
                    new Category { Key = "delivery", Label = "Giao hàng", Icon = "motorcycle" },
                    new Category { Key = "helper", Label = "Giúp việc", Icon = "handshake-o" });
                await db.SaveChangesAsync();
            }

            if (await db.Jobs.AnyAsync())
            {
                return;
            }

            var owner = await db.Users.SingleOrDefaultAsync(u => u.Phone == "0901234567");
            if (owner is null)
            {
                return;
            }

            var now = DateTime.UtcNow;
            db.Jobs.AddRange(
                new Job
                {
                    Id = GuidV7.NewGuid(),
                    OwnerId = owner.Id,
                    Title = "Khơi thông thoát sàn",
                    Description = "Thoát sàn bồn rửa bị nghẹt, cần thợ tới xử lý trong hôm nay.",
                    Category = "repair",
                    Price = 150_000,
                    Status = JobStatus.Open,
                    Lat = 10.7769,
                    Lng = 106.7009,
                    LocationText = "Quận 1, TP.HCM",
                    CreatedAt = now.AddMinutes(-30),
                    UpdatedAt = now.AddMinutes(-30),
                },
                new Job
                {
                    Id = GuidV7.NewGuid(),
                    OwnerId = owner.Id,
                    Title = "Giao bánh",
                    Description = "Giao hộp bánh từ tiệm tới nhà khách, quãng đường khoảng 3km.",
                    Category = "delivery",
                    Price = 45_000,
                    Status = JobStatus.Open,
                    Lat = 10.7860,
                    Lng = 106.6900,
                    LocationText = "Quận 3, TP.HCM",
                    CreatedAt = now,
                    UpdatedAt = now,
                });
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            app.Logger.LogWarning(ex, "Dev jobs seed skipped (database unavailable).");
        }
    }
}
