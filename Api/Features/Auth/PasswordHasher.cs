namespace Api.Features.Auth;

public sealed class PasswordHasher
{
    // TECH_STACK_PLAN §6 — BCrypt cost 12.
    private const int WorkFactor = 12;

    public string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

    public bool Verify(string password, string passwordHash) => BCrypt.Net.BCrypt.Verify(password, passwordHash);
}
