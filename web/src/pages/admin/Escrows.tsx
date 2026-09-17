import { useCallback, useEffect, useState } from 'react'
import {
  api,
  apiErrorMessage,
  formatVnd,
  type AdminEscrow,
  type AdminEscrowListResponse,
} from '../../api/client'
import DataTable, { type Column } from '../../components/DataTable'

const statusOptions = [
  { value: '', label: 'Tất cả' },
  { value: 'Held', label: 'Đang giữ' },
  { value: 'Released', label: 'Đã giải ngân' },
  { value: 'Refunded', label: 'Đã hoàn tiền' },
]

const statusLabels: Record<string, string> = {
  Held: 'Đang giữ',
  Released: 'Đã giải ngân',
  Refunded: 'Đã hoàn tiền',
}

const statusBadges: Record<string, string> = {
  Held: 'badge badge-warning',
  Released: 'badge badge-teal',
  Refunded: 'badge badge-muted',
}

export default function Escrows() {
  const [escrows, setEscrows] = useState<AdminEscrow[]>([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async (statusFilter: string) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get<AdminEscrowListResponse>('/api/admin/escrows', {
        params: { status: statusFilter || undefined },
      })
      setEscrows(data.escrows)
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(status)
  }, [load, status])

  async function act(escrow: AdminEscrow, action: 'release' | 'refund') {
    const confirmed = window.confirm(
      action === 'release'
        ? `Xác nhận giải ngân ${formatVnd(escrow.amount)} cho ${escrow.payee.name}?`
        : `Xác nhận hoàn ${formatVnd(escrow.amount)} cho ${escrow.payer.name}?`,
    )
    if (!confirmed) return

    setBusyId(escrow.id)
    setError('')
    try {
      await api.post(`/api/admin/escrows/${escrow.id}/${action}`)
      await load(status)
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const columns: Column<AdminEscrow>[] = [
    { key: 'job', header: 'Công việc', render: (escrow) => escrow.jobTitle },
    {
      key: 'parties',
      header: 'Người trả → Người nhận',
      render: (escrow) => `${escrow.payer.name} → ${escrow.payee.name}`,
    },
    { key: 'amount', header: 'Số tiền', render: (escrow) => formatVnd(escrow.amount) },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (escrow) => (
        <span className={statusBadges[escrow.status] ?? 'badge badge-muted'}>
          {statusLabels[escrow.status] ?? escrow.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (escrow) =>
        escrow.status === 'Held' ? (
          <div className="chips">
            <button
              className="btn btn-teal btn-sm"
              type="button"
              disabled={busyId === escrow.id}
              onClick={() => void act(escrow, 'release')}
            >
              Giải ngân
            </button>
            <button
              className="btn btn-danger btn-sm"
              type="button"
              disabled={busyId === escrow.id}
              onClick={() => void act(escrow, 'refund')}
            >
              Hoàn tiền
            </button>
          </div>
        ) : null,
    },
  ]

  return (
    <section>
      <div className="page-head">
        <h1>Ký quỹ</h1>
        <p className="muted">Chỉ ký quỹ đang giữ mới có thể giải ngân hoặc hoàn tiền.</p>
      </div>

      <div className="chips" role="group" aria-label="Lọc theo trạng thái">
        {statusOptions.map((option) => (
          <button
            key={option.value || 'all'}
            className={option.value === status ? 'chip active' : 'chip'}
            type="button"
            onClick={() => setStatus(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && <p className="error-line">{error}</p>}

      <DataTable
        columns={columns}
        rows={escrows}
        rowKey={(escrow) => escrow.id}
        loading={loading}
        empty="Không có ký quỹ phù hợp."
      />
    </section>
  )
}
