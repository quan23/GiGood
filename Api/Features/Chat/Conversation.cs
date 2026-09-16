using Api.Common;
using Api.Features.Jobs;

namespace Api.Features.Chat;

// Task 04: exactly one persisted conversation per job (unique JobId index makes
// POST /api/conversations idempotent). Messages live in Message.
public class Conversation
{
    public Guid Id { get; set; } = GuidV7.NewGuid();
    public Guid JobId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Job Job { get; set; } = null!;
    public List<Message> Messages { get; set; } = [];
}
