import apiClient from '../../core/api/client'
import type {
  CreateRatingBody,
  RatingsListParams,
  Review,
  ReviewListResponse,
  UserRating,
} from './types'

/**
 * `POST /api/ratings` (task 07) -> 201 review. Errors: 409 duplicate
 * (one review per reviewer per job), 400 job not Done / invalid rate,
 * 403 caller is not a job participant.
 */
export async function createRating(body: CreateRatingBody): Promise<Review> {
  const { data } = await apiClient.post<Review>('/api/ratings', body)
  return data
}

/**
 * `GET /api/ratings?jobId=|userId=&cursor&limit` -> newest-first page plus
 * `avg` over every matching row. `userId` returns reviews received by that user.
 */
export async function listRatings(params: RatingsListParams): Promise<ReviewListResponse> {
  const { data } = await apiClient.get<ReviewListResponse>('/api/ratings', { params })
  return data
}

/** `GET /api/users/{id}/rating` -> `{avg, count, jobsDone}`. */
export async function getUserRating(userId: string): Promise<UserRating> {
  const { data } = await apiClient.get<UserRating>(`/api/users/${userId}/rating`)
  return data
}
