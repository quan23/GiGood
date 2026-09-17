/**
 * Single source of truth for GiGood design tokens (task 09).
 *
 * Screens should import from here instead of inlining hex strings. The same
 * palette is mirrored in `tailwind.config.js` (`brand.*`) for class-based
 * styling; keep both in sync when adding colours.
 */

export const colors = {
  /** Seeker accent (CTA, active states). */
  orange: '#ea580c',
  orangeHover: '#c2410c',
  /** Soft orange surfaces (orange-50). */
  orangeSoft: '#fff7ed',
  orangeLight: '#ffedd5',
  /** Orange border used by selected chips / urgent toggle (orange-300). */
  orangeBorder: '#fdba74',
  /** Tasker accent (CTA, active states). */
  teal: '#0f766e',
  tealHover: '#115e59',
  tealLight: '#f0fdfa',
  /** Light icon tint on the teal wallet card (teal-200). */
  tealSoft: '#99f6e4',
  /** Neutral ink + surfaces. */
  stoneDark: '#1c1917',
  stoneLight: '#fafaf9',
  stoneBorder: '#e7e5e4',
  white: '#ffffff',
  /** Icon/placeholder greys. */
  grayIcon: '#6b7280',
  grayMuted: '#9ca3af',
  grayDisabled: '#d1d5db',
  /** Off-state switch thumb. */
  grayTrack: '#f4f3f4',
  /** Status accents. */
  amber: '#f59e0b',
  red: '#ef4444',
} as const;

export const typography = {
  h1: { fontSize: 24, lineHeight: 32, fontWeight: '800' },
  h2: { fontSize: 18, lineHeight: 26, fontWeight: '800' },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  caption: { fontSize: 11, lineHeight: 16, fontWeight: '500' },
} as const;

export const radius = {
  sm: 8,
  md: 12,
  /** `rounded-2xl` in NativeWind. */
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const theme = {
  colors,
  typography,
  radius,
} as const;

export type Theme = typeof theme;

export default theme;
