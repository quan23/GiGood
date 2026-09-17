import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { clearSession, getStoredUser, hasToken } from '../../api/client'

export default function AdminLayout() {
  const navigate = useNavigate()
  const user = getStoredUser()

  // Guard for every /admin/* route.
  if (!hasToken()) {
    return <Navigate to="/login" replace />
  }

  function logout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="sidebar-brand" to="/admin">
          GiGood <span>Admin</span>
        </Link>
        <nav className="sidebar-nav">
          <NavLink to="/admin" end>
            Tổng quan
          </NavLink>
          <NavLink to="/admin/users">Người dùng</NavLink>
          <NavLink to="/admin/jobs">Công việc</NavLink>
          <NavLink to="/admin/escrows">Ký quỹ</NavLink>
        </nav>
        <button className="btn btn-ghost sidebar-logout" type="button" onClick={logout}>
          Đăng xuất
        </button>
      </aside>

      <div className="admin-main">
        <header className="topbar">
          <span>
            Xin chào, <strong>{user?.name ?? 'quản trị viên'}</strong>
          </span>
          <Link to="/">Xem trang chủ</Link>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
