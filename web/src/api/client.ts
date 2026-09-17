import axios from 'axios'

// Keeps local dev working even without a .env file.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

const TOKEN_KEY = 'accessToken'
const USER_KEY = 'user'

// ---------------------------------------------------------------------------
// DTOs (camelCase JSON from Api/Features)
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string
  name: string
  phone: string
  currentRole: string
  ratingAvg: number
  isAdmin: boolean
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface MeResponse {
  user: AuthUser
  wallet: unknown
}

export interface Category {
  key: string
  label: string
  icon: string
}

export interface AdminJobsByStatus {
  open: number
  assigned: number
  done: number
  cancelled: number
}

export interface AdminStats {
  users: number
  jobsByStatus: AdminJobsByStatus
  escrowHeld: number
  volumeToday: number
}

export interface AdminUser {
  id: string
  name: string
  phone: string
  role: string
  ratingAvg: number
  banned: boolean
  isAdmin: boolean
  createdAt: string
}

export interface AdminUserListResponse {
  users: AdminUser[]
  nextCursor: string | null
}

export interface AdminJobOwner {
  id: string
  name: string
  phone: string
}

export interface AdminJob {
  id: string
  title: string
  category: string
  price: number
  status: string
  hidden: boolean
  owner: AdminJobOwner
  createdAt: string
}

export interface AdminJobListResponse {
  jobs: AdminJob[]
  nextCursor: string | null
}

export interface AdminParty {
  id: string
  name: string
}

export type EscrowStatus = 'Held' | 'Released' | 'Refunded'

export interface AdminEscrow {
  id: string
  jobId: string
  jobTitle: string
  payer: AdminParty
  payee: AdminParty
  amount: number
  status: EscrowStatus
  heldAt: string
  releasedAt: string | null
}

export interface AdminEscrowListResponse {
  escrows: AdminEscrow[]
}

// ---------------------------------------------------------------------------
// Axios instance + interceptors
// ---------------------------------------------------------------------------

export const api = axios.create({ baseURL: API_BASE_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const url = error.config?.url ?? ''
      // Stale/expired session (never on the login call itself) -> back to /login.
      if (status === 401 && !url.includes('/api/auth/login')) {
        clearSession()
        if (window.location.pathname !== '/login') {
          window.location.assign('/login')
        }
      }
    }
    return Promise.reject(error)
  },
)

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function saveSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.clear()
}

export function hasToken(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY))
}

// ---------------------------------------------------------------------------
// Errors + formatting
// ---------------------------------------------------------------------------

interface ErrorBody {
  message?: string
  detail?: string
}

// The API speaks ProblemDetails (`detail`) or ErrorResponse (`message`); 403 on
// /api/admin/* is translated into a friendly admin-only line.
export function apiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'Đã xảy ra lỗi không xác định.'
  }

  const status = error.response?.status
  const body = error.response?.data as ErrorBody | undefined

  if (status === 403) {
    return body?.message ?? 'Bạn không có quyền truy cập trang quản trị.'
  }
  if (body?.message) return body.message
  if (body?.detail) return body.detail
  if (!error.response) {
    return 'Không kết nối được tới máy chủ. Vui lòng kiểm tra kết nối mạng.'
  }
  return `Máy chủ trả về lỗi ${status}. Vui lòng thử lại.`
}

const numberFormat = new Intl.NumberFormat('vi-VN')

export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

export function formatVnd(amount: number): string {
  return `${numberFormat.format(amount)} đ`
}
