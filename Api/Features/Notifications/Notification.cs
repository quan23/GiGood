using Api.Common;
using Api.Features.Auth;

namespace Api.Features.Notifications;

// Task 05: persisted, per-user notification. `Type` is a free string; the values in use are
// JobMatched | EscrowReleased | NewMessage plus the extra `Welcome` sent on register.
public class Notification
{
    public Guid Id { get; set; } = GuidV7.NewGuid();
    public Guid UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public Guid? JobId { get; set; }
    public bool Read { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

// Task 05: `Welcome` is the extra register value (the documented job/escrow/chat events use
// the other three). String column, so no enum/migration coupling.
public static class NotificationTypes
{
    public const string Welcome = "Welcome";
    public const string JobMatched = "JobMatched";
    public const string EscrowReleased = "EscrowReleased";
    public const string NewMessage = "NewMessage";
}
