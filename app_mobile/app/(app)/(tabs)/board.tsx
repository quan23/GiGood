import { RefreshControl, ScrollView, Text, View, type DimensionValue } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useJobs } from '../../../hooks/useJobs'
import { CATEGORY_META } from '../../../lib/categories'
import { JobCard } from '../../../components/ui/JobCard'
import { EmptyState } from '../../../components/shared/EmptyState'
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner'

// Demo visual stays (no map SDK): project real lat/lng around the Q1 center.
const CENTER_LAT = 10.7769
const CENTER_LNG = 106.7009
const SPAN = 0.05

function projectMarker(lat: number | null, lng: number | null) {
  if (lat == null || lng == null) return null
  const left = 50 + ((lng - CENTER_LNG) / SPAN) * 100
  const top = 50 - ((lat - CENTER_LAT) / SPAN) * 100
  return {
    left: `${Math.min(94, Math.max(6, left))}%` as DimensionValue,
    top: `${Math.min(92, Math.max(8, top))}%` as DimensionValue,
  }
}

export default function BoardScreen() {
  const { jobs, loading, refreshing, refetch } = useJobs({ status: 'Open' })
  const router = useRouter()

  if (loading) {
    return <LoadingSpinner text="Đang tải việc gần bạn..." />
  }

  return (
    <ScrollView
      className="flex-1 px-4 py-4"
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void refetch()} tintColor="#0f766e" />
      }
    >
      <View className="mb-4">
        <Text className="text-lg font-extrabold text-gray-800">Việc gần bạn</Text>
        <Text className="text-xs text-gray-500">Gợi ý theo vị trí GPS & kỹ năng phù hợp với hồ sơ của bạn</Text>
      </View>

      <View className="w-full h-44 rounded-2xl overflow-hidden border border-gray-200 bg-stone-100 relative mb-4">
        <View className="absolute inset-0 opacity-40">
          <View className="absolute top-[25%] left-0 right-0 h-px bg-gray-300" />
          <View className="absolute top-[55%] left-0 right-0 h-px bg-gray-300" />
          <View className="absolute top-[83%] left-0 right-0 h-px bg-gray-300" />
          <View className="absolute left-[22%] top-0 bottom-0 w-px bg-gray-300" />
          <View className="absolute left-[55%] top-0 bottom-0 w-px bg-gray-300" />
          <View className="absolute left-[80%] top-0 bottom-0 w-px bg-gray-300" />
        </View>
        <View className="absolute" style={{ left: '45%', top: '55%' }}>
          <View className="relative w-7 h-7 -ml-3.5 -mt-3.5 items-center justify-center">
            <View className="absolute w-7 h-7 rounded-full bg-teal-600/30" />
            <View className="w-3.5 h-3.5 rounded-full bg-teal-600 border-2 border-white shadow" />
          </View>
        </View>
        {jobs.map(job => {
          const position = projectMarker(job.lat, job.lng)
          if (!position) return null
          return (
            <View key={job.id} className="absolute" style={position}>
              <View className="relative w-7 h-7 -ml-3.5 -mt-3.5 rounded-full bg-orange-500 items-center justify-center border-2 border-white shadow">
                <FontAwesome name={(CATEGORY_META[job.category]?.icon || 'wrench') as keyof typeof FontAwesome.glyphMap} size={10} color="white" />
              </View>
            </View>
          )
        })}
      </View>

      <View>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="font-bold text-sm text-gray-800">Danh sách việc khả dụng</Text>
          <Text className="text-[11px] text-gray-400">{jobs.length} việc</Text>
        </View>

        {jobs.length === 0 ? (
          <EmptyState
            icon="🗺️"
            title="Chưa có việc nào gần bạn"
            subtitle="Hãy quay lại sau hoặc làm mới danh sách."
          />
        ) : (
          jobs.map(job => (
            <JobCard key={job.id} job={job} onPress={() => router.push(`/(app)/job/${job.id}`)} />
          ))
        )}
      </View>
    </ScrollView>
  )
}
