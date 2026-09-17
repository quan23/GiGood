import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { EmptyState } from '../../components/shared/EmptyState'
import { SkeletonList } from '../../components/ui/SkeletonCard'
import { NotificationTile } from '../../components/ui/NotificationTile'
import { useNotifications } from '../../hooks/useNotifications'
import { colors } from '../../constants/theme'
import type { AppNotification } from '../../lib/features/notifications/types'

export default function NotificationsScreen() {
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    markRead,
    clear,
    loading,
    refreshing,
    refetch,
    hasMore,
    loadingMore,
    loadMore,
  } = useNotifications()

  const openNotification = (item: AppNotification) => {
    if (!item.read) void markRead([item.id])
    if (item.jobId) router.push(`/(app)/job/${item.jobId}`)
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          className="w-9 h-9 rounded-full bg-stone-100 items-center justify-center"
        >
          <FontAwesome name="arrow-left" size={14} color={colors.grayIcon} />
        </TouchableOpacity>
        <Text className="font-bold text-base text-gray-800 ml-3 flex-1">Thông báo</Text>
        {unreadCount > 0 && (
          <View className="bg-orange-50 border border-orange-200 rounded-full px-2.5 py-1">
            <Text className="text-[10px] font-bold text-orange-500">{unreadCount} chưa đọc</Text>
          </View>
        )}
      </View>

      {notifications.length > 0 && (
        <View className="flex-row items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100">
          <Text className="text-[10px] text-gray-400">Mới nhất trước</Text>
          <View className="flex-row items-center space-x-4">
            <TouchableOpacity onPress={() => void markRead()} disabled={unreadCount === 0}>
              <Text
                className={`text-[11px] font-bold ${unreadCount === 0 ? 'text-gray-300' : 'text-teal-600'}`}
              >
                Đánh dấu đã đọc tất cả
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => void clear()}>
              <Text className="text-[11px] font-bold text-orange-500">Xoá tất cả</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <SkeletonList />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          className="flex-1"
          contentContainerClassName="p-4"
          refreshing={refreshing}
          onRefresh={() => void refetch()}
          renderItem={({ item }) => (
            <NotificationTile notification={item} onPress={() => openNotification(item)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="📭"
              title="Chưa có thông báo nào"
              subtitle="Bạn sẽ nhận thông báo khi có việc mới"
            />
          }
          ListFooterComponent={
            hasMore ? (
              <TouchableOpacity
                onPress={() => void loadMore()}
                disabled={loadingMore}
                className="py-3 items-center"
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color={colors.grayMuted} />
                ) : (
                  <Text className="text-xs text-gray-400">Tải thêm thông báo</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  )
}
