using Api.Common;
using Api.Data;
using Api.Features.Jobs;
using Api.Features.Wallet;
using Microsoft.EntityFrameworkCore;

namespace Api.Features.Escrows;

// Task 12a: shared escrow release/refund ledger logic. Task 06's job endpoints and the
// admin force endpoints both call these methods. Each call owns its transaction (wallet
// credit + ledger row + escrow/job status flip, xmin concurrency on the job); the caller
// maps the outcome to HTTP and sends the post-commit notifications.
public sealed class EscrowLedgerService
{
    // Held -> Released: credit the payee, write the Release ledger row, mark the escrow
    // Released and the job Done. Returns the credited balance for the response.
    public async Task<EscrowLedgerResult> ReleaseAsync(AppDbContext db, Guid escrowId, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var escrow = await db.Escrows.SingleOrDefaultAsync(e => e.Id == escrowId, ct);
        if (escrow is null)
        {
            return EscrowLedgerResult.NotFoundResult("Không tìm thấy ký quỹ.");
        }

        if (escrow.Status != EscrowStatus.Held)
        {
            return EscrowLedgerResult.Conflict("Khoản ký quỹ không còn đang được giữ.");
        }

        var job = await db.Jobs.SingleOrDefaultAsync(j => j.Id == escrow.JobId, ct);
        if (job is null)
        {
            return EscrowLedgerResult.NotFoundResult("Không tìm thấy công việc.");
        }

        var payeeWallet = await db.Wallets.SingleOrDefaultAsync(w => w.UserId == escrow.PayeeId, ct);
        if (payeeWallet is null)
        {
            return EscrowLedgerResult.Conflict("Ví của người nhận việc không tồn tại.");
        }

        var now = DateTime.UtcNow;
        payeeWallet.Balance += escrow.Amount;
        db.WalletTransactions.Add(new WalletTransaction
        {
            Id = GuidV7.NewGuid(),
            UserId = escrow.PayeeId,
            Type = WalletTransactionType.Release,
            Amount = escrow.Amount,
            RefJobId = job.Id,
            CreatedAt = now,
        });

        escrow.Status = EscrowStatus.Released;
        escrow.ReleasedAt = now;
        job.Status = JobStatus.Done;
        job.UpdatedAt = now;

        try
        {
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return EscrowLedgerResult.Conflict("Công việc vừa được cập nhật, vui lòng thử lại.");
        }

        return EscrowLedgerResult.Ok(escrow, job, payeeWallet.Balance);
    }

    // Held -> Refunded: credit the payer, write the Refund ledger row, mark the escrow
    // Refunded, the job Open and clear the completion flag (fresh re-accept cycle).
    public async Task<EscrowLedgerResult> RefundAsync(AppDbContext db, Guid escrowId, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var escrow = await db.Escrows.SingleOrDefaultAsync(e => e.Id == escrowId, ct);
        if (escrow is null)
        {
            return EscrowLedgerResult.NotFoundResult("Không tìm thấy ký quỹ.");
        }

        if (escrow.Status != EscrowStatus.Held)
        {
            return EscrowLedgerResult.Conflict("Khoản ký quỹ không còn đang được giữ.");
        }

        var job = await db.Jobs.SingleOrDefaultAsync(j => j.Id == escrow.JobId, ct);
        if (job is null)
        {
            return EscrowLedgerResult.NotFoundResult("Không tìm thấy công việc.");
        }

        var payerWallet = await db.Wallets.SingleOrDefaultAsync(w => w.UserId == escrow.PayerId, ct);
        if (payerWallet is null)
        {
            return EscrowLedgerResult.Conflict("Ví của người đăng việc không tồn tại.");
        }

        var now = DateTime.UtcNow;
        payerWallet.Balance += escrow.Amount;
        db.WalletTransactions.Add(new WalletTransaction
        {
            Id = GuidV7.NewGuid(),
            UserId = escrow.PayerId,
            Type = WalletTransactionType.Refund,
            Amount = escrow.Amount,
            RefJobId = job.Id,
            CreatedAt = now,
        });

        escrow.Status = EscrowStatus.Refunded;
        escrow.ReleasedAt = now;
        job.Status = JobStatus.Open;
        job.IsCompletedReported = false;
        job.UpdatedAt = now;

        try
        {
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return EscrowLedgerResult.Conflict("Công việc vừa được cập nhật, vui lòng thử lại.");
        }

        return EscrowLedgerResult.Ok(escrow, job, payerWallet.Balance);
    }
}

// Outcome of a ledger transition: Ok carries the updated rows + fresh wallet balance;
// otherwise Error maps to 404 (NotFound) or 409 (Conflict) on the caller side.
public sealed record EscrowLedgerResult(
    bool Succeeded,
    bool NotFound,
    string? Error,
    Escrow? Escrow,
    Job? Job,
    decimal Balance)
{
    public static EscrowLedgerResult Ok(Escrow escrow, Job job, decimal balance) =>
        new(true, false, null, escrow, job, balance);

    public static EscrowLedgerResult NotFoundResult(string error) =>
        new(false, true, error, null, null, 0m);

    public static EscrowLedgerResult Conflict(string error) =>
        new(false, false, error, null, null, 0m);
}
