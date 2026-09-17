import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL } from '../config/env'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '../storage/secure-store'

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean }

const SKIP_REFRESH_PATHS = [
  '/api/auth/refresh',
  '/api/auth/revoke',
  '/api/auth/login',
  '/api/auth/register',
]

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(refreshToken: string): Promise<string> {
  try {
    const { refreshTokens } = await import('../../features/auth/api')
    const tokens = await refreshTokens(refreshToken)
    await setTokens(tokens.accessToken, tokens.refreshToken)
    return tokens.accessToken
  } finally {
    refreshPromise = null
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequest | undefined
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (SKIP_REFRESH_PATHS.some((path) => original.url?.includes(path))) {
      return Promise.reject(error)
    }

    original._retry = true

    const refreshToken = await getRefreshToken().catch(() => null)
    if (!refreshToken) {
      await clearTokens()
      return Promise.reject(error)
    }

    try {
      const inFlight = refreshPromise ?? refreshAccessToken(refreshToken)
      refreshPromise = inFlight
      const accessToken = await inFlight
      original.headers.Authorization = `Bearer ${accessToken}`
      return apiClient(original)
    } catch (refreshError) {
      await clearTokens()
      return Promise.reject(refreshError)
    }
  },
)

export default apiClient
