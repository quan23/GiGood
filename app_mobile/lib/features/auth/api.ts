import apiClient from '../../core/api/client'
import type {
  AuthResponse,
  MeResponse,
  RegisterPayload,
  TokenPair,
} from './types'

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/register', payload)
  return data
}

export async function login(phone: string, password: string): Promise<TokenPair> {
  const { data } = await apiClient.post<TokenPair>('/api/auth/login', { phone, password })
  return data
}

export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  const { data } = await apiClient.post<TokenPair>('/api/auth/refresh', { refreshToken })
  return data
}

export async function revoke(refreshToken: string): Promise<void> {
  await apiClient.post('/api/auth/revoke', { refreshToken })
}

export async function me(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>('/api/me')
  return data
}
