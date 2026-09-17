using System.Text;
using Api.Data;
using Api.Features.Auth;
using Api.Features.Escrows;
using Api.Features.Jobs;
using Api.Features.Notifications;
using Api.Features.Wallet;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Api.Features.Admin;

// Task 12a: display-only admin surface. The whole group requires the "Admin" policy
// (is_admin claim emitted by JwtProvider for IsAdmin users).
public static class AdminEndpoints
{
    private const int DefaultLimit = 20;
    private const int MaxLimit = 50;

    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin").RequireAuthorization("Admin").WithTags("Admin");

        group.MapGet("/stats", GetStatsAsync);
        group.MapGet("/users", ListUsersAsync);
        group.MapPost("/users/{id:guid}/ban", BanUserAsync);
        group.MapGet("/jobs", ListJobsAsync);
        group.MapPost("/jobs/{id:guid}/hide", HideJobAsync);
        group.MapGet("/escrows", ListEscrowsAsync);
        group.MapPost("/escrows/{id:guid}/release", ReleaseEscrowAsync);
        group.MapPost("/escrows/{id:guid}/refund", RefundEscrowAsync);

        return app;
    }

    // Dashboard cards: user count, job counts per status, held escrow sum and today's
    // released volume (UTC day).
    private static async Task<Ok<AdminStatsResponse>> GetStatsAsync(AppDbContext db, CancellationToken ct)
    {
        var users = await db.Users.CountAsync(ct);

        var statusCounts = await db.Jobs.AsNoTracking()
            .GroupBy(j => j.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);
        var counts = statusCounts.ToDictionary(x => x.Status, x => x.Count);

        var jobsByStatus = new AdminJobsByStatusDto(
            counts.GetValueOrDefault(JobStatus.Open),
            counts.GetValueOrDefault(JobStatus.Assigned),
            counts.GetValueOrDefault(JobStatus.Done),
            counts.GetValueOrDefault(JobStatus.Cancelled));

        var escrowHeld = await db.Escrows.AsNoTracking()
            .Where(e => e.Status == EscrowStatus.Held)
            .SumAsync(e => (decimal?)e.Amount, ct) ?? 0m;

        var todayUtc = DateTime.UtcNow.Date;
        var volumeToday = await db.WalletTransactions.AsNoTracking()
            .Where(t => t.Type == WalletTransactionType.Release && t.CreatedAt >= todayUtc)
            .SumAsync(t => (decimal?)t.Amount, ct) ?? 0m;

        return TypedResults.Ok(new AdminStatsResponse(users, jobsByStatus, escrowHeld, volumeToday));
    }

    // Newest-first users with an optional name/phone search; same cursor shape as JobsEndpoints.
    private static async Task<Results<Ok<AdminUserListResponse>, ValidationProblem>> ListUsersAsync(
        AppDbContext db,
        CancellationToken ct,
        string? query = null,
        string? cursor = null,
        int? limit = null)
    {
        var pageSize = Math.Clamp(limit ?? DefaultLimit, 1, MaxLimit);
        var usersQuery = db.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query))
        {
            var pattern = $"%{query.Trim()}%";
            usersQuery = usersQuery.Where(u => EF.Functions.ILike(u.Name, pattern) || EF.Functions.ILike(u.Phone, pattern));
        }

        if (!string.IsNullOrWhiteSpace(cursor))
        {
            if (!TryDecodeCursor(cursor, out var cursorCreatedAt, out var cursorId))
            {
                return ValidationError("cursor", "Cursor không hợp lệ.");
            }

            usersQuery = usersQuery.Where(u =>
                u.CreatedAt < cursorCreatedAt || (u.CreatedAt == cursorCreatedAt && u.Id.CompareTo(cursorId) < 0));
        }

        var rows = await usersQuery
            .OrderByDescending(u => u.CreatedAt)
            .ThenByDescending(u => u.Id)
            .Take(pageSize + 1)
            .ToListAsync(ct);

        var users = rows.Take(pageSize)
            .Select(u => new AdminUserDto(
                u.Id, u.Name, u.Phone, u.CurrentRole, u.RatingAvg, u.Banned, u.IsAdmin, u.CreatedAt))
            .ToList();
        var nextCursor = rows.Count > pageSize ? EncodeCursor(rows[pageSize - 1].CreatedAt, rows[pageSize - 1].Id) : null;

        return TypedResults.Ok(new AdminUserListResponse(users, nextCursor));
    }

    // Ban/unban. Admins cannot be banned; re-sending the current state is a 204 no-op.
    private static async Task<Results<NoContent, NotFound<ErrorResponse>, BadRequest<ErrorResponse>>> BanUserAsync(
        Guid id,
        BanUserRequest request,
        AppDbContext db,
        CancellationToken ct)
    {
        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == id, ct);
        if (user is null)
        {
            return TypedResults.NotFound(new ErrorResponse("Không tìm thấy người dùng."));
        }

        if (request.Banned && user.IsAdmin)
        {
            return TypedResults.BadRequest(new ErrorResponse("Không thể khoá tài khoản quản trị viên."));
        }

        if (user.Banned != request.Banned)
        {
            user.Banned = request.Banned;
            await db.SaveChangesAsync(ct);
        }

        return TypedResults.NoContent();
    }

    // All jobs regardless of Hidden, newest-first, optional status filter.
    private static async Task<Results<Ok<AdminJobListResponse>, ValidationProblem>> ListJobsAsync(
        AppDbContext db,
        CancellationToken ct,
        string? status = null,
        string? cursor = null,
        int? limit = null)
    {
        JobStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<JobStatus>(status, ignoreCase: true, out var parsed))
            {
                return ValidationError("status", "Trạng thái không hợp lệ (Open/Assigned/Done/Cancelled).");
            }

            statusFilter = parsed;
        }

        var pageSize = Math.Clamp(limit ?? DefaultLimit, 1, MaxLimit);
        var jobsQuery = db.Jobs.AsNoTracking();

        if (statusFilter is { } statusValue)
        {
            jobsQuery = jobsQuery.Where(j => j.Status == statusValue);
        }

        if (!string.IsNullOrWhiteSpace(cursor))
        {
            if (!TryDecodeCursor(cursor, out var cursorCreatedAt, out var cursorId))
            {
                return ValidationError("cursor", "Cursor không hợp lệ.");
            }

            jobsQuery = jobsQuery.Where(j =>
                j.CreatedAt < cursorCreatedAt || (j.CreatedAt == cursorCreatedAt && j.Id.CompareTo(cursorId) < 0));
        }

        var rows = await jobsQuery
            .Include(j => j.Owner)
            .OrderByDescending(j => j.CreatedAt)
            .ThenByDescending(j => j.Id)
            .Take(pageSize + 1)
            .ToListAsync(ct);

        var jobs = rows.Take(pageSize)
            .Select(j => new AdminJobDto(
                j.Id,
                j.Title,
                j.Category,
                j.Price,
                j.Status.ToString(),
                j.Hidden,
                new AdminJobOwnerDto(j.Owner.Id, j.Owner.Name, j.Owner.Phone),
                j.CreatedAt))
            .ToList();
        var nextCursor = rows.Count > pageSize ? EncodeCursor(rows[pageSize - 1].CreatedAt, rows[pageSize - 1].Id) : null;

        return TypedResults.Ok(new AdminJobListResponse(jobs, nextCursor));
    }

    // Hide/unhide. Hidden jobs are excluded from the public list; re-sending the current
    // state is a 204 no-op.
    private static async Task<Results<NoContent, NotFound<ErrorResponse>>> HideJobAsync(
        Guid id,
        HideJobRequest request,
        AppDbContext db,
        CancellationToken ct)
    {
        var job = await db.Jobs.SingleOrDefaultAsync(j => j.Id == id, ct);
        if (job is null)
        {
            return TypedResults.NotFound(new ErrorResponse("Không tìm thấy công việc."));
        }

        if (job.Hidden != request.Hidden)
        {
            job.Hidden = request.Hidden;
            job.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
        }

        return TypedResults.NoContent();
    }

    // All escrows + parties. Status filter optional (Held/Released/Refunded), newest held first.
    private static async Task<Results<Ok<AdminEscrowListResponse>, ValidationProblem>> ListEscrowsAsync(
        AppDbContext db,
        CancellationToken ct,
        string? status = null)
    {
        EscrowStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<EscrowStatus>(status, ignoreCase: true, out var parsed))
            {
                return ValidationError("status", "Trạng thái không hợp lệ (Held/Released/Refunded).");
            }

            statusFilter = parsed;
        }

        var query = db.Escrows.AsNoTracking();

        if (statusFilter is { } statusValue)
        {
            query = query.Where(e => e.Status == statusValue);
        }

        var escrows = await query
            .Include(e => e.Job)
            .Include(e => e.Payer)
            .Include(e => e.Payee)
            .OrderByDescending(e => e.HeldAt)
            .ThenByDescending(e => e.Id)
            .ToListAsync(ct);

        var dtos = escrows
            .Select(e => new AdminEscrowDto(
                e.Id,
                e.JobId,
                e.Job.Title,
                new AdminPartyDto(e.PayerId, e.Payer.Name),
                new AdminPartyDto(e.PayeeId, e.Payee.Name),
                e.Amount,
                e.Status.ToString(),
                e.HeldAt,
                e.ReleasedAt))
            .ToList();

        return TypedResults.Ok(new AdminEscrowListResponse(dtos));
    }

    // Force Held -> Released via the shared task 06 ledger (wallet credit + Release row,
    // escrow Released, job Done). Notification is post-commit + best-effort.
    private static async Task<Results<NoContent, NotFound<ErrorResponse>, Conflict<ErrorResponse>>> ReleaseEscrowAsync(
        Guid id,
        AppDbContext db,
        EscrowLedgerService ledger,
        NotificationService notifications,
        CancellationToken ct)
    {
        var result = await ledger.ReleaseAsync(db, id, ct);
        if (!result.Succeeded)
        {
            if (result.NotFound)
            {
                return TypedResults.NotFound(new ErrorResponse(result.Error!));
            }

            return TypedResults.Conflict(new ErrorResponse(result.Error!));
        }

        await notifications.CreateAndSendAsync(
            db,
            result.Escrow!.PayeeId,
            NotificationTypes.EscrowReleased,
            "Đã giải ngân",
            $"Bạn nhận được {NotificationService.FormatVnd(result.Escrow.Amount)} cho \"{result.Job!.Title}\"",
            result.Job.Id,
            ct);

        return TypedResults.NoContent();
    }

    // Force Held -> Refunded via the shared task 06 ledger (payer credit + Refund row,
    // escrow Refunded, job Open). Notification is post-commit + best-effort.
    private static async Task<Results<NoContent, NotFound<ErrorResponse>, Conflict<ErrorResponse>>> RefundEscrowAsync(
        Guid id,
        AppDbContext db,
        EscrowLedgerService ledger,
        NotificationService notifications,
        CancellationToken ct)
    {
        var result = await ledger.RefundAsync(db, id, ct);
        if (!result.Succeeded)
        {
            if (result.NotFound)
            {
                return TypedResults.NotFound(new ErrorResponse(result.Error!));
            }

            return TypedResults.Conflict(new ErrorResponse(result.Error!));
        }

        await notifications.CreateAndSendAsync(
            db,
            result.Escrow!.PayerId,
            NotificationTypes.EscrowReleased,
            "Đã hoàn tiền",
            $"Khoản {NotificationService.FormatVnd(result.Escrow.Amount)} cho \"{result.Job!.Title}\" đã được hoàn lại vào ví của bạn.",
            result.Job.Id,
            ct);

        return TypedResults.NoContent();
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
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('_', '/');
}
