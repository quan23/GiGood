import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useGiGood } from '../../../GiGoodContext'
import { toUserProfile } from '../../auth/types'
import { resolveImageUrl } from '../../jobs/api'
import * as profileApi from '../api'
import { profileQueryKey, type ProfileUpdate } from '../types'
import type { UserProfile } from '../../../../types'

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === '1'

/** Applies a `PATCH /api/me` body onto the cached profile for the offline demo. */
function mergeProfile(current: UserProfile, body: ProfileUpdate): UserProfile {
  const hasTaskerEdits =
    body.skills !== undefined ||
    body.bio !== undefined ||
    body.availability !== undefined ||
    body.vehicle !== undefined

  const taskerProfile =
    current.taskerProfile || hasTaskerEdits
      ? {
          skills: body.skills ?? current.taskerProfile?.skills ?? [],
          bio: body.bio ?? current.taskerProfile?.bio ?? '',
          availability: body.availability ?? current.taskerProfile?.availability ?? 'all-day',
          vehicle: body.vehicle ?? current.taskerProfile?.vehicle ?? 'motorbike',
          verified: current.taskerProfile?.verified ?? false,
        }
      : null

  return {
    ...current,
    name: body.name ?? current.name,
    location: body.location ?? current.location,
    avatar: body.avatarUrl ?? current.avatar,
    taskerProfile,
  }
}

/**
 * Profile data source (task 08). Seeded from the auth profile and backed by
 * `GET/PATCH /api/me` through React Query; every mutation also updates the
 * GiGood context so the header avatar/name refresh without a restart. With
 * `EXPO_PUBLIC_USE_MOCK=1` the same contract is served locally from the demo
 * context profile.
 */
export function useProfile() {
  const { state, dispatch } = useGiGood()
  const queryClient = useQueryClient()
  const contextProfile = state.auth.profile

  const query = useQuery<UserProfile | null>({
    queryKey: profileQueryKey,
    enabled: !USE_MOCK && !!contextProfile,
    initialData: contextProfile ?? undefined,
    queryFn: async () => toUserProfile(await profileApi.loadProfile()),
  })

  const applyProfile = useCallback(
    (next: UserProfile) => {
      dispatch({ type: 'SET_PROFILE', payload: next })
      queryClient.setQueryData(profileQueryKey, next)
    },
    [dispatch, queryClient],
  )

  const readCurrent = useCallback((): UserProfile | null => {
    const cached = queryClient.getQueryData<UserProfile | null>(profileQueryKey)
    return cached ?? contextProfile
  }, [queryClient, contextProfile])

  const updateMutation = useMutation<UserProfile, unknown, ProfileUpdate>({
    mutationFn: async (body) => {
      if (USE_MOCK) {
        const current = readCurrent()
        if (!current) throw new Error('Chưa đăng nhập.')
        return mergeProfile(current, body)
      }
      return toUserProfile(await profileApi.updateProfile(body))
    },
    onSuccess: applyProfile,
  })

  const avatarMutation = useMutation<string, unknown, string>({
    mutationFn: (localUri) =>
      USE_MOCK ? Promise.resolve(localUri) : profileApi.uploadAvatar(localUri),
    onSuccess: (avatarUrl) => {
      const current = readCurrent()
      if (!current) return
      applyProfile({ ...current, avatar: resolveImageUrl(avatarUrl) ?? avatarUrl })
    },
  })

  return {
    profile: query.data ?? contextProfile,
    loading: query.isLoading,
    refetch: query.refetch,
    updateProfile: updateMutation.mutateAsync,
    isSaving: updateMutation.isPending,
    uploadAvatar: avatarMutation.mutateAsync,
    isUploadingAvatar: avatarMutation.isPending,
  }
}
