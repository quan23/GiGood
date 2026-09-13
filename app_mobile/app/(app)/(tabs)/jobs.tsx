import { View, Text, TouchableOpacity, ScrollView, Image, Animated, Easing } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { useUi } from '../../../hooks/useUi'
import { useSeeker } from '../../../hooks/useSeeker'
import { useGiGood } from '../../../lib/GiGoodContext'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { formatVnd } from '../../../lib/format'
import { CATEGORY_META } from '../../../lib/categories'

export default function JobsScreen() {
  const { dispatch } = useGiGood()
  const { matchingJobIdRef, showToast } = useUi()
  const { activeJobs } = useSeeker()
  const router = useRouter()
  const pulseAnim = useRef(new Animated.Value(1)).current
  const [seconds, setSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (matchingJobIdRef) {
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 2.4, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
        ])
      ).start()
      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
        pulseAnim.setValue(1)
      }
    }
  }, [matchingJobIdRef, pulseAnim])

  const matchingJob = matchingJobIdRef ? activeJobs.find(j => j.id === matchingJobIdRef) : null
  const matchedJob = activeJobs.find(j => j.status === 'assigned' && j.taskerName && j.timeTag === 'Vừa ghép việc' && !j.isCompletedReportedByTasker)
  const regularJobs = activeJobs.filter(j => !(matchingJobIdRef && j.id === matchingJobIdRef) && !(matchedJob && j.id === matchedJob.id))

  return (
    <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 24 }}>
      {matchingJobIdRef && matchingJob && (
        <View className="bg-white border border-gray-200 rounded-2xl p-5 items-center space-y-3 mb-4">
          <View className="relative w-20 h-20 items-center justify-center">
            <Animated.View
              className="absolute w-20 h-20 rounded-full bg-orange-500/20"
              style={{ transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 2.4], outputRange: [1, 0] }) }}
            />
            <View className="w-14 h-14 rounded-full bg-orange-500 items-center justify-center">
              <FontAwesome name="globe" size={18} color="white" />
            </View>
          </View>
          <View className="items-center">
            <Text className="font-bold text-sm text-gray-800">Đang tìm Tasker phù hợp...</Text>
            <Text className="text-xs text-gray-500 mt-0.5">{matchingJob.title}</Text>
          </View>
          <Text className="text-[11px] text-gray-400">Đã tìm trong {seconds}s</Text>
        </View>
      )}

      {matchedJob && (
        <View className="bg-white border-2 border-orange-500 rounded-2xl p-4 space-y-3 mb-4">
          <Text className="text-[10px] font-bold text-orange-500 uppercase tracking-wide bg-orange-50 px-2 py-0.5 rounded-full self-start">
            Đã ghép việc!
          </Text>
          <View className="flex-row items-center space-x-3">
            <Image source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150' }}
              className="w-12 h-12 rounded-xl border" />
            <View className="flex-1">
              <Text className="font-bold text-sm text-gray-800">{matchedJob.taskerName}</Text>
              <Text className="text-[11px] text-amber-500 font-bold">
                <FontAwesome name="star" size={11} /> 4.9 · Đã nhận 120 việc
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push(`/(app)/chat/${matchedJob.id}`)}
            className="w-full bg-gray-900 py-2.5 rounded-xl flex-row items-center justify-center space-x-2">
            <FontAwesome name="comments" size={12} color="white" />
            <Text className="text-white text-xs font-bold">Mở trò chuyện với Tasker</Text>
          </TouchableOpacity>
        </View>
      )}

      <View>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="font-bold text-sm text-gray-800">Việc đang xử lý</Text>
          <Text className="text-[11px] text-gray-400">{activeJobs.length} việc</Text>
        </View>

        {regularJobs.length === 0 && !matchingJobIdRef ? (
          <Text className="text-xs text-gray-400 text-center py-8">Bạn chưa có việc nào đang xử lý. Hãy đăng việc mới!</Text>
        ) : (
          regularJobs.map(job => {
            const meta = CATEGORY_META[job.category]
            const statusBadge = job.status === 'finding'
              ? { label: 'Đang tìm Tasker', bg: 'bg-amber-50', text: 'text-amber-600' }
              : job.isCompletedReportedByTasker
                ? { label: 'Tasker đã báo xong', bg: 'bg-emerald-50', text: 'text-emerald-600' }
                : { label: 'Đang thực hiện', bg: 'bg-blue-50', text: 'text-blue-600' }

            return (
              <View key={job.id} className="bg-white border border-gray-200 rounded-2xl p-3.5 space-y-2.5 mb-3">
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center space-x-2 flex-1">
                    <View className="w-8 h-8 rounded-lg bg-orange-50 items-center justify-center">
                      <FontAwesome name={(meta?.icon || 'wrench') as keyof typeof FontAwesome.glyphMap} size={12} color="#ea580c" />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="font-bold text-xs text-gray-800 leading-tight">{job.title}</Text>
                      <Text className="text-[10px] text-gray-400">{job.timeTag}</Text>
                    </View>
                  </View>
                  <Text className={`text-[10px] font-bold ${statusBadge.bg} ${statusBadge.text} px-2 py-0.5 rounded-full ml-2`}>
                    {statusBadge.label}
                  </Text>
                </View>
                <Text className="text-[11px] text-gray-500 leading-relaxed" numberOfLines={2}>{job.description}</Text>
                <View className="flex-row items-center justify-between pt-1 border-t border-gray-50">
                  <Text className="text-gray-500 text-[11px] flex-1 mr-2" numberOfLines={1}>
                    <FontAwesome name="map-marker" size={10} /> {job.location}
                  </Text>
                  <Text className="font-bold text-teal-600 text-[11px]">{formatVnd(job.budget)}</Text>
                </View>
                {job.taskerName && (
                  <Text className="text-[11px] text-gray-600">
                    <FontAwesome name="user" size={10} color="#9ca3af" /> Tasker: <Text className="font-bold">{job.taskerName}</Text>
                  </Text>
                )}
                {job.isCompletedReportedByTasker ? (
                  <TouchableOpacity onPress={() => {
                    dispatch({ type: 'RELEASE_ESCROW', payload: { jobId: job.id, rating: 5, comment: '' } })
                    showToast('Giải ngân thành công! Cảm ơn bạn đã sử dụng GiGood.', 'success')
                  }}
                    className="w-full bg-teal-600 py-2.5 rounded-xl items-center">
                    <Text className="text-white text-xs font-bold">Xác nhận & Giải ngân</Text>
                  </TouchableOpacity>
                ) : job.status === 'assigned' ? (
                  <TouchableOpacity onPress={() => router.push(`/(app)/chat/${job.id}`)}
                    className="w-full bg-stone-100 py-2.5 rounded-xl items-center">
                    <Text className="text-gray-600 text-xs font-bold">Mở trò chuyện</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )
          })
        )}
      </View>
    </ScrollView>
  )
}
