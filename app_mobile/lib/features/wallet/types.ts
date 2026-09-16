/** Mirrors `Api/Features/Wallet/Dtos.cs` + `Api/Features/Escrows/Dtos.cs`. */

export type WalletTransactionType = 'TopUp' | 'Hold' | 'Release' | 'Refund'

export type EscrowStatus = 'Held' | 'Released' | 'Refunded'

/** One still-Held escrow paid by the wallet owner (`escrowHeldJobs` in the balance response). */
export type EscrowHeldJob = {
  jobId: string
  amount: number
}

/** `GET /api/wallet/balance`. */
export type WalletBalance = {
  balance: number
  escrowHeld: number
  escrowHeldJobs: EscrowHeldJob[]
}

/** `GET /api/wallet/transactions`. */
export type WalletTransaction = {
  id: string
  type: WalletTransactionType
  amount: number
  refJobId: string | null
  createdAt: string
}

export type WalletTransactionListResponse = {
  transactions: WalletTransaction[]
  nextCursor: string | null
}

/** `POST /api/wallet/topup`. */
export type TopUpResponse = {
  balance: number
}

/** `GET /api/escrows`. */
export type Escrow = {
  id: string
  jobId: string
  payerId: string
  payeeId: string
  amount: number
  status: EscrowStatus
  heldAt: string
  releasedAt: string | null
}

export type EscrowListParams = {
  status?: EscrowStatus
  jobId?: string
}
