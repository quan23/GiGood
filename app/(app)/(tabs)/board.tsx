import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { useTasker } from '../../../hooks/useTasker'
import { useJobs } from '../../../hooks/useJobs'
import { useAuth } from '../../../hooks/useAuth'
import { useUi } from '../../../hooks/useUi'
import { formatVnd } from '../../../lib/format'
import { CATEGORY_META } from '../../../lib/categories'

export default function BoardScreen() {
  const { availableJobs } = useTasker()
  const { acceptJob } = useJobs()
  const { profile } = useAuth()
  const { showToast, setTaskerSubTab } = useUi()

  const handleAccept = (jobId: number) => {
    acceptJob(jobId, profile?.name || 'Bạn')
    showToast('Nhận việc thành công! Hãy liên hệ với khách hàng.', 'success')
    setTaskerSubTab('active')
  }

  return (
    <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 24 }}>
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
        {availableJobs.map(job => (
          <View key={job.id} className="absolute" style={{ left: job.mapX as any, top: job.mapY as any } as any}>
            <View className="relative w-7 h-7 -ml-3.5 -mt-3.5 rounded-full bg-orange-500 items-center justify-center border-2 border-white shadow">
              <FontAwesome name={(CATEGORY_META[job.category]?.icon || 'wrench') as keyof typeof FontAwesome.glyphMap} size={10} color="white" />
            </View>
          </View>
        ))}
      </View>

      <View>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="font-bold text-sm text-gray-800">Danh sách việc khả dụng</Text>
          <Text className="text-[11px] text-gray-400">{availableJobs.length} việc</Text>
        </View>

        {availableJobs.length === 0 ? (
          <Text className="text-xs text-gray-400 text-center py-8">Hiện chưa có việc mới gần bạn. Hãy quay lại sau!</Text>
        ) : (
          availableJobs.map(job => {
            const meta = CATEGORY_META[job.category]
            return (
              <View key={job.id} className="bg-white border border-gray-200 rounded-2xl p-3.5 space-y-2.5 mb-3">
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center space-x-2 flex-1">
                    <View className="w-8 h-8 rounded-lg bg-teal-50 items-center justify-center">
                      <FontAwesome name={(meta?.icon || 'wrench') as keyof typeof FontAwesome.glyphMap} size={12} color="#0f766e" />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="font-bold text-xs text-gray-800 leading-tight">{job.title}</Text>
                      <Text className="text-[10px] text-gray-400">{meta?.label} · {job.timeTag}</Text>
                    </View>
                  </View>
                  <Text className="font-bold text-xs text-teal-600 flex-shrink-0 ml-2">{formatVnd(job.budget)}</Text>
                </View>
                <Text className="text-[11px] text-gray-500 leading-relaxed" numberOfLines={2}>{job.description}</Text>
                <Text className="text-[11px] text-gray-500">
                  <FontAwesome name="map-marker" size={10} color="#9ca3af" /> {job.location}
                </Text>
                <TouchableOpacity onPress={() => handleAccept(job.id)}
                  className="w-full bg-teal-600 py-2.5 rounded-xl items-center">
                  <Text className="text-white text-xs font-bold">Nhận việc này</Text>
                </TouchableOpacity>
              </View>
            )
          })
        )}
      </View>
    </ScrollView>
  )
}
