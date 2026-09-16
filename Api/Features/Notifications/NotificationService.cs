using System.Globalization;
using Api.Data;
using Api.Features.Escrows;
using Api.Features.Jobs;
using Api.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Api.Features.Notifications;

// Task 05: create + broadcast helper. Notifications are best-effort by contract — callers
// use it AFTER their own commit and a failure here never fails the main action.
public sealed class NotificationService(IHubContext<NotificationHub> hub, ILogger<NotificationService> logger)
{
    private const int PreviewMaxLength = 120;
    private const int NewJobFanOutCap = 100;
    private static readonly CultureInfo VndCulture = CultureInfo.GetCultureInfo("vi-VN");

    public async Task CreateAndSendAsync(
        AppDbContext db,
        Guid userId,
        string type,
        string title,
        string body,
        Guid? jobId,
        CancellationToken ct)
    {
        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Body = body,
            JobId = jobId,
            CreatedAt = DateTime.UtcNow,
        };

        try
        {
            db.Notifications.Add(notification);
            await db.SaveChangesAsync(ct);

            await hub.Clients.User(userId.ToString())
                .SendAsync("NewNotification", NotificationDto.From(notification), ct);
        }
        catch (Exception ex)
        {
            // Never bubble up: the core flow already committed. Detach so a failed
            // insert cannot leak into the caller's change tracker.
            if (db.Entry(notification).State != EntityState.Detached)
            {
                db.Entry(notification).State = EntityState.Detached;
            }

            logger.LogWarning(ex, "Notification create/send failed (user {UserId}, type {Type}).", userId, type);
        }
    }

    // CreateJob fan-out: every other seeker (capped) gets the "Việc mới" notification.
    public async Task NotifyNewJobAsync(AppDbContext db, Job job, CancellationToken ct)
    {
        try
        {
            var seekerIds = await db.Users.AsNoTracking()
                .Where(u => u.CurrentRole == "seeker" && u.Id != job.OwnerId)
                .OrderByDescending(u => u.CreatedAt)
                .Take(NewJobFanOutCap)
                .Select(u => u.Id)
                .ToListAsync(ct);

            var body = $"{job.Category} · {FormatVnd(job.Price)} · {job.LocationText ?? "Không rõ vị trí"}";
            foreach (var seekerId in seekerIds)
            {
                await CreateAndSendAsync(
                    db, seekerId, NotificationTypes.JobMatched, $"Việc mới: {job.Title}", body, job.Id, ct);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "New-job notification fan-out failed (job {JobId}).", job.Id);
        }
    }

    // Chat fan-out to the other side of the job: the owner when the sender is not the
    // owner, plus the accepted tasker (escrow Held/Released). On an Open job where the
    // owner replies, the counterpart is the latest non-owner writer. Silent no-op when
    // only the sender exists.
    public async Task NotifyChatMessageAsync(
        AppDbContext db,
        Guid jobId,
        Guid ownerId,
        Guid senderId,
        string body,
        CancellationToken ct = default)
    {
        try
        {
            var preview = body.Trim();
            if (preview.Length == 0)
            {
                return;
            }

            if (preview.Length > PreviewMaxLength)
            {
                preview = preview[..(PreviewMaxLength - 3)] + "...";
            }

            var recipients = new HashSet<Guid>();
            if (ownerId != senderId)
            {
                recipients.Add(ownerId);
            }

            var payeeId = await db.Escrows.AsNoTracking()
                .Where(e => e.JobId == jobId && (e.Status == EscrowStatus.Held || e.Status == EscrowStatus.Released))
                .Select(e => (Guid?)e.PayeeId)
                .SingleOrDefaultAsync(ct);

            if (payeeId is { } payee)
            {
                recipients.Add(payee);
            }
            else if (senderId == ownerId)
            {
                var peerId = await db.Messages.AsNoTracking()
                    .Where(m => m.Conversation.JobId == jobId && m.SenderId != senderId)
                    .OrderByDescending(m => m.CreatedAt)
                    .ThenByDescending(m => m.Id)
                    .Select(m => (Guid?)m.SenderId)
                    .FirstOrDefaultAsync(ct);

                if (peerId is { } peer)
                {
                    recipients.Add(peer);
                }
            }

            recipients.Remove(senderId);
            if (recipients.Count == 0)
            {
                return;
            }

            foreach (var recipient in recipients)
            {
                await CreateAndSendAsync(db, recipient, NotificationTypes.NewMessage, "Tin nhắn mới", preview, jobId, ct);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Chat notification fan-out failed (job {JobId}, sender {SenderId}).", jobId, senderId);
        }
    }

    // User-facing VND style used in notification bodies (vi-VN thousands separators).
    public static string FormatVnd(decimal amount) => amount.ToString("N0", VndCulture) + "đ";
}
