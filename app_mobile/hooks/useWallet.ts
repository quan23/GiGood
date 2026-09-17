import { useEffect, useMemo } from 'react'
import { AppState } from 'react-native'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { USE_MOCK } from '../lib/core/config/env'
import * as walletApi from '../lib/features/wallet/api'
import {
  mockGetBalance,
  mockListEscrows,
  mockListTransactions,
  mockTopUp,
} from '../lib/features/wallet/mock'
import type {
  Escrow,
  EscrowListParams,
  TopUpResponse,
  WalletBalance,
  WalletTransactionListResponse,
} from '../lib/features/wallet/types'

export const walletQueryKey = ['wallet'] as const
export const walletTransactionsQueryKey = ['wallet', 'transactions'] as const
export const escrowsQueryKey = (params?: EscrowListParams) =>
  ['escrows', params ?? {}] as const

// One AppState listener for the whole app: refetch the ledger whenever the app
// comes back to the foreground (task 06: "refetch on app focus").
let focusListenerBound = false

function ensureWalletFocusRefetch(queryClient: QueryClient): void {
  if (focusListenerBound) return
  focusListenerBound = true

  let previous = AppState.currentState
  AppState.addEventListener('change', (next) => {
    const cameToForeground = /inactive|background/.test(previous) && next === 'active'
    previous = next
    if (cameToForeground) {
      void queryClient.invalidateQueries({ queryKey: walletQueryKey })
      void queryClient.invalidateQueries({ queryKey: ['escrows'] })
    }
  })
}

/**
 * Ledger-backed wallet. Demo surface kept from the old hook
 * (`{balance, escrowHeld, transactions, topUp}`) plus `escrowHeldJobs`,
 * `loading` and `refetch`. With `EXPO_PUBLIC_USE_MOCK=1` the same contract is
 * served from the in-memory store in `lib/features/wallet/mock.ts`.
 */
export function useWallet() {
  const { profile, currentRole } = useAuth()
  const queryClient = useQueryClient()
  const userId = profile?.id ?? 'mock-user'
  const isSeeker = currentRole === 'seeker'

  useEffect(() => {
    ensureWalletFocusRefetch(queryClient)
  }, [queryClient])

  const balanceQuery = useQuery<WalletBalance>({
    queryKey: walletQueryKey,
    enabled: USE_MOCK || !!profile,
    queryFn: () =>
      USE_MOCK ? Promise.resolve(mockGetBalance(userId, currentRole)) : walletApi.getBalance(),
  })

  const transactionsQuery = useQuery<WalletTransactionListResponse>({
    queryKey: walletTransactionsQueryKey,
    enabled: USE_MOCK || !!profile,
    queryFn: () =>
      USE_MOCK
        ? Promise.resolve(mockListTransactions(userId, currentRole))
        : walletApi.listTransactions(undefined, 20),
  })

  const topUpMutation = useMutation<TopUpResponse, unknown, number>({
    mutationFn: (amount: number) =>
      USE_MOCK
        ? Promise.resolve(mockTopUp(userId, currentRole, amount))
        : walletApi.topUp(amount),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: walletQueryKey })
    },
  })

  const refetch = async () => {
    await Promise.all([balanceQuery.refetch(), transactionsQuery.refetch()])
  }

  return {
    balance: balanceQuery.data?.balance ?? 0,
    escrowHeld: balanceQuery.data?.escrowHeld ?? 0,
    escrowHeldJobs: balanceQuery.data?.escrowHeldJobs ?? [],
    transactions: transactionsQuery.data?.transactions ?? [],
    topUp: topUpMutation.mutateAsync,
    isToppingUp: topUpMutation.isPending,
    isSeeker,
    loading: balanceQuery.isLoading,
    refreshing: balanceQuery.isRefetching,
    error: balanceQuery.error,
    refetch,
  }
}

/** Escrows the caller is payer/payee of (`GET /api/escrows?status&jobId`). */
export function useEscrows(params?: EscrowListParams) {
  const { profile } = useAuth()
  const userId = profile?.id ?? 'mock-user'

  const query = useQuery<Escrow[]>({
    queryKey: escrowsQueryKey(params),
    enabled: USE_MOCK || !!profile,
    queryFn: () =>
      USE_MOCK ? Promise.resolve(mockListEscrows(userId, params)) : walletApi.listEscrows(params),
  })

  return {
    escrows: query.data ?? [],
    loading: query.isLoading,
    refetch: query.refetch,
  }
}

/** The single escrow row of one job (unique `Escrows(JobId)`), for the detail screen. */
export function useJobEscrow(jobId?: string) {
  const params = useMemo<EscrowListParams | undefined>(
    () => (jobId ? { jobId } : undefined),
    [jobId],
  )
  const { escrows, loading, refetch } = useEscrows(params)
  return { escrow: escrows[0] ?? null, loading, refetch }
}
