import { View, Text, ScrollView } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { useTasker } from '../../../hooks/useTasker'
import { formatVnd } from '../../../lib/format'

export default function EarningsScreen() {
  const { earningsList, totalEarnings, completedCount } = useTasker()

  return (
    <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 24 }}>
      <Text className="text-lg font-extrabold text-gray-800 mb-4">Thu nhập của bạn</Text>

      <View className="flex-row gap-3 mb-4">
        <View className="flex-1 bg-white border border-gray-200 rounded-2xl p-3.5">
          <FontAwesome name="money" size={14} color="#0f766e" style={{ marginBottom: 6 }} />
          <Text className="text-base font-extrabold text-gray-800">{formatVnd(totalEarnings)}</Text>
          <Text className="text-[10px] text-gray-400 font-medium">Tổng thu nhập</Text>
        </View>
        <View className="flex-1 bg-white border border-gray-200 rounded-2xl p-3.5">
          <FontAwesome name="check-circle" size={14} color="#ea580c" style={{ marginBottom: 6 }} />
          <Text className="text-base font-extrabold text-gray-800">{completedCount}</Text>
          <Text className="text-[10px] text-gray-400 font-medium">Việc hoàn thành</Text>
        </View>
      </View>

      <View>
        <Text className="font-bold text-sm text-gray-800 mb-2">Lịch sử nhận tiền</Text>
        {earningsList.length === 0 ? (
          <Text className="text-xs text-gray-400 text-center py-8">Chưa có lịch sử nhận tiền nào.</Text>
        ) : (
          earningsList.map(job => (
            <View key={job.id} className="bg-white border border-gray-200 rounded-2xl p-3.5 flex-row items-center justify-between mb-2.5">
              <View className="flex-1 min-w-0 pr-2">
                <Text className="font-bold text-xs text-gray-800 leading-tight truncate">{job.title}</Text>
                <Text className="text-[10px] text-gray-400">Khách: {job.seekerName}</Text>
              </View>
              <Text className="font-bold text-xs text-emerald-600 flex-shrink-0">+{formatVnd(job.budget)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}
