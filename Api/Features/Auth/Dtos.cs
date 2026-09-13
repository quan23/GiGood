namespace Api.Features.Auth;

public sealed record RegisterRequest(
    string Name,
    string Phone,
    string Password,
    string Location,
    string Role,
    TaskerProfileRequest? TaskerProfile);

public sealed record TaskerProfileRequest(
    List<string>? Skills,
    string? Bio,
    string? Availability,
    string? Vehicle);

public sealed record LoginRequest(string Phone, string Password);

// Shared by /refresh and /revoke — the opaque token travels in the body (anonymous revoke).
public sealed record TokenRequest(string RefreshToken);

public sealed record AuthResponse(UserDto User, string AccessToken, string RefreshToken, int ExpiresIn);

public sealed record TokenPair(string AccessToken, string RefreshToken, int ExpiresIn);

public sealed record UserDto(
    Guid Id,
    string Phone,
    string Name,
    string? AvatarUrl,
    string? Location,
    double RatingAvg,
    string CurrentRole,
    TaskerProfileDto? TaskerProfile,
    DateTime CreatedAt);

public sealed record TaskerProfileDto(List<string> Skills, string Bio, string Availability, string Vehicle, bool Verified);

// `wallet` stays null until task 06.
public sealed record MeResponse(UserDto User, object? Wallet);

public sealed record ErrorResponse(string Message);
