import { useCallback } from 'react'
import { useGiGood } from '../lib/GiGoodContext'
import { Role, Category, Availability, Vehicle } from '../types'
import * as authApi from '../lib/features/auth/api'
import { toUserProfile } from '../lib/features/auth/types'
import type { AuthUserDto, TokenPair } from '../lib/features/auth/types'
import { disconnectChatHub } from '../lib/features/chat/hub'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '../lib/core/storage/secure-store'

const DEMO_ACCOUNTS: Record<Role, { phone: string; password: string }> = {
  seeker: { phone: '0901234567', password: '123456' },
  tasker: { phone: '0912345678', password: '123456' },
}

type TaskerProfileInput = {
  skills: Category[]
  bio: string
  availability: Availability
  vehicle: Vehicle
  verified: boolean
}

export function useAuth() {
  const { state, dispatch } = useGiGood()
  const { profile, currentRole, pendingSignupRole, hydrated } = state.auth

  const applyProfile = useCallback(
    (user: AuthUserDto) => {
      dispatch({ type: 'SET_PROFILE', payload: toUserProfile(user) })
    },
    [dispatch],
  )

  const completeLogin = useCallback(
    async (tokens: TokenPair) => {
      await setTokens(tokens.accessToken, tokens.refreshToken)
      const { user } = await authApi.me()
      applyProfile(user)
    },
    [applyProfile],
  )

  const signUpSeeker = useCallback(
    async (name: string, phone: string, password: string, location: string) => {
      const result = await authApi.register({
        name,
        phone,
        password,
        location,
        role: 'seeker',
      })
      await setTokens(result.accessToken, result.refreshToken)
      applyProfile(result.user)
    },
    [applyProfile],
  )

  const signUpTasker = useCallback(
    async (
      name: string,
      phone: string,
      password: string,
      location: string,
      taskerProfile: TaskerProfileInput,
    ) => {
      const result = await authApi.register({
        name,
        phone,
        password,
        location,
        role: 'tasker',
        taskerProfile: {
          skills: taskerProfile.skills,
          bio: taskerProfile.bio,
          availability: taskerProfile.availability,
          vehicle: taskerProfile.vehicle,
        },
      })
      await setTokens(result.accessToken, result.refreshToken)
      applyProfile(result.user)
    },
    [applyProfile],
  )

  const login = useCallback(
    async (phone: string, password: string) => {
      await completeLogin(await authApi.login(phone, password))
    },
    [completeLogin],
  )

  const quickLogin = useCallback(
    async (role: Role) => {
      const account = DEMO_ACCOUNTS[role]
      await completeLogin(await authApi.login(account.phone, account.password))
    },
    [completeLogin],
  )

  const signOut = useCallback(async () => {
    await disconnectChatHub()
    const refreshToken = await getRefreshToken().catch(() => null)
    if (refreshToken) {
      await authApi.revoke(refreshToken).catch(() => undefined)
    }
    await clearTokens()
    dispatch({ type: 'SIGN_OUT' })
  }, [dispatch])

  const hydrate = useCallback(async () => {
    try {
      const accessToken = await getAccessToken()
      const refreshToken = await getRefreshToken()
      if (!accessToken && !refreshToken) return
      const { user } = await authApi.me()
      applyProfile(user)
    } catch {
      await clearTokens().catch(() => undefined)
    } finally {
      dispatch({ type: 'SET_AUTH_HYDRATED', payload: true })
    }
  }, [applyProfile, dispatch])

  const switchRole = useCallback(
    (role: Role) => {
      dispatch({ type: 'SWITCH_ROLE', payload: role })
    },
    [dispatch],
  )

  const setPendingRole = useCallback(
    (role: Role) => {
      dispatch({ type: 'REGISTER_ROLE', payload: role })
    },
    [dispatch],
  )

  return {
    profile,
    currentRole,
    pendingSignupRole,
    hydrated,
    isLoggedIn: !!profile,
    login,
    hydrate,
    signUpSeeker,
    signUpTasker,
    quickLogin,
    signOut,
    switchRole,
    setPendingRole,
  }
}
