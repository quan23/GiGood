import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useGiGood } from '../lib/GiGoodContext'
import { Role, Category, Availability, Vehicle, UserProfile } from '../types'
import * as authApi from '../lib/features/auth/api'
import * as profileApi from '../lib/features/profile/api'
import { profileQueryKey } from '../lib/features/profile/types'
import { getApiErrorMessage } from '../lib/features/jobs/api'
import { toUserProfile } from '../lib/features/auth/types'
import type { AuthUserDto, TokenPair } from '../lib/features/auth/types'
import { disconnectChatHub } from '../lib/features/chat/hub'
import { disconnectNotificationHub } from '../lib/features/notifications/hub'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '../lib/core/storage/secure-store'
import { USE_MOCK } from '../lib/core/config/env'

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
  const queryClient = useQueryClient()
  const { profile, currentRole, pendingSignupRole, hydrated } = state.auth

  const applyProfile = useCallback(
    (user: AuthUserDto) => {
      const next = toUserProfile(user)
      dispatch({ type: 'SET_PROFILE', payload: next })
      queryClient.setQueryData(profileQueryKey, next)
    },
    [dispatch, queryClient],
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
    await disconnectNotificationHub()
    const refreshToken = await getRefreshToken().catch(() => null)
    if (refreshToken) {
      await authApi.revoke(refreshToken).catch(() => undefined)
    }
    await clearTokens()
    queryClient.removeQueries({ queryKey: profileQueryKey })
    dispatch({ type: 'SIGN_OUT' })
  }, [dispatch, queryClient])

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

  /**
   * Dual-role switch (task 08). Calls `POST /api/me/switch-role`, mirrors the
   * new role into the context + `['me']` cache and resolves with it. On a 400
   * (tasker profile missing) the API message is surfaced as the error message.
   */
  const switchRole = useCallback(
    async (role: Role): Promise<Role> => {
      if (USE_MOCK) {
        dispatch({ type: 'SWITCH_ROLE', payload: role })
        queryClient.setQueryData<UserProfile | null>(profileQueryKey, prev =>
          prev ? { ...prev, role } : prev,
        )
        return role
      }

      try {
        const nextRole = await profileApi.switchRole(role)
        dispatch({ type: 'SWITCH_ROLE', payload: nextRole })
        queryClient.setQueryData<UserProfile | null>(profileQueryKey, prev =>
          prev ? { ...prev, role: nextRole } : prev,
        )
        return nextRole
      } catch (error) {
        throw new Error(
          getApiErrorMessage(error, 'Không thể chuyển vai trò. Vui lòng thử lại.'),
        )
      }
    },
    [dispatch, queryClient],
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
