import { useCallback, useEffect, useState } from 'react'
import {
  api,
  apiErrorMessage,
  formatVnd,
  type AdminJob,
  type AdminJobListResponse,
  type Category,
} from '../../api/client'
import DataTable, { type Column } from '../../components/DataTable'

const statusOptions = [
  { value: '', label: 'Tất cả' },
  { value: 'Open', label: 'Đang mở' },
  { value: 'Assigned', label: 'Đã nhận' },
  { value: 'Done', label: 'Hoàn thành' },
  { value: 'Cancelled', label: 'Đã huỷ' },
]

const statusLabels: Record<string, string> = {
  Open: 'Đang mở',
  Assigned: 'Đã nhận',
  Done: 'Hoàn thành',
  Cancelled: 'Đã huỷ',
}

const statusBadges: Record<string, string> = {
  Open: 'badge badge-success',
  Assigned: 'badge badge-warning',
  Done: 'badge badge-teal',
  Cancelled: 'badge badge-muted',
}

export default function Jobs() {
  const [jobs, setJobs] = useState<AdminJob[]>([])
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>({})
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async (statusFilter: string) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get<AdminJobListResponse>('/api/admin/jobs', {
        params: { status: statusFilter || undefined, limit: 50 },
      })
      setJobs(data.jobs)
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(status)
  }, [load, status])

  // Category chips/labels are public; fall back to the raw key when unavailable.
  useEffect(() => {
    api
      .get<Category[]>('/api/meta/categories')
      .then(({ data }) =>
        setCategoryLabels(Object.fromEntries(data.map((category) => [category.key, category.label]))),
      )
      .catch(() => undefined)
  }, [])

  async function toggleHidden(job: AdminJob) {
    setBusyId(job.id)
    setError('')
    try {
      await api.post(`/api/admin/jobs/${job.id}/hide`, { hidden: !job.hidden })
      setJobs((current) =>
        current.map((row) => (row.id === job.id ? { ...row, hidden: !job.hidden } : row)),
      )
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const columns: Column<AdminJob>[] = [
    { key: 'title', header: 'Tiêu đề', render: (job) => job.title },
    {
      key: 'category',
      header: 'Danh mục',
      render: (job) => categoryLabels[job.category] ?? job.category,
    },
    { key: 'price', header: 'Giá', render: (job) => formatVnd(job.price) },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (job) => (
        <span className={statusBadges[job.status] ?? 'badge badge-muted'}>
          {statusLabels[job.status] ?? job.status}
        </span>
      ),
    },
    {
      key: 'hidden',
      header: 'Hiển thị',
      render: (job) =>
        job.hidden ? (
          <span className="badge badge-danger">Đã ẩn</span>
        ) : (
          <span className="badge badge-success">Công khai</span>
        ),
    },
    {
      key: 'owner',
      header: 'Người đăng',
      render: (job) => (
        <>
          {job.owner.name}
          <br />
          <span className="muted">{job.owner.phone}</span>
        </>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (job) => (
        <button
          className={job.hidden ? 'btn btn-outline btn-sm' : 'btn btn-danger btn-sm'}
          type="button"
          disabled={busyId === job.id}
          onClick={() => void toggleHidden(job)}
        >
          {job.hidden ? 'Bỏ ẩn' : 'Ẩn'}
        </button>
      ),
    },
  ]

  return (
    <section>
      <div className="page-head">
        <h1>Công việc</h1>
        <p className="muted">Lọc theo trạng thái và ẩn/hiện công việc khỏi danh sách công khai.</p>
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
        rows={jobs}
        rowKey={(job) => job.id}
        loading={loading}
        empty="Không có công việc phù hợp."
      />
    </section>
  )
}
