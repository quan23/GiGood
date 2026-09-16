import type { Category } from '../../../types'

/** Server status enum (`Api/Features/Jobs/Job.cs`): Open | Assigned | Done | Cancelled. */
export type ApiJobStatus = 'Open' | 'Assigned' | 'Done' | 'Cancelled'

export type JobOwner = {
  id: string
  name: string
  avatarUrl: string | null
  ratingAvg: number
}

/** Mirrors `JobDto` from `Api/Features/Jobs/Dtos.cs`. */
export type JobModel = {
  id: string
  owner: JobOwner
  title: string
  description: string
  category: Category
  price: number
  status: ApiJobStatus
  lat: number | null
  lng: number | null
  /** Only set when the list is queried with `lat`/`lng`. */
  distanceKm?: number | null
  locationText: string | null
  images: string[]
  createdAt: string
  updatedAt: string
}

export type JobListResponse = {
  jobs: JobModel[]
  nextCursor: string | null
}

export type JobListParams = {
  status?: ApiJobStatus
  category?: Category
  lat?: number
  lng?: number
  radius?: number
  q?: string
  cursor?: string
  limit?: number
}

export type CreateJobBody = {
  title: string
  description: string
  category: Category
  price: number
  lat?: number | null
  lng?: number | null
  locationText?: string | null
  images?: string[]
}

export type UpdateJobBody = {
  title?: string
  description?: string
  category?: Category
  price?: number
  lat?: number | null
  lng?: number | null
  locationText?: string | null
}

export type UploadResponse = {
  url: string
}

/** `GET /api/meta/categories` (public). */
export type CategoryMetaDto = {
  key: Category
  label: string
  icon: string
}
