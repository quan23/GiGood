namespace Api.Features.Chat;

public sealed record CreateConversationRequest(Guid JobId);

public sealed record SendMessageRequest(string Body);

public sealed record ConversationDto(Guid Id, Guid JobId, DateTime CreatedAt);

public sealed record ConversationJobDto(Guid Id, string Title, string Status, string Category, decimal Price);

public sealed record ConversationPeerDto(Guid Id, string Name, string? AvatarUrl);

// List preview shape — messageId + sender + preview, the conversationId is the parent.
public sealed record ConversationLastMessageDto(Guid Id, string Body, Guid SenderId, DateTime CreatedAt);

// `peer` is the counterpart: job owner for a tasker, latest non-owner sender for the owner
// (null only while an owner's conversation has no tasker message yet).
public sealed record ConversationListItemDto(
    Guid Id,
    Guid JobId,
    ConversationJobDto Job,
    ConversationPeerDto? Peer,
    ConversationLastMessageDto? LastMessage,
    int UnreadCount);

public sealed record MessageDto(Guid Id, Guid ConversationId, Guid SenderId, string Body, DateTime CreatedAt);

public sealed record MessageListResponse(List<MessageDto> Messages, string? NextCursor);
