import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { EmptyState } from "@/components/shared/EmptyState";
import { Avatar } from "@/components/shared/Avatar";
import { useGiGood } from "@/lib/GiGoodContext";
import { useJobs } from "@/hooks/useJobs";

export default function ChatListScreen() {
  const { state } = useGiGood();
  const { getJobById } = useJobs();
  const role = state.auth.currentRole;

  const chatJobs = state.data.jobs.filter(j => (j.status === "assigned" || j.status === "completed") && j.chats.length > 0);

  const handleOpenChat = (jobId: number) => {
    state.ui; 
    router.push(`/(app)/chat/${jobId}` as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-xl font-bold text-gray-800">Tin nhắn</Text>
      </View>
      {chatJobs.length === 0 ? (
        <EmptyState
          icon="💬"
          title="Chưa có tin nhắn"
          subtitle={role === "seeker" ? "Khi có tasker nhận việc, bạn sẽ trao đổi tại đây" : "Nhận việc để bắt đầu trò chuyện"}
        />
      ) : (
        <FlatList
          data={chatJobs}
          keyExtractor={item => item.id.toString()}
          contentContainerClassName="p-4 pt-0"
          renderItem={({ item }) => {
            const lastChat = item.chats[item.chats.length - 1];
            const partnerName = role === "seeker" ? item.taskerName : item.seekerName;
            return (
              <TouchableOpacity
                onPress={() => handleOpenChat(item.id)}
                className="flex-row items-center bg-white rounded-xl p-3 mb-2"
              >
                <Avatar name={partnerName ?? "?"} size={48} />
                <View className="flex-1 ml-3">
                  <View className="flex-row justify-between">
                    <Text className="font-semibold text-gray-800">{partnerName}</Text>
                    <Text className="text-xs text-gray-400">{lastChat?.time ?? ""}</Text>
                  </View>
                  <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>
                    {lastChat?.text ?? ""}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
