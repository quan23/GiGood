using System.Security.Claims;
using Api.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Api.Features.Escrows;

public static class EscrowsEndpoints
{
    public static IEndpointRouteBuilder MapEscrowsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/escrows").RequireAuthorization();

        group.MapGet("/", ListAsync);

        return app;
    }

    // Escrows the caller is part of (payer or payee), optional status/job filters.
    private static async Task<Results<Ok<List<EscrowDto>>, ValidationProblem, UnauthorizedHttpResult>> ListAsync(
        ClaimsPrincipal principal,
        AppDbContext db,
        CancellationToken ct,
        string? status = null,
        Guid? jobId = null)
    {
        var userId = GetUserId(principal);
        if (userId is null)
        {
            return TypedResults.Unauthorized();
        }

        EscrowStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<EscrowStatus>(status, ignoreCase: true, out var parsed))
            {
                return ValidationError("status", "Trạng thái không hợp lệ (Held/Released/Refunded).");
            }

            statusFilter = parsed;
        }

        var query = db.Escrows.AsNoTracking()
            .Where(e => e.PayerId == userId || e.PayeeId == userId);

        if (statusFilter is { } statusValue)
        {
            query = query.Where(e => e.Status == statusValue);
        }

        if (jobId.HasValue)
        {
            query = query.Where(e => e.JobId == jobId.Value);
        }

        var escrows = await query
            .OrderByDescending(e => e.HeldAt)
            .ThenByDescending(e => e.Id)
            .ToListAsync(ct);

        return TypedResults.Ok(escrows.Select(EscrowDto.From).ToList());
    }

    // Inbound claim mapping may rename `sub`; same reading as Auth/Jobs endpoints.
    private static Guid? GetUserId(ClaimsPrincipal principal)
    {
        var raw = principal.FindFirstValue("sub") ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out var id) ? id : null;
    }

    private static ValidationProblem ValidationError(string field, string message) =>
        TypedResults.ValidationProblem(new Dictionary<string, string[]> { [field] = [message] });
}
