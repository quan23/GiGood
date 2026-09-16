import { useMemo } from 'react'
import { FlatList, RefreshControl, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../../hooks/useAuth'
import { useJobs } from '../../../hooks/useJobs'
import { JobCard } from '../../../components/ui/JobCard'
import { EmptyState } from '../../../components/shared/EmptyState'
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner'

export default function JobsScreen() {
  const { profile } = useAuth()
  const { jobs, loading, refreshing, refetch } = useJobs()
  const router = useRouter()

  const myJobs = useMemo(
    () => jobs.filter(job => job.owner.id === profile?.id),
    [jobs, profile?.id],
  )

  if (loading) {
    return <LoadingSpinner text="Đang tải việc của bạn..." />
  }

  return (
    <FlatList
      contentContainerClassName="pt-4 pb-6 grow"
      data={myJobs}
      keyExtractor={item => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void refetch()} tintColor="#ea580c" />
      }
      ListHeaderComponent={
        <View className="px-4 mb-2">
          <Text className="text-lg font-extrabold text-gray-800">Việc của tôi</Text>
          <Text className="text-xs text-gray-500">{myJobs.length} công việc đã đăng</Text>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon="📋"
          title="Bạn chưa có việc nào"
          subtitle="Hãy đăng việc mới để Tasker phù hợp nhận giúp bạn."
        />
      }
      renderItem={({ item }) => (
        <JobCard job={item} onPress={() => router.push(`/(app)/job/${item.id}`)} />
      )}
    />
  )
}
