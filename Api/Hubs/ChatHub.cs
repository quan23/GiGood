using System.Security.Claims;
using Api.Data;
using Api.Features.Chat;
using Api.Features.Jobs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Api.Hubs;

// Task 04: /hubs/chat. Group per job (canonical job id string), no auto-join on connect —
// clients call JoinJobGroup after opening a chat. The bearer token arrives via the
// `access_token` query (OnMessageReceived in Program.cs). Messages are persisted and
// committed before the broadcast (GLM P8).
[Authorize]
public class ChatHub(AppDbContext db) : Hub
{
    private const int MaxBodyLength = 2000;

    public async Task JoinJobGroup(string jobId)
    {
        var (job, _) = await ResolveParticipantAsync(jobId);
        await Groups.AddToGroupAsync(Context.ConnectionId, job.Id.ToString());
    }

    public async Task SendMessage(string jobId, string? body)
    {
        var trimmed = body?.Trim() ?? string.Empty;
        if (trimmed.Length is 0 or > MaxBodyLength)
        {
            throw new HubException("Tin nhắn phải có từ 1 đến 2000 ký tự.");
        }

        var (job, userId) = await ResolveParticipantAsync(jobId);

        var conversation = await db.Conversations.SingleOrDefaultAsync(c => c.JobId == job.Id);
        if (conversation is null)
        {
            conversation = new Conversation { JobId = job.Id, CreatedAt = DateTime.UtcNow };
            db.Conversations.Add(conversation);

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
            {
                // Rare race with REST/another client creating the conversation first.
                db.Entry(conversation).State = EntityState.Detached;
                conversation = await db.Conversations.SingleAsync(c => c.JobId == job.Id);
            }
        }

        var message = new Message
        {
            ConversationId = conversation.Id,
            SenderId = userId,
            Body = trimmed,
            CreatedAt = DateTime.UtcNow,
        };

        db.Messages.Add(message);
        await db.SaveChangesAsync(); // commit before the broadcast (GLM P8)

        await Clients.Group(job.Id.ToString()).SendAsync("ReceiveMessage", new MessageDto(
            message.Id, message.ConversationId, message.SenderId, message.Body, message.CreatedAt));
    }

    public Task Typing(string jobId, bool isTyping)
    {
        var userId = GetUserId() ?? throw new HubException("Bạn cần đăng nhập.");
        var group = Guid.TryParse(jobId, out var id) ? id.ToString() : jobId;

        // Only group members (checked on join) can receive this.
        return Clients.OthersInGroup(group).SendAsync("Typing", new { jobId = group, userId, isTyping });
    }

    // Participant rule until jobs carry an assignee (task 06): owner or Open job.
    private async Task<(Job Job, Guid UserId)> ResolveParticipantAsync(string jobId)
    {
        var userId = GetUserId() ?? throw new HubException("Bạn cần đăng nhập để sử dụng trò chuyện.");

        if (!Guid.TryParse(jobId, out var id))
        {
            throw new HubException("Công việc không hợp lệ.");
        }

        var job = await db.Jobs.AsNoTracking().SingleOrDefaultAsync(j => j.Id == id);
        if (job is null)
        {
            throw new HubException("Không tìm thấy công việc.");
        }

        if (job.OwnerId != userId && job.Status != JobStatus.Open)
        {
            throw new HubException("Bạn không phải là người tham gia công việc này.");
        }

        return (job, userId);
    }

    private Guid? GetUserId()
    {
        // Inbound claim mapping may rename `sub`; same reading as the REST endpoints.
        var raw = Context.User?.FindFirstValue("sub") ?? Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out var id) ? id : null;
    }
}
