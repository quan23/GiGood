using System.Security.Claims;
using System.Text;
using Api.Common;
using Api.Data;
using Api.Features.Auth;
using Api.Features.Escrows;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Api.Features.Wallet;

public static class WalletEndpoints
{
    private const int DefaultLimit = 20;
    private const int MaxLimit = 50;

    public static IEndpointRouteBuilder MapWalletEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/wallet").RequireAuthorization();

        group.MapGet("/balance", GetBalanceAsync);
        group.MapGet("/transactions", ListTransactionsAsync);
        group.MapPost("/topup", TopUpAsync);

        return app;
    }

    // {balance, escrowHeld, escrowHeldJobs:[{jobId, amount}]} — escrowHeld only counts
    // escrows this user pays for and that are still Held.
    private static async Task<Results<Ok<WalletBalanceResponse>, UnauthorizedHttpResult>> GetBalanceAsync(
        ClaimsPrincipal principal,
        AppDbContext db,
        CancellationToken ct)
    {
        var userId = GetUserId(principal);
        if (userId is null)
        {
            return TypedResults.Unauthorized();
        }

        var balance = await db.Wallets.AsNoTracking()
            .Where(w => w.UserId == userId)
            .Select(w => (decimal?)w.Balance)
            .SingleOrDefaultAsync(ct) ?? 0m;

        var heldJobs = await db.Escrows.AsNoTracking()
            .Where(e => e.PayerId == userId && e.Status == EscrowStatus.Held)
            .OrderByDescending(e => e.HeldAt)
            .Select(e => new EscrowHeldJobDto(e.JobId, e.Amount))
            .ToListAsync(ct);

        return TypedResults.Ok(new WalletBalanceResponse(balance, heldJobs.Sum(j => j.Amount), heldJobs));
    }

    // Append-only history, newest-first by (CreatedAt, Id); same cursor encoding as JobsEndpoints.
    private static async Task<Results<Ok<WalletTransactionListResponse>, ValidationProblem, UnauthorizedHttpResult>> ListTransactionsAsync(
        ClaimsPrincipal principal,
        AppDbContext db,
        CancellationToken ct,
        string? cursor = null,
        int? limit = null)
    {
        var userId = GetUserId(principal);
        if (userId is null)
        {
            return TypedResults.Unauthorized();
        }

        var pageSize = Math.Clamp(limit ?? DefaultLimit, 1, MaxLimit);
        var query = db.WalletTransactions.AsNoTracking().Where(t => t.UserId == userId);

        if (!string.IsNullOrWhiteSpace(cursor))
        {
            if (!TryDecodeCursor(cursor, out var cursorCreatedAt, out var cursorId))
            {
                return ValidationError("cursor", "Cursor không hợp lệ.");
            }

            query = query.Where(t =>
                t.CreatedAt < cursorCreatedAt || (t.CreatedAt == cursorCreatedAt && t.Id.CompareTo(cursorId) < 0));
        }

        var rows = await query
            .OrderByDescending(t => t.CreatedAt)
            .ThenByDescending(t => t.Id)
            .Take(pageSize + 1)
            .ToListAsync(ct);

        var transactions = rows.Take(pageSize)
            .Select(t => new WalletTransactionDto(t.Id, t.Type.ToString(), t.Amount, t.RefJobId, t.CreatedAt))
            .ToList();
        var nextCursor = rows.Count > pageSize ? EncodeCursor(rows[pageSize - 1].CreatedAt, rows[pageSize - 1].Id) : null;

        return TypedResults.Ok(new WalletTransactionListResponse(transactions, nextCursor));
    }

    // Testing stub: adds +Amount to the wallet and one TopUp ledger row in a single tx.
    private static async Task<Results<Ok<TopUpResponse>, ValidationProblem, NotFound<ErrorResponse>, Conflict<ErrorResponse>, UnauthorizedHttpResult>> TopUpAsync(
        TopUpRequest request,
        IValidator<TopUpRequest> validator,
        ClaimsPrincipal principal,
        AppDbContext db,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return TypedResults.ValidationProblem(validation.ToDictionary());
        }

        var userId = GetUserId(principal);
        if (userId is null)
        {
            return TypedResults.Unauthorized();
        }

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var wallet = await db.Wallets.SingleOrDefaultAsync(w => w.UserId == userId, ct);
        if (wallet is null)
        {
            return TypedResults.NotFound(new ErrorResponse("Không tìm thấy ví."));
        }

        wallet.Balance += request.Amount;
        db.WalletTransactions.Add(new WalletTransaction
        {
            Id = GuidV7.NewGuid(),
            UserId = userId.Value,
            Type = WalletTransactionType.TopUp,
            Amount = request.Amount,
            CreatedAt = DateTime.UtcNow,
        });

        try
        {
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return TypedResults.Conflict(new ErrorResponse("Ví vừa được cập nhật, vui lòng thử lại."));
        }

        return TypedResults.Ok(new TopUpResponse(wallet.Balance));
    }

    // Inbound claim mapping may rename `sub`; same reading as Auth/Jobs endpoints.
    private static Guid? GetUserId(ClaimsPrincipal principal)
    {
        var raw = principal.FindFirstValue("sub") ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out var id) ? id : null;
    }

    private static ValidationProblem ValidationError(string field, string message) =>
        TypedResults.ValidationProblem(new Dictionary<string, string[]> { [field] = [message] });

    // Same cursor encoding as JobsEndpoints: `createdAt.Ticks|id:N` base64url.
    private static string EncodeCursor(DateTime createdAt, Guid id) =>
        Base64UrlEncode(Encoding.UTF8.GetBytes($"{createdAt.Ticks}|{id:N}"));

    private static bool TryDecodeCursor(string raw, out DateTime createdAt, out Guid id)
    {
        createdAt = default;
        id = default;

        try
        {
            var base64 = raw.Replace('-', '+').Replace('_', '/');
            base64 = base64.PadRight(base64.Length + (4 - base64.Length % 4) % 4, '=');
            var parts = Encoding.UTF8.GetString(Convert.FromBase64String(base64)).Split('|');

            if (parts.Length != 2 || !long.TryParse(parts[0], out var ticks) || !Guid.TryParseExact(parts[1], "N", out id))
            {
                return false;
            }

            createdAt = new DateTime(ticks, DateTimeKind.Utc);
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
