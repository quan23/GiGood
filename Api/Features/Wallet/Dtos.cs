namespace Api.Features.Wallet;

public sealed record EscrowHeldJobDto(Guid JobId, decimal Amount);

public sealed record WalletBalanceResponse(decimal Balance, decimal EscrowHeld, List<EscrowHeldJobDto> EscrowHeldJobs);

public sealed record WalletTransactionDto(Guid Id, string Type, decimal Amount, Guid? RefJobId, DateTime CreatedAt);

public sealed record WalletTransactionListResponse(List<WalletTransactionDto> Transactions, string? NextCursor);

public sealed record TopUpRequest(decimal Amount);

public sealed record TopUpResponse(decimal Balance);
