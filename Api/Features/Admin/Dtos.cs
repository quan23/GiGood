namespace Api.Features.Admin;

// Task 12a: display-only admin dashboard contract (task 12 web consumes it).
public sealed record AdminStatsResponse(
    int Users,
    AdminJobsByStatusDto JobsByStatus,
    decimal EscrowHeld,
    decimal VolumeToday);

public sealed record AdminJobsByStatusDto(int Open, int Assigned, int Done, int Cancelled);

public sealed record AdminUserListResponse(List<AdminUserDto> Users, string? NextCursor);

public sealed record AdminUserDto(
    Guid Id,
    string Name,
    string Phone,
    string Role,
    double RatingAvg,
    bool Banned,
    bool IsAdmin,
    DateTime CreatedAt);

public sealed record BanUserRequest(bool Banned);

public sealed record AdminJobListResponse(List<AdminJobDto> Jobs, string? NextCursor);

public sealed record AdminJobDto(
    Guid Id,
    string Title,
    string Category,
    decimal Price,
    string Status,
    bool Hidden,
    AdminJobOwnerDto Owner,
    DateTime CreatedAt);

public sealed record AdminJobOwnerDto(Guid Id, string Name, string Phone);

public sealed record AdminEscrowListResponse(List<AdminEscrowDto> Escrows);

public sealed record AdminEscrowDto(
    Guid Id,
    Guid JobId,
    string JobTitle,
    AdminPartyDto Payer,
    AdminPartyDto Payee,
    decimal Amount,
    string Status,
    DateTime HeldAt,
    DateTime? ReleasedAt);

public sealed record AdminPartyDto(Guid Id, string Name);

public sealed record HideJobRequest(bool Hidden);
