using Api.Common;
using Api.Features.Auth;

namespace Api.Features.Wallet;

// Task 06: signed ledger entry types. Stored as text in Postgres.
public enum WalletTransactionType
{
    TopUp,
    Hold,
    Release,
    Refund,
}

// Task 06: one wallet per user (UserId PK). Balance is VND, CHECK >= 0.
// Version maps to the Postgres xmin system column (see AppDbContext).
public class Wallet
{
    public Guid UserId { get; set; }
    public decimal Balance { get; set; }
    public uint Version { get; set; }

    public User User { get; set; } = null!;
}

// Append-only ledger; no update/delete endpoints. Amount is signed:
// negative for Hold (payer), positive for TopUp/Release/Refund.
public class WalletTransaction
{
    public Guid Id { get; set; } = GuidV7.NewGuid();
    public Guid UserId { get; set; }
    public WalletTransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public Guid? RefJobId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
