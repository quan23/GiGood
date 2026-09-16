import { INITIAL_JOBS } from '../../seed'
import { haversineKm } from './geo'
import type { Job } from '../../../types'
import type {
  ApiJobStatus,
  CreateJobBody,
  JobListParams,
  JobListResponse,
  JobModel,
  UpdateJobBody,
} from './types'

/**
 * Offline fallback used when `EXPO_PUBLIC_USE_MOCK=1`: keeps the demo seed
 * (`lib/seed.ts`) rendering and lets the CRUD surface work without the API.
 */
export const MOCK_OWNER_ID = 'mock-owner'

export type MockViewer = {
  id: string
  name: string
  avatarUrl?: string | null
} | null

const STATUS_MAP: Record<Job['status'], ApiJobStatus> = {
  finding: 'Open',
  assigned: 'Assigned',
  completed: 'Done',
}

const MOCK_OWNER = {
  id: MOCK_OWNER_ID,
  name: 'Khánh Vy',
  avatarUrl: null as string | null,
  ratingAvg: 4.9,
}

function fromSeed(job: Job, index: number): JobModel {
  const createdAt = new Date(Date.now() - index * 3_600_000).toISOString()
  return {
    id: `seed-${job.id}`,
    owner: { ...MOCK_OWNER, name: job.seekerName || MOCK_OWNER.name },
    title: job.title,
    description: job.description,
    category: job.category,
    price: job.budget,
    status: STATUS_MAP[job.status],
    lat: job.lat,
    lng: job.lng,
    distanceKm: null,
    locationText: job.location,
    images: [],
    createdAt,
    updatedAt: createdAt,
  }
}

let mockJobs: JobModel[] = INITIAL_JOBS.map(fromSeed)
let nextMockId = 1

/** Seed jobs belong to the demo seeker: stamp the signed-in user so owner actions work. */
function stampOwner(job: JobModel, viewer: MockViewer): JobModel {
  if (!viewer || job.owner.id !== MOCK_OWNER_ID) return job
  return {
    ...job,
    owner: {
      ...job.owner,
      id: viewer.id,
      name: viewer.name,
      avatarUrl: viewer.avatarUrl ?? job.owner.avatarUrl,
    },
  }
}

export function mockListJobs(params: JobListParams = {}, viewer: MockViewer = null): JobListResponse {
  let jobs = mockJobs.map((job) => stampOwner(job, viewer))

  if (params.status) {
    jobs = jobs.filter((job) => job.status === params.status)
  }
  if (params.category) {
    jobs = jobs.filter((job) => job.category === params.category)
  }
  if (params.q) {
    const query = params.q.trim().toLowerCase()
    jobs = jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query),
    )
  }

  const centerLat = params.lat
  const centerLng = params.lng
  if (centerLat != null && centerLng != null) {
    // Mirror the API geo branch: drop jobs without coords, attach `distanceKm`
    // (rounded to 2 decimals), filter by radius and sort nearest-first.
    const radiusKm = params.radius ?? 5
    jobs = jobs
      .filter(
        (job): job is JobModel & { lat: number; lng: number } =>
          job.lat != null && job.lng != null,
      )
      .map((job) => ({ ...job, distanceKm: haversineKm({ lat: centerLat, lng: centerLng }, job) }))
      .filter((job) => (job.distanceKm ?? 0) <= radiusKm)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
  } else {
    jobs = [...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  const limit = params.limit ?? 20
  return { jobs: jobs.slice(0, limit), nextCursor: null }
}

export function mockGetJob(id: string, viewer: MockViewer = null): JobModel | null {
  const job = mockJobs.find((item) => item.id === id)
  return job ? stampOwner(job, viewer) : null
}

export function mockCreateJob(body: CreateJobBody, viewer: MockViewer = null): JobModel {
  const now = new Date().toISOString()
  const owner = viewer
    ? { id: viewer.id, name: viewer.name, avatarUrl: viewer.avatarUrl ?? null, ratingAvg: 0 }
    : { ...MOCK_OWNER }
  const job: JobModel = {
    id: `mock-${Date.now()}-${nextMockId++}`,
    owner,
    title: body.title,
    description: body.description,
    category: body.category,
    price: body.price,
    status: 'Open',
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    distanceKm: null,
    locationText: body.locationText ?? null,
    images: body.images ?? [],
    createdAt: now,
    updatedAt: now,
  }
  mockJobs = [job, ...mockJobs]
  return job
}

export function mockUpdateJob(id: string, body: UpdateJobBody): JobModel {
  const current = mockJobs.find((item) => item.id === id)
  if (!current) throw new Error('Không tìm thấy công việc.')

  // Only apply fields that were actually sent (undefined = untouched).
  const patch = Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined),
  ) as UpdateJobBody

  const updated: JobModel = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  mockJobs = mockJobs.map((item) => (item.id === id ? updated : item))
  return updated
}

export function mockDeleteJob(id: string): void {
  const exists = mockJobs.some((item) => item.id === id)
  if (!exists) throw new Error('Không tìm thấy công việc.')
  mockJobs = mockJobs.filter((item) => item.id !== id)
}
