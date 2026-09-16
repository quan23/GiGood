/** Mirrors `Api/Features/Ratings/Dtos.cs` (task 07). */

/** Job summary embedded in a review (`RatingJobDto`). */
export type RatingJobRef = {
  id: string
  title: string
}

/** Reviewer summary embedded in a review (`RatingUserDto`). */
export type RatingUserRef = {
  id: string
  name: string
  avatarUrl: string | null
}

/** One review row; `revieweeId` is the job's other participant. */
export type Review = {
  id: string
  jobId: string
  job: RatingJobRef
  reviewer: RatingUserRef
  revieweeId: string
  rate: number
  comment: string | null
  createdAt: string
}

/** `POST /api/ratings {jobId, rate:1..5, comment?}`. */
export type CreateRatingBody = {
  jobId: string
  rate: number
  comment?: string | null
}

/** `GET /api/ratings` — at least one of `jobId` / `userId` is required. */
export type RatingsListParams = {
  jobId?: string
  /** Reviews received by this user. */
  userId?: string
  cursor?: string
  limit?: number
}

export type ReviewListResponse = {
  reviews: Review[]
  nextCursor: string | null
  avg: number
}

/** `GET /api/users/{id}/rating`. */
export type UserRating = {
  avg: number
  count: number
  jobsDone: number
}
