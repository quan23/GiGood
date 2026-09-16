using Api.Common;
using Api.Features.Auth;

namespace Api.Features.Chat;

// Task 04: chat message. Body is capped at 2000 chars by the DB column + validators.
public class Message
{
    public Guid Id { get; set; } = GuidV7.NewGuid();
    public Guid ConversationId { get; set; }
    public Guid SenderId { get; set; }
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Conversation Conversation { get; set; } = null!;
    public User Sender { get; set; } = null!;
}
