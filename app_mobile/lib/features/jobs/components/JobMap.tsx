import { useState } from 'react'
import {
  Pressable,
  Text,
  TouchableOpacity,
  View,
  type DimensionValue,
  type LayoutChangeEvent,
} from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import type { JobModel } from '../types'
import { CATEGORY_META } from '../../../categories'
import {
  clamp,
  projectToPercent,
  Q1_CENTER,
  unprojectFromPercent,
  type LatLng,
} from '../geo'

type JobMapProps = {
  jobs: JobModel[]
  /** Projection center; defaults to the Q1 fallback. */
  center?: LatLng
  /** Device position — drawn as the teal "you are here" dot. */
  userPosition?: LatLng | null
  /** Highlighted job id (marker emphasis). */
  selectedId?: string | null
  /** Signed-in user id; their own jobs get an orange marker. */
  currentUserId?: string | null
  onSelectJob?: (id: string) => void
  /** Tap-to-pick mode used by the post location picker. */
  pickMode?: boolean
  onPick?: (coords: LatLng) => void
  /** Highlighted pick marker in `pickMode`. */
  pickedPoint?: LatLng | null
  height?: number
  className?: string
}

function asPercent(value: number): DimensionValue {
  return `${value}%` as DimensionValue
}

/**
 * Demo board visual (grid + dots, no map SDK). Jobs are linearly projected
 * around `center` with a ±MAP_SPAN_DEG zoom; outliers clamp to the edges.
 * In `pickMode` a tap calls `onPick` with the inverse-mapped coordinates.
 */
export function JobMap({
  jobs,
  center = Q1_CENTER,
  userPosition,
  selectedId,
  currentUserId,
  onSelectJob,
  pickMode = false,
  onPick,
  pickedPoint,
  height = 176,
  className = '',
}: JobMapProps) {
  const [size, setSize] = useState({ width: 0, height: 0 })

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height: layoutHeight } = event.nativeEvent.layout
    setSize({ width, height: layoutHeight })
  }

  const handlePick = (x: number, y: number) => {
    if (!pickMode || !onPick || size.width <= 0 || size.height <= 0) return
    onPick(unprojectFromPercent((x / size.width) * 100, (y / size.height) * 100, center))
  }

  const markers = jobs
    .filter((job) => job.lat != null && job.lng != null)
    .map((job) => {
      const point = projectToPercent({ lat: job.lat as number, lng: job.lng as number }, center)
      return {
        job,
        left: clamp(point.left, 6, 94),
        top: clamp(point.top, 8, 92),
      }
    })

  const you = projectToPercent(userPosition ?? center, center)
  const picked = pickedPoint ? projectToPercent(pickedPoint, center) : null

  const canvas = (
    <>
      <View className="absolute inset-0 opacity-40" pointerEvents="none">
        <View className="absolute top-[25%] left-0 right-0 h-px bg-gray-300" />
        <View className="absolute top-[55%] left-0 right-0 h-px bg-gray-300" />
        <View className="absolute top-[83%] left-0 right-0 h-px bg-gray-300" />
        <View className="absolute left-[22%] top-0 bottom-0 w-px bg-gray-300" />
        <View className="absolute left-[55%] top-0 bottom-0 w-px bg-gray-300" />
        <View className="absolute left-[80%] top-0 bottom-0 w-px bg-gray-300" />
      </View>

      <View className="absolute inset-0" pointerEvents="none">
        <View
          className="absolute items-center justify-center"
          style={{
            left: asPercent(clamp(you.left, 4, 96)),
            top: asPercent(clamp(you.top, 5, 95)),
            width: 28,
            height: 28,
            marginLeft: -14,
            marginTop: -14,
          }}
        >
          <View className="absolute w-7 h-7 rounded-full bg-teal-600/30" />
          <View className="w-3.5 h-3.5 rounded-full bg-teal-600 border-2 border-white" />
        </View>

        {picked && (
          <View
            className="absolute items-center justify-center"
            style={{
              left: asPercent(picked.left),
              top: asPercent(picked.top),
              width: 26,
              height: 26,
              marginLeft: -13,
              marginTop: -13,
            }}
          >
            <View className="absolute w-6 h-6 rounded-full bg-orange-500/25" />
            <View className="w-5 h-5 rounded-full bg-orange-500 border-2 border-white items-center justify-center">
              <FontAwesome name="check" size={8} color="white" />
            </View>
          </View>
        )}
      </View>

      <View className="absolute inset-0" pointerEvents={pickMode ? 'none' : 'box-none'}>
        {markers.map(({ job, left, top }) => {
          const isOwn = !!currentUserId && job.owner.id === currentUserId
          const selected = job.id === selectedId
          return (
            <TouchableOpacity
              key={job.id}
              disabled={pickMode}
              activeOpacity={0.8}
              onPress={() => onSelectJob?.(job.id)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`${CATEGORY_META[job.category]?.label ?? job.category}: ${job.title}`}
              className="absolute items-center justify-center"
              style={{
                left: asPercent(left),
                top: asPercent(top),
                width: 36,
                height: 36,
                marginLeft: -18,
                marginTop: -18,
                zIndex: selected ? 30 : 10,
                elevation: selected ? 6 : 3,
              }}
            >
              {selected && (
                <View
                  className={`absolute rounded-full ${isOwn ? 'bg-orange-500/25' : 'bg-teal-600/25'}`}
                  style={{ width: 34, height: 34 }}
                />
              )}
              <View
                className={`rounded-full items-center justify-center border-2 border-white ${
                  isOwn ? 'bg-orange-500' : 'bg-teal-600'
                } ${selected ? 'w-8 h-8' : 'w-6 h-6'}`}
              >
                <FontAwesome
                  name={
                    (CATEGORY_META[job.category]?.icon || 'wrench') as keyof typeof FontAwesome.glyphMap
                  }
                  size={selected ? 11 : 9}
                  color="white"
                />
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      {pickMode && (
        <View
          className="absolute bottom-2 left-0 right-0 items-center"
          pointerEvents="none"
        >
          <View className="bg-white/80 rounded-full px-2.5 py-1">
            <Text className="text-[10px] font-bold text-gray-500">Chạm để chọn vị trí</Text>
          </View>
        </View>
      )}
    </>
  )

  const containerClass = `w-full rounded-2xl overflow-hidden border border-gray-200 bg-stone-100 relative ${className}`

  if (pickMode) {
    return (
      <Pressable
        onLayout={handleLayout}
        onPress={(event) =>
          handlePick(event.nativeEvent.locationX, event.nativeEvent.locationY)
        }
        accessibilityRole="button"
        accessibilityLabel="Chạm để chọn vị trí trên bản đồ"
        className={containerClass}
        style={{ height }}
      >
        {canvas}
      </Pressable>
    )
  }

  return (
    <View onLayout={handleLayout} className={containerClass} style={{ height }}>
      {canvas}
    </View>
  )
}
