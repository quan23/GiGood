/**
 * Central runtime config for the Expo app.
 *
 * Expo inlines `process.env.EXPO_PUBLIC_*` at build time (values come from
 * `app_mobile/.env`, the EAS profile `env` in `eas.json`, or the shell), so
 * every module reads them through this file instead of touching `process.env`
 * directly.
 */

/** Android emulator loopback to the host machine; also the offline-dev fallback. */
const DEFAULT_API_BASE_URL = 'http://10.0.2.2:5000'

/** GiGood API base URL, normalized without a trailing slash. */
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL
).replace(/\/+$/, '')

/** `true` when `EXPO_PUBLIC_USE_MOCK=1` (render the in-memory demo data offline). */
export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === '1'
