# 06 — Wallet Escrow Ledger + RowVersion + Billing/Cart

**Goal:** Replace single global `escrowHeldPool` number with real ledger satisfying PRM393 `Billing/Cart` via booking cart + escrow checkout.

**Depends:** 01, 02. **Branch:** `feat/06-escrow` off `master`.

**API contract:**
- `GET /api/wallet/balance -> 200 {balance, escrowHeld, escrowHeldJobs: [{jobId, amount}]}`.
- `GET /api/wallet/transactions?cursor&limit -> 200 {transactions, nextCursor}` where `WalletTransaction {id, userId, type:TopUp|Hold|Release|Refund, amount (+/-), refJobId, createdAt}`.
- `GET /api/escrows?status&jobId -> 200 Escrow[]` where `Escrow {id, jobId, payerId, payeeId, amount, status:Held|Released|Refunded, heldAt, releasedAt?}`.
- Flows:
  - `TopUp POST /api/wallet/topup {amount}` (stub for testing, adds `+Amount` tx + `Wallet.Balance+=`).
  - `POST /api/jobs/{id}/accept (tasker)` -> ledger tx: `payer Wallet.Balance -= amount` + `WalletTransaction Hold -amount` + `Escrows Held` + `Job.Status=Assigned` + `JobApplications` row. Concurrency `RowVersion` check, unique `Escrows(JobId)` prevents double-accept `409`.
  - `POST /api/jobs/{id}/release-escrow {rating, comment}` (seeker) -> `Escrow Released`, payee `Wallet.Balance += amount` + `Release +amount` + `Job.Status=Done` + `Review` row. Validates `Escrow exists & Held & caller is payer`.
  - `POST /api/jobs/{id}/cancel (owner, before accept)` -> no ledger; `POST /api/jobs/{id}/refund` if held but tasker abandons.

**Entities:**
- `Wallets(UserId PK FK->Users, Balance decimal(18,0), RowVersion rowversion)` 1-row per user, created on register with `Balance 1_420_000|2_850_000` mimic seed for demo but real.
- `WalletTransactions` append-only index `UserId, CreatedAt desc`.
- `Escrows` unique `JobId`, index `PayerId, PayeeId`.

**Flutter:**
- `WalletBloc` states `BalanceLoaded(balance, escrowHeld)`, `TransactionsLoaded`.
- Cart = booking cart: `CartCubit` holds `selected JobIds` (multi-select on board) -> checkout `ReleaseEscrow` per job or `Accept` flow.
- UI `wallet card` in header `formatVnd` + `earnings_page` stat cards `totalEarnings sum Release`, `history_page` completed jobs with `ReleaseEscrow` button `Xác nhận & Giải ngân` rating 5 as demo.

**Files to touch:**
- `Api/Features/Wallet/*`, `Api/Features/Escrows/*`, `Api/Data/AppDbContext.cs`, `Api/Features/Jobs/JobsEndpoints.cs` add accept/release logic.
- `app_flutter/lib/features/wallet/{data/*, presentation/bloc/wallet_bloc.dart, presentation/cubit/cart_cubit.dart, pages/wallet_page.dart, pages/transactions_page.dart}`, header `useWallet` refactor.

**Steps:**
1. Migration `WalletEscrowInit` add 3 tables + `RowVersion` (`IsConcurrencyToken()`).
2. Implement `TopUp` for testing + `Balance/Transactions/Escrows` GETs.
3. Implement `Hold` tx in `accept`: `await using var tx = await db.Database.BeginTransactionAsync(); try { wallet.Balance -= amount; db.WalletTransactions.Add(Hold); db.Escrows.Add(Held); job.Status=Assigned; await db.SaveChangesAsync(); await tx.CommitAsync(); } catch (DbUpdateConcurrencyException) => 409 "Retry"`.
4. Implement `Release` similarly.
5. Flutter `WalletBloc` poll `GET /wallet/balance` on resume + after accept/release events via `NotificationHub` `EscrowReleased`.
6. Replace `seekerWallet/taskerWallet` demo numbers with `GET /wallet/balance`.

**Acceptance:**
- Two concurrent `POST /jobs/:id/accept` from two taskers -> one `201` + escrow held, other `409`.
- `GET /wallet/balance` before accept `1_420_000`, after accept `1_270_000` + `escrowHeld 150_000`, after release payer `1_270_000` payee `3_000_000`, ledger history matches.
- Flutter wallet card updates without restart.

**Verification:**
```bash
dotnet ef migrations add WalletEscrowInit
dotnet build Api/
# concurrent curl test
curl -H "Authorization: Bearer $SEEKER" http://localhost:5000/api/wallet/balance | jq .
flutter analyze
```

**Commit:** `feat(wallet): escrow ledger + RowVersion + billing/cart (#06)`

**Risks:** Never `wallet.Balance -= amount` without tx + `RowVersion`. Log `Tx` failures.
