import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useChat, type ChatConversation } from '../../../hooks/useChat'
import { resolveImageUrl } from '../../../lib/features/jobs/api'
import { formatChatTime } from '../../../lib/features/chat/format'
import { EmptyState } from '../../../components/shared/EmptyState'
import { SkeletonList } from '../../../components/ui/SkeletonCard'

function ConversationRow({ item, onPress }: { item: ChatConversation; onPress: () => void }) {
  const avatar = resolveImageUrl(item.peerAvatar)
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center p-3.5 border-b border-gray-50 active:bg-stone-50"
    >
      {avatar ? (
        <Image source={{ uri: avatar }} className="w-11 h-11 rounded-full border border-gray-200" />
      ) : (
        <View className="w-11 h-11 rounded-full bg-orange-50 items-center justify-center border border-orange-100">
          <Text className="text-orange-500 font-extrabold text-sm">
            {(item.peerName || 'G').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View className="flex-1 min-w-0 ml-3">
        <View className="flex-row items-center">
          <Text className="font-bold text-xs text-gray-800 flex-1 mr-2" numberOfLines={1}>
            {item.peerName}
          </Text>
          {item.lastMessage && (
            <Text className="text-[10px] text-gray-400">
              {formatChatTime(item.lastMessage.createdAt)}
            </Text>
          )}
        </View>
        <Text className="text-[11px] text-gray-400 mt-0.5" numberOfLines={1}>
          {item.lastMessage
            ? `${item.lastMessageIsOwn ? 'Bạn: ' : ''}${item.lastMessage.body}`
            : 'Bắt đầu trò chuyện...'}
        </Text>
      </View>
      {item.unreadCount > 0 && <View className="w-2.5 h-2.5 bg-orange-500 rounded-full ml-2" />}
    </TouchableOpacity>
  )
}

export default function ChatScreen() {
  const router = useRouter()
  const { conversations, conversationsLoading, refreshing, refetch } = useChat()

  const openConversation = (item: ChatConversation) => {
    router.push({ pathname: '/(app)/chat/[id]', params: { id: item.id, jobId: item.jobId } })
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-gray-200 bg-white">
        <Text className="font-bold text-sm text-gray-800">Tin nhắn</Text>
      </View>
      {conversationsLoading ? (
        <SkeletonList count={4} />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Chưa có cuộc trò chuyện nào"
          subtitle="Khi có Tasker nhận việc, bạn có thể chat tại đây."
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={() => void refetch()}
          renderItem={({ item }) => (
            <ConversationRow item={item} onPress={() => openConversation(item)} />
          )}
        />
      )}
    </View>
  )
}
