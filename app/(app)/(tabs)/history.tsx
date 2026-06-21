import { View, Text, ScrollView } from 'react-native'
import { useSeeker } from '../../../hooks/useSeeker'
import { formatVnd } from '../../../lib/format'

export default function HistoryScreen() {
  const { history } = useSeeker()

  return (
    <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 24 }}>
      <Text className="text-lg font-extrabold text-gray-800 mb-4">Lịch sử giao dịch</Text>

      {history.length === 0 ? (
        <Text className="text-xs text-gray-400 text-center py-8">Chưa có giao dịch nào hoàn tất.</Text>
      ) : (
        history.map(job => (
          <View key={job.id} className="bg-white border border-gray-200 rounded-2xl p-3.5 space-y-1.5 mb-3">
            <View className="flex-row items-start justify-between">
              <Text className="font-bold text-xs text-gray-800 leading-tight flex-1 pr-2">{job.title}</Text>
              <Text className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Hoàn thành</Text>
            </View>
            <Text className="text-[11px] text-gray-500">Tasker: {job.taskerName || '—'}</Text>
            <View className="flex-row items-center justify-between pt-1 border-t border-gray-50">
              <Text className="text-amber-500 font-bold">
                {job.seekerRating ? '\u2605'.repeat(job.seekerRating) : 'Chưa đánh giá'}
              </Text>
              <Text className="font-bold text-gray-800">-{formatVnd(job.budget)}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  )
}
