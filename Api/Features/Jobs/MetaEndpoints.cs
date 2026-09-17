using Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Api.Features.Jobs;

// Public lookups (task 02, no auth): category chips for the mobile/web clients.
public static class MetaEndpoints
{
    public static IEndpointRouteBuilder MapMetaEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/meta").WithTags("Meta");

        group.MapGet("/categories", async (AppDbContext db, CancellationToken ct) =>
        {
            var categories = await db.Categories.AsNoTracking()
                .OrderBy(c => c.Id)
                .Select(c => new CategoryDto(c.Key, c.Label, c.Icon))
                .ToListAsync(ct);

            return TypedResults.Ok(categories);
        });

        return app;
    }
}
