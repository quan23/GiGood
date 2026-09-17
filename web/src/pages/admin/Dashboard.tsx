import { useEffect, useState } from 'react'
import {
  api,
  apiErrorMessage,
  formatNumber,
  formatVnd,
  type AdminStats,
} from '../../api/client'

const statusLabels: Record<keyof AdminStats['jobsByStatus'], string> = {
  open: 'Đang mở',
  assigned: 'Đã nhận',
  done: 'Hoàn thành',
  cancelled: 'Đã huỷ',
}

export default function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api
      .get<AdminStats>('/api/admin/stats')
      .then((response) => {
        if (active) setStats(response.data)
      })
      .catch((err: unknown) => {
        if (active) setError(apiErrorMessage(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const pending = loading || stats === null

  return (
    <section>
      <div className="page-head">
        <h1>Tổng quan</h1>
        <p className="muted">Số liệu trực tiếp từ API GiGood.</p>
      </div>

      {error && <p className="error-line">{error}</p>}

      <div className="stat-grid">
        <article className="card stat-card">
          <span className="stat-label">Người dùng</span>
          <strong className="stat-value">{pending ? '—' : formatNumber(stats.users)}</strong>
          <span className="stat-note">Tổng tài khoản đã đăng ký</span>
        </article>

        <article className="card stat-card">
          <span className="stat-label">Công việc theo trạng thái</span>
          {pending ? (
            <strong className="stat-value">—</strong>
          ) : (
            <ul className="stat-breakdown">
              {Object.entries(stats.jobsByStatus).map(([key, value]) => (
                <li key={key}>
                  <span>{statusLabels[key as keyof AdminStats['jobsByStatus']]}</span>
                  <strong>{formatNumber(value)}</strong>
                </li>
              ))}
            </ul>
          )}
          <span className="stat-note">Toàn bộ công việc</span>
        </article>

        <article className="card stat-card">
          <span className="stat-label">Ký quỹ đang giữ</span>
          <strong className="stat-value">{pending ? '—' : formatVnd(stats.escrowHeld)}</strong>
          <span className="stat-note">Tổng tiền trong ví ký quỹ</span>
        </article>

        <article className="card stat-card">
          <span className="stat-label">Giải ngân hôm nay</span>
          <strong className="stat-value">{pending ? '—' : formatVnd(stats.volumeToday)}</strong>
          <span className="stat-note">Doanh số đã giải ngân (UTC)</span>
        </article>
      </div>
    </section>
  )
}
