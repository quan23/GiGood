import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * Booking cart: multi-select of board job ids. Lives in the app shell so the
 * board (selection) and any future checkout surface share the same set.
 */
type CartContextValue = {
  selectedJobIds: string[]
  count: number
  has: (jobId: string) => boolean
  toggle: (jobId: string) => void
  /** Replaces the whole selection (used by "select all" style flows). */
  setSelection: (jobIds: string[]) => void
  clear: () => void
}

const CartCtx = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([])

  const has = useCallback((jobId: string) => selectedJobIds.includes(jobId), [selectedJobIds])

  const toggle = useCallback((jobId: string) => {
    setSelectedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId],
    )
  }, [])

  const setSelection = useCallback((jobIds: string[]) => {
    setSelectedJobIds([...new Set(jobIds)])
  }, [])

  const clear = useCallback(() => {
    setSelectedJobIds([])
  }, [])

  const value = useMemo<CartContextValue>(
    () => ({ selectedJobIds, count: selectedJobIds.length, has, toggle, setSelection, clear }),
    [selectedJobIds, has, toggle, setSelection, clear],
  )

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

export function useCart() {
  const ctx = useContext(CartCtx)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
