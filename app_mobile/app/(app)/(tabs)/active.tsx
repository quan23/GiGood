import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { useTasker } from '../../../hooks/useTasker'
import { useJobs } from '../../../hooks/useJobs'
import { useUi } from '../../../hooks/useUi'
import { useRouter } from 'expo-router'
import { formatVnd } from '../../../lib/format'
import { CATEGORY_META } from '../../../lib/categories'

export default function ActiveScreen() {
  const { assignedJobs } = useTasker()
  const { reportCompleted } = useJobs()
  const { showToast } = useUi()
  const router = useRouter()

  const handleReportComplete = (jobId: number) => {
    reportCompleted(jobId)
    showToast('Đã báo hoàn thành! Đang chờ khách xác nhận và giải ngân.', 'success')
  }

  return (
    <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 24 }}>
      <Text className="text-lg font-extrabold text-gray-800 mb-4">Việc đã nhận</Text>

      {assignedJobs.length === 0 ? (
        <Text className="text-xs text-gray-400 text-center py-8">{'Bạn chưa nhận việc nào. Vào "Bảng việc" để xem các việc gần bạn!'}</Text>
      ) : (
        assignedJobs.map(job => {
          const meta = CATEGORY_META[job.category]
          return (
            <View key={job.id} className="bg-white border border-gray-200 rounded-2xl p-3.5 space-y-2.5 mb-3">
              <View className="flex-row items-center space-x-2">
                <View className="w-8 h-8 rounded-lg bg-teal-50 items-center justify-center">
                  <FontAwesome name={(meta?.icon || 'wrench') as keyof typeof FontAwesome.glyphMap} size={12} color="#0f766e" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="font-bold text-xs text-gray-800 leading-tight">{job.title}</Text>
                  <Text className="text-[10px] text-gray-400">Khách: {job.seekerName}</Text>
                </View>
                <Text className="font-bold text-xs text-teal-600 flex-shrink-0">{formatVnd(job.budget)}</Text>
              </View>
              <Text className="text-[11px] text-gray-500">
                <FontAwesome name="map-marker" size={10} color="#9ca3af" /> {job.location}
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity onPress={() => router.push(`/(app)/chat/${job.id}`)}
                  className="flex-1 bg-stone-100 py-2.5 rounded-xl items-center">
                  <Text className="text-gray-600 text-xs font-bold">Trò chuyện</Text>
                </TouchableOpacity>
              </View>
              {job.isCompletedReportedByTasker ? (
                <Text className="w-full text-center text-[11px] font-bold text-amber-600 bg-amber-50 py-2 rounded-xl">
                  Đã báo hoàn thành — đang chờ khách xác nhận
                </Text>
              ) : (
                <TouchableOpacity onPress={() => handleReportComplete(job.id)}
                  className="w-full bg-orange-500 py-2.5 rounded-xl items-center">
                  <Text className="text-white text-xs font-bold">Báo đã hoàn thành</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        })
      )}
    </ScrollView>
  )
}
