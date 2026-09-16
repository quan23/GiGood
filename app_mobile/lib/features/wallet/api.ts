import apiClient from '../../core/api/client'
import type {
  Escrow,
  EscrowListParams,
  TopUpResponse,
  WalletBalance,
  WalletTransactionListResponse,
} from './types'

/** `GET /api/wallet/balance` -> `{balance, escrowHeld, escrowHeldJobs}`. */
export async function getBalance(): Promise<WalletBalance> {
  const { data } = await apiClient.get<WalletBalance>('/api/wallet/balance')
  return data
}

/** `GET /api/wallet/transactions?cursor&limit` -> `{transactions, nextCursor}`. */
export async function listTransactions(
  cursor?: string,
  limit = 20,
): Promise<WalletTransactionListResponse> {
  const { data } = await apiClient.get<WalletTransactionListResponse>('/api/wallet/transactions', {
    params: { cursor, limit },
  })
  return data
}

/** Testing stub `POST /api/wallet/topup {amount}` -> `{balance}`. */
export async function topUp(amount: number): Promise<TopUpResponse> {
  const { data } = await apiClient.post<TopUpResponse>('/api/wallet/topup', { amount })
  return data
}

/** `GET /api/escrows?status&jobId` -> escrows the caller is payer/payee of. */
export async function listEscrows(params: EscrowListParams = {}): Promise<Escrow[]> {
  const { data } = await apiClient.get<Escrow[]>('/api/escrows', { params })
  return data
}
