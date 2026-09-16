import type { Availability, Category, Role, Vehicle } from '../../../types'

/** `PATCH /api/me` body — every field is optional, omitted fields stay unchanged. */
export type ProfileUpdate = {
  name?: string
  location?: string
  bio?: string
  skills?: Category[]
  availability?: Availability
  vehicle?: Vehicle
  avatarUrl?: string
}

/** React Query key of the current user (`GET /api/me`), shared by `useAuth`/`useProfile`. */
export const profileQueryKey = ['me'] as const

/** `POST /api/me/avatar` -> `{avatarUrl}` (relative `/uploads/...`). */
export type AvatarResponse = {
  avatarUrl: string
}

/** `POST /api/me/switch-role {role}` -> `{role}`. */
export type SwitchRoleResponse = {
  role: Role
}
