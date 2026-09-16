import { useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChatBubble } from "../../../components/ui/ChatBubble";
import { useGiGood } from "../../../lib/GiGoodContext";
import { useChat } from "../../../hooks/useChat";

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobId = parseInt(id ?? "0", 10);
  const { state } = useGiGood();
  const { sendChat } = useChat();
  const role = state.auth.currentRole;
  const job = state.data.jobs.find(j => j.id === jobId) || null;
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim() || !job) return;
    sendChat(jobId, role, text.trim());
    setText("");
  };

  if (!job) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-gray-500">Không tìm thấy cuộc trò chuyện</Text>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View className="px-4 py-2 bg-white border-b border-gray-200">
        <Text className="font-semibold text-gray-800">{job.title}</Text>
        <Text className="text-xs text-gray-400">
          {role === "seeker" ? job.taskerName : job.seekerName}
        </Text>
      </View>

      <FlatList
        data={job.chats}
        keyExtractor={(_, i) => i.toString()}
        contentContainerClassName="p-4 pb-2"
        inverted={false}
        renderItem={({ item }) => (
          <ChatBubble message={item} isOwn={item.sender === role} />
        )}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center pt-20">
            <Text className="text-gray-400">Chưa có tin nhắn</Text>
          </View>
        }
      />

      <View className="flex-row items-center bg-white border-t border-gray-200 px-3 py-2">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Nhập tin nhắn..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2 text-gray-800"
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim()}
          className="bg-teal-600 rounded-full w-10 h-10 items-center justify-center"
        >
          <Text className="text-white text-lg">➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
