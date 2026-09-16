namespace Api.Features.Escrows;

public sealed record EscrowDto(
    Guid Id,
    Guid JobId,
    Guid PayerId,
    Guid PayeeId,
    decimal Amount,
    string Status,
    DateTime HeldAt,
    DateTime? ReleasedAt)
{
    public static EscrowDto From(Escrow escrow) => new(
        escrow.Id,
        escrow.JobId,
        escrow.PayerId,
        escrow.PayeeId,
        escrow.Amount,
        escrow.Status.ToString(),
        escrow.HeldAt,
        escrow.ReleasedAt);
}
