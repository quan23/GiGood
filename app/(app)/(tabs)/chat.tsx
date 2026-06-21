import { View, Text, TouchableOpacity, ScrollView, Image, TextInput, FlatList } from 'react-native'
import { FontAwesome } from '@expo/vector-icons'
import { useSeeker } from '../../../hooks/useSeeker'
import { useTasker } from '../../../hooks/useTasker'
import { useChat } from '../../../hooks/useChat'
import { useAuth } from '../../../hooks/useAuth'
import { useState } from 'react'

const SEEKER_AVATAR = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150'
const TASKER_AVATAR = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150'

export default function ChatScreen() {
  const { currentRole } = useAuth()
  const { chatJobs: seekerChatJobs } = useSeeker()
  const { chatJobs: taskerChatJobs } = useTasker()
  const { activeChatId, activeJob, chatDetailOpen, sendChat, openChat, closeChat } = useChat()
  const isSeeker = currentRole === 'seeker'
  const chatJobs = isSeeker ? seekerChatJobs : taskerChatJobs
  const [inputText, setInputText] = useState('')

  const handleSend = () => {
    if (!inputText.trim() || !activeChatId) return
    sendChat(activeChatId, isSeeker ? 'seeker' : 'tasker', inputText.trim())
    setInputText('')
  }

  if (!chatDetailOpen) {
    return (
      <View className="flex-1 bg-white">
        <View className="px-4 py-3 border-b border-gray-200 bg-white">
          <Text className="font-bold text-sm text-gray-800">Tin nhắn</Text>
        </View>
        {chatJobs.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-xs text-gray-400 text-center">
              Chưa có cuộc trò chuyện nào. Khi có Tasker nhận việc, bạn có thể chat tại đây.
            </Text>
          </View>
        ) : (
          <FlatList data={chatJobs} keyExtractor={j => String(j.id)}
            renderItem={({ item }) => {
              const lastMsg = item.chats[item.chats.length - 1]
              const partnerName = isSeeker ? item.taskerName : item.seekerName
              const partnerAvatar = isSeeker ? TASKER_AVATAR : SEEKER_AVATAR
              return (
                <TouchableOpacity onPress={() => openChat(item.id)}
                  className="flex-row items-center space-x-3 p-3.5 border-b border-gray-50 active:bg-stone-50">
                  <Image source={{ uri: partnerAvatar }} className="w-11 h-11 rounded-full border" />
                  <View className="flex-1 min-w-0">
                    <Text className="font-bold text-xs text-gray-800">{partnerName}</Text>
                    <Text className="text-[11px] text-gray-400" numberOfLines={1}>
                      {lastMsg ? lastMsg.text : 'Bắt đầu trò chuyện...'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            }}
          />
        )}
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-3 py-3 border-b border-gray-200 flex-row items-center space-x-2.5 bg-white">
        <TouchableOpacity onPress={closeChat} className="w-8 h-8 rounded-full bg-stone-100 items-center justify-center">
          <FontAwesome name="arrow-left" size={12} color="#6b7280" />
        </TouchableOpacity>
        <Image source={{ uri: isSeeker ? TASKER_AVATAR : SEEKER_AVATAR }} className="w-9 h-9 rounded-full border" />
        <View className="flex-1 min-w-0">
          <Text className="font-bold text-xs text-gray-800">
            {isSeeker ? activeJob?.taskerName || 'Tasker' : activeJob?.seekerName || 'Khách hàng'}
          </Text>
          <Text className="text-[10px] text-gray-400" numberOfLines={1}>
            {activeJob ? `Việc: ${activeJob.title.substring(0, 22)}...` : ''}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-3 bg-stone-50" ref={ref => { if (ref) setTimeout(() => ref.scrollToEnd({ animated: false }), 100) }}>
        {activeJob?.chats.map((msg, i) => {
          const isMe = (isSeeker && msg.sender === 'seeker') || (!isSeeker && msg.sender === 'tasker')
          const bgColor = isMe ? (isSeeker ? 'bg-orange-500' : 'bg-teal-600') : 'bg-white border border-gray-200'
          const textColor = isMe ? 'text-white' : 'text-gray-800'
          const avatarUri = msg.sender === 'seeker' ? SEEKER_AVATAR : TASKER_AVATAR
          return (
            <View key={i} className={`flex-row mb-3 ${isMe ? 'justify-end' : ''}`} style={{ maxWidth: '85%', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
              {!isMe && <Image source={{ uri: avatarUri }} className="w-7 h-7 rounded-full mt-0.5 border mr-2" />}
              <View className={`${bgColor} p-3 rounded-2xl ${isMe ? 'rounded-tr-none' : 'rounded-tl-none'} shadow-sm`}>
                <Text className={`text-xs leading-relaxed ${textColor}`}>{msg.text}</Text>
                <Text className={`text-[9px] mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>{msg.time}</Text>
              </View>
            </View>
          )
        })}
      </ScrollView>

      <View className="p-2.5 border-t border-gray-200 bg-white flex-row items-center space-x-2">
        <TextInput value={inputText} onChangeText={setInputText} placeholder="Nhập tin nhắn..." placeholderTextColor="#9ca3af"
          className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-xs" onSubmitEditing={handleSend} />
        <TouchableOpacity onPress={handleSend}
          className={`w-10 h-10 rounded-full items-center justify-center ${isSeeker ? 'bg-orange-500' : 'bg-teal-600'}`}>
          <FontAwesome name="paper-plane" size={12} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  )
}
