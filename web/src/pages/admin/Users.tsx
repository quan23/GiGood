import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  api,
  apiErrorMessage,
  type AdminUser,
  type AdminUserListResponse,
} from '../../api/client'
import DataTable, { type Column } from '../../components/DataTable'

export default function Users() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async (search: string) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get<AdminUserListResponse>('/api/admin/users', {
        params: { query: search.trim() || undefined, limit: 50 },
      })
      setUsers(data.users)
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load('')
  }, [load])

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await load(query)
  }

  async function toggleBan(user: AdminUser) {
    setBusyId(user.id)
    setError('')
    try {
      await api.post(`/api/admin/users/${user.id}/ban`, { banned: !user.banned })
      setUsers((current) =>
        current.map((row) => (row.id === user.id ? { ...row, banned: !user.banned } : row)),
      )
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const columns: Column<AdminUser>[] = [
    { key: 'name', header: 'Tên', render: (user) => user.name },
    { key: 'phone', header: 'Số điện thoại', render: (user) => user.phone },
    {
      key: 'role',
      header: 'Vai trò',
      render: (user) => <span className="badge badge-muted">{user.role}</span>,
    },
    { key: 'rating', header: 'Đánh giá', render: (user) => `${user.ratingAvg.toFixed(1)} ★` },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (user) =>
        user.banned ? (
          <span className="badge badge-danger">Bị khoá</span>
        ) : user.isAdmin ? (
          <span className="badge badge-teal">Quản trị</span>
        ) : (
          <span className="badge badge-success">Hoạt động</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (user) =>
        user.isAdmin ? null : (
          <button
            className={user.banned ? 'btn btn-outline btn-sm' : 'btn btn-danger btn-sm'}
            type="button"
            disabled={busyId === user.id}
            onClick={() => void toggleBan(user)}
          >
            {user.banned ? 'Mở khoá' : 'Khoá'}
          </button>
        ),
    },
  ]

  return (
    <section>
      <div className="page-head">
        <h1>Người dùng</h1>
        <p className="muted">Tìm theo tên hoặc số điện thoại, khoá/mở khoá tài khoản.</p>
      </div>

      <form className="toolbar" onSubmit={handleSearch}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm theo tên hoặc SĐT…"
          aria-label="Tìm người dùng"
        />
        <button className="btn btn-primary" type="submit">
          Tìm
        </button>
      </form>

      {error && <p className="error-line">{error}</p>}

      <DataTable
        columns={columns}
        rows={users}
        rowKey={(user) => user.id}
        loading={loading}
        empty="Không tìm thấy người dùng."
      />
    </section>
  )
}
