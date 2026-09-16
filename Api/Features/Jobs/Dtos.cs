using Api.Features.Escrows;

namespace Api.Features.Jobs;

public sealed record CreateJobRequest(
    string Title,
    string Description,
    string Category,
    decimal Price,
    double? Lat,
    double? Lng,
    string? LocationText,
    List<string>? Images);

public sealed record UpdateJobRequest(
    string? Title,
    string? Description,
    string? Category,
    decimal? Price,
    string? LocationText,
    double? Lat,
    double? Lng);

public sealed record JobOwnerDto(Guid Id, string Name, string? AvatarUrl, double RatingAvg);

// `distanceKm` is only set for lat/lng queries.
public sealed record JobDto(
    Guid Id,
    JobOwnerDto Owner,
    string Title,
    string Description,
    string Category,
    decimal Price,
    string Status,
    double? Lat,
    double? Lng,
    double? DistanceKm,
    string? LocationText,
    List<string> Images,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record JobListResponse(List<JobDto> Jobs, string? NextCursor);

// Task 06 escrow transitions return the updated escrow + the credited/debited wallet balance.
public sealed record JobEscrowResponse(EscrowDto Escrow, decimal Balance);

public sealed record CategoryDto(string Key, string Label, string Icon);
