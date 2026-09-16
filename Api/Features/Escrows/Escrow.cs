using Api.Common;
using Api.Features.Auth;
using Api.Features.Jobs;

namespace Api.Features.Escrows;

// Task 06: escrow lifecycle. Stored as text in Postgres; re-accept only after Refunded.
public enum EscrowStatus
{
    Held,
    Released,
    Refunded,
}

// Task 06: one escrow per job (unique JobId). Payer = job owner, payee = accepted tasker.
// The row is reused (updated back to Held) when a job is re-accepted after a refund.
public class Escrow
{
    public Guid Id { get; set; } = GuidV7.NewGuid();
    public Guid JobId { get; set; }
    public Guid PayerId { get; set; }
    public Guid PayeeId { get; set; }
    public decimal Amount { get; set; }
    public EscrowStatus Status { get; set; } = EscrowStatus.Held;
    public DateTime HeldAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReleasedAt { get; set; }

    public Job Job { get; set; } = null!;
    public User Payer { get; set; } = null!;
    public User Payee { get; set; } = null!;
}
