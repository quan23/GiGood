import { View, Text } from "react-native";
import type { ChatMessage } from "@/types";

interface Props {
  message: ChatMessage;
  isOwn: boolean;
}

export function ChatBubble({ message, isOwn }: Props) {
  return (
    <View className={`mb-3 ${isOwn ? "items-end" : "items-start"}`}>
      <View
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isOwn ? "bg-green-600 rounded-tr-sm" : "bg-gray-100 rounded-tl-sm"}`}
      >
        <Text className={`text-base leading-5 ${isOwn ? "text-white" : "text-gray-900"}`}>{message.text}</Text>
      </View>
      <Text className={`text-xs text-gray-400 mt-1 ${isOwn ? "text-right" : "text-left"}`}>{message.time}</Text>
    </View>
  );
}
