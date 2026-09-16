import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, RefreshControl, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../../hooks/useAuth'
import { useDeviceLocation } from '../../../hooks/useDeviceLocation'
import { useJobs } from '../../../hooks/useJobs'
import { JobCard } from '../../../components/ui/JobCard'
import { EmptyState } from '../../../components/shared/EmptyState'
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner'
import { JobMap } from '../../../lib/features/jobs/components/JobMap'
import { DEFAULT_RADIUS_KM, Q1_CENTER } from '../../../lib/features/jobs/geo'
import type { JobModel } from '../../../lib/features/jobs/types'

export default function BoardScreen() {
  const { profile } = useAuth()
  const { position, request } = useDeviceLocation()
  const center = position ?? Q1_CENTER
  const router = useRouter()
  const listRef = useRef<FlatList<JobModel>>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // GPS is best-effort: the map/list start on the Q1 center and recenter
  // (refetch by query key) as soon as the device position resolves.
  useEffect(() => {
    void request()
  }, [request])

  const params = useMemo(
    () => ({
      status: 'Open' as const,
      lat: center.lat,
      lng: center.lng,
      radius: DEFAULT_RADIUS_KM,
    }),
    [center.lat, center.lng],
  )
  const { jobs, loading, refreshing, refetch } = useJobs(params)

  const handleSelectJob = useCallback(
    (id: string) => {
      setSelectedId(id)
      const index = jobs.findIndex((job) => job.id === id)
      if (index < 0) return
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.1 })
    },
    [jobs],
  )

  if (loading) {
    return <LoadingSpinner text="Đang tải việc gần bạn..." />
  }

  return (
    <FlatList
      ref={listRef}
      className="flex-1"
      contentContainerClassName="pt-4 pb-6 grow"
      data={jobs}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void refetch()} tintColor="#0f766e" />
      }
      onScrollToIndexFailed={(info) =>
        listRef.current?.scrollToOffset({
          offset: info.averageItemLength * info.index,
          animated: true,
        })
      }
      ListHeaderComponent={
        <View className="px-4">
          <View className="mb-4">
            <Text className="text-lg font-extrabold text-gray-800">Việc gần bạn</Text>
            <Text className="text-xs text-gray-500">
              Gợi ý theo vị trí GPS & kỹ năng phù hợp với hồ sơ của bạn
            </Text>
          </View>

          <JobMap
            jobs={jobs}
            center={center}
            userPosition={position}
            selectedId={selectedId}
            currentUserId={profile?.id}
            onSelectJob={handleSelectJob}
          />

          <View className="flex-row items-center justify-between mb-2 mt-4">
            <Text className="font-bold text-sm text-gray-800">Danh sách việc khả dụng</Text>
            <Text className="text-[11px] text-gray-400">{jobs.length} việc</Text>
          </View>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon="🗺️"
          title="Chưa có việc nào gần bạn"
          subtitle="Hãy quay lại sau hoặc làm mới danh sách."
        />
      }
      renderItem={({ item }) => (
        <JobCard
          job={item}
          selected={item.id === selectedId}
          onPress={() => {
            setSelectedId(item.id)
            router.push(`/(app)/job/${item.id}`)
          }}
        />
      )}
    />
  )
}
