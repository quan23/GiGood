import { Text, TouchableOpacity, View } from 'react-native'
import { formatNotificationTime } from '../../lib/features/notifications/format'
import type { AppNotification } from '../../lib/features/notifications/types'

type Props = {
  notification: AppNotification
  onPress: () => void
}

/** One notifications-screen row: unread gets the mint card + orange dot. */
export function NotificationTile({ notification, onPress }: Props) {
  const unread = !notification.read

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`rounded-xl p-4 mb-2 border ${
        unread ? 'bg-[#f0fdf4] border-[#bbf7d0]' : 'bg-white border-transparent'
      }`}
    >
      <View className="flex-row items-start">
        {unread && <View className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 mr-2" />}
        <View className="flex-1">
          <Text
            className={`text-sm leading-snug ${unread ? 'text-gray-800 font-semibold' : 'text-gray-600'}`}
            numberOfLines={2}
          >
            {notification.title}
          </Text>
          <Text className="text-xs text-gray-500 mt-1 leading-snug" numberOfLines={3}>
            {notification.body}
          </Text>
        </View>
        <Text className="text-[10px] text-gray-400 ml-3 mt-0.5">
          {formatNotificationTime(notification.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  )
}
