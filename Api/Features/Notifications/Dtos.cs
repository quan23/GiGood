namespace Api.Features.Notifications;

public sealed record NotificationDto(
    Guid Id,
    string Type,
    string Title,
    string Body,
    Guid? JobId,
    bool Read,
    DateTime CreatedAt)
{
    public static NotificationDto From(Notification notification) => new(
        notification.Id,
        notification.Type,
        notification.Title,
        notification.Body,
        notification.JobId,
        notification.Read,
        notification.CreatedAt);
}

public sealed record NotificationListResponse(List<NotificationDto> Notifications, string? NextCursor, int UnreadCount);

// `ids` (non-empty) or `all: true` is required; checked in the endpoint.
public sealed record MarkNotificationsReadRequest(List<Guid>? Ids, bool? All);
