# 06 — Wallet Escrow Ledger + xmin Concurrency + Billing/Cart

**Goal:** Replace single global `escrowHeldPool` number with a real ledger: booking cart + escrow checkout + accept/hold/release/topup wiring.

**Depends:** 01, 02. **Branch:** `feat/06-escrow` off `master`.

**API contract:**
- `GET /api/wallet/balance -> 200 {balance, escrowHeld, escrowHeldJobs: [{jobId, amount}]}`.
- `GET /api/wallet/transactions?cursor&limit -> 200 {transactions, nextCursor}` where `WalletTransaction {id, userId, type:TopUp|Hold|Release|Refund, amount (+/-), refJobId, createdAt}`.
- `GET /api/escrows?status&jobId -> 200 Escrow[]` where `Escrow {id, jobId, payerId, payeeId, amount, status:Held|Released|Refunded, heldAt, releasedAt?}`.
- Flows:
  - `TopUp POST /api/wallet/topup {amount}` (stub for testing, adds `+Amount` tx + `Wallet.Balance+=`).
  - `POST /api/jobs/{id}/accept (tasker)` -> ledger tx: `payer Wallet.Balance -= amount` + `WalletTransaction Hold -amount` + `Escrows Held` + `Job.Status=Assigned` + `JobApplications` row. Concurrency `xmin` token check, unique `Escrows(JobId)` prevents double-accept `409`.
  - `POST /api/jobs/{id}/release-escrow {rating?, comment?}` (seeker) -> `Escrow Released`, payee `Wallet.Balance += amount` + `Release +amount` + `Job.Status=Done`. Rating optional here — `Review` row created by 07 flow if provided, else skipped (decouples 06→07). Validates `Escrow exists & Held & caller is payer (DB CurrentRole, not claim)`.
  - `POST /api/jobs/{id}/cancel (owner, allowed when Status Open|Assigned+not-reported)` -> if Held escrow exists → `Refund` payer +Amount + Escrow Refunded; else no ledger. `POST /api/jobs/{id}/refund` (tasker abandons when Held) same refund path. Unique Escrows(JobId) + status transitions `Held→Released|Refunded` allow re-accept only after Refunded.

**Entities:**
- `Wallets(UserId PK FK->Users, Balance decimal(18,0) CHECK (Balance>=0), Version uint → xmin via IsConcurrencyToken())` 1-row per user, created on register with `Balance 1_420_000|2_850_000` mimic seed for demo but real. Neon-only. Broadcast SignalR only after `CommitAsync`.
- `WalletTransactions` append-only index `UserId, CreatedAt desc`.
- `Escrows` unique `JobId`, index `PayerId, PayeeId`.

**Mobile (Expo):**
- `useWallet` keeps its demo surface: `{balance, escrowHeld, transactions, topUp}` backed by React Query.
- Cart = booking cart: `CartContext` holds `selected JobIds` (multi-select on board) -> checkout `ReleaseEscrow` per job or `Accept` flow.
- UI wallet card in header `formatVnd` + earnings screen stat cards `totalEarnings sum Release`, history screen completed jobs with `Xác nhận & Giải ngân` button.

**Files to touch:**
- `Api/Features/Wallet/*`, `Api/Features/Escrows/*`, `Api/Data/AppDbContext.cs`, `Api/Features/Jobs/JobsEndpoints.cs` add accept/release logic.
- `app_mobile/lib/features/wallet/{api.ts, types.ts, hooks/useWallet.ts, context/CartContext.tsx, screens/wallet.tsx, screens/transactions.tsx}`, header `useWallet` refactor.

**Steps:**
1. Migration `WalletEscrowInit` add 3 tables + `Version uint` mapped to `xmin` (`IsConcurrencyToken()`).
2. Implement `TopUp` for testing + `Balance/Transactions/Escrows` GETs.
3. Implement `Hold` tx in `accept`: `await using var tx = await db.Database.BeginTransactionAsync(); try { wallet.Balance -= amount; db.WalletTransactions.Add(Hold); db.Escrows.Add(Held); job.Status=Assigned; await db.SaveChangesAsync(); await tx.CommitAsync(); } catch (DbUpdateConcurrencyException) => 409 "Retry"`.
4. Implement `Release` similarly.
5. Expo `useWallet` refetch on app focus + after accept/release events via `NotificationHub` `EscrowReleased`.
6. Replace `seekerWallet/taskerWallet` demo numbers with `GET /wallet/balance`.

**Acceptance:**
- Two concurrent `POST /jobs/:id/accept` from two taskers -> one `201` + escrow held, other `409`.
- `GET /wallet/balance` before accept `1_420_000`, after accept `1_270_000` + `escrowHeld 150_000`, after release payer `1_270_000` payee `3_000_000`, ledger history matches.
- Expo wallet card updates without restart.

**Verification:**
```bash
dotnet ef migrations add WalletEscrowInit
dotnet build Api/
# concurrent curl test
curl -H "Authorization: Bearer $SEEKER" http://localhost:5000/api/wallet/balance | jq .
(cd app_mobile && npx tsc --noEmit)
```

**Commit:** `feat(wallet): escrow ledger + xmin + billing/cart (#06)`

**Risks:** Never `wallet.Balance -= amount` without tx + `xmin` check. Log `Tx` failures.
