import { useCallback, useEffect, useRef, useState } from 'react'
import * as Location from 'expo-location'
import type { LatLng } from '../lib/features/jobs/geo'

/**
 * Foreground device position via `expo-location`. Never blocks the UI:
 * `request()` resolves to `null` when permission is denied or unavailable,
 * and screens fall back to the Q1 center. Does not auto-request on mount.
 */
export function useDeviceLocation() {
  const [position, setPosition] = useState<LatLng | null>(null)
  const [denied, setDenied] = useState(false)
  const [locating, setLocating] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const request = useCallback(async (): Promise<LatLng | null> => {
    setLocating(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        if (mountedRef.current) setDenied(true)
        return null
      }
      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      const coords: LatLng = {
        lat: result.coords.latitude,
        lng: result.coords.longitude,
      }
      if (mountedRef.current) {
        setPosition(coords)
        setDenied(false)
      }
      return coords
    } catch {
      // Location is best-effort: callers fall back to the Q1 center.
      return null
    } finally {
      if (mountedRef.current) setLocating(false)
    }
  }, [])

  return { position, denied, locating, request }
}
