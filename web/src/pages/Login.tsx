import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  api,
  apiErrorMessage,
  getStoredUser,
  hasToken,
  saveSession,
  type LoginResponse,
  type MeResponse,
} from '../api/client'

export default function Login() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (hasToken() && getStoredUser()?.isAdmin) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post<LoginResponse>('/api/auth/login', { phone, password })
      // Login returns tokens only — /api/me tells us whether this account is admin.
      const me = await api.get<MeResponse>('/api/me', {
        headers: { Authorization: `Bearer ${data.accessToken}` },
      })
      if (me.data.user.isAdmin !== true) {
        setError('Chỉ quản trị viên mới truy cập được trang này.')
        return
      }
      saveSession(data.accessToken, me.data.user)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <Link className="brand" to="/">
          GiGood
        </Link>
        <h1>Đăng nhập quản trị</h1>
        <p className="muted">Trang này chỉ dành cho quản trị viên GiGood.</p>

        <form onSubmit={handleSubmit}>
          <label>
            Số điện thoại
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="0900000000"
              autoComplete="username"
              required
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••"
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p className="error-line" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>

        <Link className="link-back" to="/">
          ← Về trang chủ
        </Link>
      </div>
    </div>
  )
}
