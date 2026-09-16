using System.Security.Claims;
using System.Text;
using Api.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Api.Features.Notifications;

public static class NotificationsEndpoints
{
    private const int DefaultLimit = 20;
    private const int MaxLimit = 50;

    public static IEndpointRouteBuilder MapNotificationsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/notifications").RequireAuthorization();

        group.MapGet("/", ListAsync);
        group.MapPost("/mark-read", MarkReadAsync);
        group.MapDelete("/", DeleteAsync);

        return app;
    }

    // Newest-first by (CreatedAt, Id), same cursor encoding as JobsEndpoints. `unreadCount`
    // is the caller's total unread count, not just the current page.
    private static async Task<Results<Ok<NotificationListResponse>, ValidationProblem, UnauthorizedHttpResult>> ListAsync(
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
        var query = db.Notifications.AsNoTracking().Where(n => n.UserId == userId);

        if (!string.IsNullOrWhiteSpace(cursor))
        {
            if (!TryDecodeCursor(cursor, out var cursorCreatedAt, out var cursorId))
            {
                return ValidationError("cursor", "Cursor không hợp lệ.");
            }

            query = query.Where(n =>
                n.CreatedAt < cursorCreatedAt || (n.CreatedAt == cursorCreatedAt && n.Id.CompareTo(cursorId) < 0));
        }

        var unreadCount = await db.Notifications.CountAsync(n => n.UserId == userId && !n.Read, ct);

        var rows = await query
            .OrderByDescending(n => n.CreatedAt)
            .ThenByDescending(n => n.Id)
            .Take(pageSize + 1)
            .ToListAsync(ct);

        var notifications = rows.Take(pageSize).Select(NotificationDto.From).ToList();
        var nextCursor = rows.Count > pageSize ? EncodeCursor(rows[pageSize - 1].CreatedAt, rows[pageSize - 1].Id) : null;

        return TypedResults.Ok(new NotificationListResponse(notifications, nextCursor, unreadCount));
    }

    // `{ids?[] | all:true}`; only the caller's rows can be touched (the user filter is
    // always part of the update predicate).
    private static async Task<Results<NoContent, ValidationProblem, UnauthorizedHttpResult>> MarkReadAsync(
        MarkNotificationsReadRequest request,
        ClaimsPrincipal principal,
        AppDbContext db,
        CancellationToken ct)
    {
        var userId = GetUserId(principal);
        if (userId is null)
        {
            return TypedResults.Unauthorized();
        }

        var ids = request.Ids?.Where(id => id != Guid.Empty).ToList();
        if (request.All != true && (ids is null || ids.Count == 0))
        {
            return ValidationError("ids", "Cần cung cấp danh sách ids hoặc all=true.");
        }

        var query = db.Notifications.Where(n => n.UserId == userId && !n.Read);
        if (request.All != true)
        {
            query = query.Where(n => ids!.Contains(n.Id));
        }

        await query.ExecuteUpdateAsync(setters => setters.SetProperty(n => n.Read, true), ct);

        return TypedResults.NoContent();
    }

    private static async Task<Results<NoContent, UnauthorizedHttpResult>> DeleteAsync(
        ClaimsPrincipal principal,
        AppDbContext db,
        CancellationToken ct)
    {
        var userId = GetUserId(principal);
        if (userId is null)
        {
            return TypedResults.Unauthorized();
        }

        await db.Notifications.Where(n => n.UserId == userId).ExecuteDeleteAsync(ct);

        return TypedResults.NoContent();
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
