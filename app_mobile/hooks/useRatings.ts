import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useGiGood } from '../lib/GiGoodContext'
import * as ratingsApi from '../lib/features/ratings/api'
import {
  mockCreateRating,
  mockGetUserRating,
  mockListRatings,
} from '../lib/features/ratings/mock'
import type { MockViewer } from '../lib/features/jobs/mock'
import type {
  CreateRatingBody,
  RatingsListParams,
  Review,
  ReviewListResponse,
  UserRating,
} from '../lib/features/ratings/types'
import type { UserProfile } from '../types'

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === '1'

export const ratingsQueryKey = (params?: RatingsListParams) =>
  ['ratings', params ?? {}] as const
export const userRatingQueryKey = (userId: string) => ['user-rating', userId] as const

function toViewer(profile: UserProfile | null): MockViewer {
  if (!profile) return null
  return { id: profile.id, name: profile.name, avatarUrl: profile.avatar || null }
}

/**
 * Ratings data source (task 07). Backed by React Query; with
 * `EXPO_PUBLIC_USE_MOCK=1` the same contract is served from the in-memory
 * store in `lib/features/ratings/mock.ts`.
 */
export function useCreateRating() {
  const queryClient = useQueryClient()
  const { state } = useGiGood()
  const viewer = toViewer(state.auth.profile)

  const mutation = useMutation<Review, unknown, CreateRatingBody>({
    mutationFn: (body) =>
      USE_MOCK ? Promise.resolve(mockCreateRating(body, viewer)) : ratingsApi.createRating(body),
    onSuccess: (review) => {
      void queryClient.invalidateQueries({ queryKey: ['ratings'] })
      void queryClient.invalidateQueries({ queryKey: userRatingQueryKey(review.revieweeId) })
      // The reviewee's cached `RatingAvg` backs job owner cards.
      void queryClient.invalidateQueries({ queryKey: ['jobs'] })
      void queryClient.invalidateQueries({ queryKey: ['job'] })
    },
  })

  return { createRating: mutation.mutateAsync, isSubmitting: mutation.isPending }
}

/** Aggregate rating of one user (`GET /api/users/{id}/rating`). */
export function useUserRating(userId?: string) {
  const { state } = useGiGood()
  const viewer = toViewer(state.auth.profile)

  const query = useQuery<UserRating>({
    queryKey: userRatingQueryKey(userId ?? ''),
    enabled: !!userId,
    queryFn: () =>
      USE_MOCK
        ? Promise.resolve(mockGetUserRating(userId ?? '', viewer))
        : ratingsApi.getUserRating(userId ?? ''),
  })

  return {
    rating: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

/** All reviews of one job (both directions) for read-only history stars. */
export function useJobRatings(jobId?: string) {
  const query = useQuery<ReviewListResponse>({
    queryKey: ratingsQueryKey({ jobId }),
    enabled: !!jobId,
    queryFn: () => {
      const params: RatingsListParams = { jobId: jobId ?? '', limit: 10 }
      return USE_MOCK ? Promise.resolve(mockListRatings(params)) : ratingsApi.listRatings(params)
    },
  })

  return {
    reviews: query.data?.reviews ?? [],
    avg: query.data?.avg ?? 0,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
