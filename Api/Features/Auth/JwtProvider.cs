using System.Text;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Api.Features.Auth;

public sealed class JwtProvider
{
    private static readonly TimeSpan AccessTokenLifetime = TimeSpan.FromMinutes(15);

    private readonly JsonWebTokenHandler _handler = new();
    private readonly string _issuer;
    private readonly string _audience;
    private readonly SigningCredentials _credentials;

    public JwtProvider(IConfiguration configuration)
    {
        var key = configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(key) || Encoding.UTF8.GetByteCount(key) < 32)
        {
            throw new InvalidOperationException("Jwt:Key must be at least 32 bytes (see appsettings / env).");
        }

        _issuer = configuration["Jwt:Issuer"] ?? "gigood";
        _audience = configuration["Jwt:Audience"] ?? "gigood";
        _credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);
    }

    public (string AccessToken, int ExpiresIn) CreateAccessToken(User user)
    {
        var claims = new Dictionary<string, object>
        {
            ["sub"] = user.Id.ToString(),
            ["jti"] = Guid.NewGuid().ToString(),
            ["phone"] = user.Phone,
            ["role"] = user.CurrentRole,
        };

        // Task 12a: drives the "Admin" authorization policy.
        if (user.IsAdmin)
        {
            claims["is_admin"] = "true";
        }

        var descriptor = new SecurityTokenDescriptor
        {
            Issuer = _issuer,
            Audience = _audience,
            IssuedAt = DateTime.UtcNow,
            Expires = DateTime.UtcNow.Add(AccessTokenLifetime),
            SigningCredentials = _credentials,
            Claims = claims,
        };

        return (_handler.CreateToken(descriptor), (int)AccessTokenLifetime.TotalSeconds);
    }
}
